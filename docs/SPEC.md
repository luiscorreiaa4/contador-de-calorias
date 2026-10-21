# Especificação de Requisitos e Regras de Negócio (SPEC.md)

Este documento descreve detalhadamente os Requisitos Funcionais (RFs) e as regras de negócio vigentes no código-fonte do **CalorieSync**. Todas as afirmações foram verificadas diretamente na implementação.

---

## 1. Requisitos Funcionais (RFs)

### RF-001: Autenticação, Confirmação de E-mail, Recuperação de Senha e Sessão [CONFIRMADO]
- **Endpoints públicos de autenticação (`/api/auth/*`, todos com `Cache-Control: no-store`):**
  - `POST /api/auth/register`: Cadastro com nome, e-mail e senha forte. Responde **202** genérico,
    sem JWT. Conta já verificada não é alterada; o dono recebe um aviso por e-mail.
  - `POST /api/auth/verify-email`: Valida o código de 6 dígitos, marca `email_verified_at` e
    devolve **200** com `{ user, token }`.
  - `POST /api/auth/resend-code`: Reemite o código para conta existente e não verificada; resposta
    **202** genérica.
  - `POST /api/auth/login`: Autentica e devolve **200** com `{ user, token }` somente para conta
    verificada. Senha correta + conta não verificada devolve **403** com
    `code: "EMAIL_NOT_VERIFIED"` e dispara um novo código (respeitando o cooldown).
  - `POST /api/auth/forgot-password`: Gera link de reset apenas para conta existente e verificada;
    resposta **202** genérica.
  - `POST /api/auth/reset-password`: Atualiza a senha na mesma transação em que consome o token e
    incrementa `token_version`; resposta **200** sem sessão.
- **Endpoints autenticados de conta:**
  - `GET /api/users/me`: Dados cadastrais do usuário logado (sem hash de senha).
  - `PUT /api/users/me`: Atualização de dados cadastrais, biometria e credenciais.
  - `DELETE /api/users/me`: Exclusão definitiva mediante confirmação com a senha atual.
  - `PUT /api/users/me/onboarding`: Conclusão única do onboarding.
- **Regras de Negócio:**
  - **Criptografia:** Senhas são protegidas com `bcrypt` (fator de custo 10 em desenvolvimento/produção; custo 1 em ambiente de testes para agilidade).
  - **Política de Senha Forte (PC-08 / SEC-004):** O cadastro, a redefinição e a alteração de credenciais exigem senha com no mínimo 8 caracteres, no máximo 72 caracteres, e obrigatoriedade de ao menos uma letra e um número (`/(?=.*[a-zA-Z])(?=.*[0-9])/`).
  - **Mitigação de Timing Attack no Login (PC-08 / SEC-005):** Caso o e-mail não seja encontrado no banco durante `POST /api/auth/login`, uma verificação `bcrypt.compare` contra um hash dummy pré-computado é executada antes do retorno 401, equalizando o tempo de resposta e prevenindo a enumeração de contas por temporização.
  - **Tokens JWT com revogação (A8):** A sessão usa token Bearer HS256 assinado com `JWT_SECRET` (mínimo de 32 caracteres), validade configurável por `JWT_EXPIRES_IN` (padrão `7d`) e claim `tv` (`token_version`). O middleware consulta `users.token_version` no banco e rejeita com 401 quando o usuário não existe ou o valor diverge. Troca autenticada de senha ou e-mail incrementa a versão e devolve um token novo.
  - **Confirmação de e-mail (BL-12 / A2):** Código de 6 dígitos gerado com `crypto.randomInt`, válido por 15 minutos, com no máximo 5 tentativas por código, uso único e emissão de novo código invalidando os anteriores. Persistência apenas do HMAC-SHA256 com `AUTH_TOKEN_PEPPER`; comparação em tempo constante. Reenvio com cooldown de 60 s e teto de 5 envios por hora por e-mail.
  - **Recuperação de senha (BL-05 / A3):** Token de 32 bytes aleatórios em base64url, persistido apenas como SHA-256, válido por 30 minutos e de uso único. O link usa o fragmento `${APP_BASE_URL}/redefinir-senha#token=...`, que não é enviado ao servidor em navegações; o frontend lê o token, limpa a URL com `history.replaceState` e o envia no corpo do POST.
  - **Sem enumeração de contas (A4):** `register`, `resend-code` e `forgot-password` respondem sempre o mesmo status e a mesma mensagem, exista ou não a conta. O envio de e-mail ocorre sem `await` após o commit e falhas são registradas sem segredos.
  - **Alteração Segura de E-mail ou Senha:** Caso o usuário altere seu e-mail ou defina uma nova senha, o envio da senha atual (`currentPassword`) é mandatório. A troca de e-mail zera `email_verified_at`, incrementa `token_version` e emite novo código de verificação para o endereço novo.
  - **Limites de autenticação (A9):** Reset por e-mail: 5/hora; `verify-email`: 10 tentativas/15 min por IP; `reset-password`: 10/hora por IP; reenvio de código: 10/15 min por IP. A chave dos limitadores fica isolada em uma única função.
  - **E-mails transacionais (A10):** Interface `Mailer` com `SmtpMailer` (nodemailer) e `MemoryMailer` (testes), escolhida por `MAIL_TRANSPORT`; `NODE_ENV=test` força memória. Proibido registrar código, token, URL de reset ou senha em logs.
  - **Exclusão com Cascata:** A exclusão de um usuário dispara remoção física imediata em todas as tabelas dependentes (`meals`, `meal_items`, `body_measurements`, `user_goals`, `email_verification_codes`, `password_reset_tokens`) por integridade referencial `ON DELETE CASCADE`.
  - **Execução Única de Onboarding (PC-07 / SEC-008):** O endpoint `PUT /api/users/me/onboarding` só pode ser concluído uma única vez. Se `onboarding_completed === true`, requisições subsequentes são bloqueadas com status `400 Bad Request` ("Onboarding já foi concluído para este usuário."), impedindo poluição da tabela `body_measurements` e recalculações espúrias. Atualizações posteriores de medidas corporais devem ocorrer via `PUT /api/users/me`.
  - **Proteção e Privacidade de Dados de Saúde no Cliente (PC-19 / SEC-018):** O armazenamento local persistente (`localStorage.getItem('user_session')`) é estritamente restrito a metadados de sessão não sensíveis (`id`, `name`, `email`, `onboarding_completed`). Dados de saúde, biometria e metas nutricionais (peso, altura, % de gordura, sexo, data de nascimento, calorias e macronutrientes) são mantidos exclusivamente em memória de execução do cliente React e hidratados via `GET /api/users/me`, impedindo o armazenamento em texto plano de dados sensíveis protegidos pela LGPD. E-mail e código de verificação nunca são gravados em `localStorage`/`sessionStorage`.

---

### RF-002: Cálculo de Taxa Metabólica Basal (TMB), TDEE e Metas Nutricionais [CONFIRMADO]
Implementado de forma pura em `backend/src/services/nutrition.service.ts` e consumido no onboarding e na atualização de metas.

#### 1. Cálculo de Idade
```ts
age = ano_atual - ano_nascimento
// Ajustado subtraindo 1 caso o aniversário ainda não tenha ocorrido no ano corrente
```

#### 2. Cálculo da Taxa Metabólica Basal (TMB)
O sistema seleciona dinamicamente a equação científica com base na disponibilidade do percentual de gordura corporal (`body_fat`):

- **Opção A: Fórmula de Katch-McArdle (quando `body_fat > 0` informado):**
  $$\text{Massa Magra (kg)} = \text{peso} \times \left(1 - \frac{\text{body\_fat}}{100}\right)$$
  $$\text{TMB} = 370 + (21.6 \times \text{Massa Magra})$$

- **Opção B: Fórmula de Mifflin-St Jeor (quando `body_fat` não informado ou nulo):**
  $$\text{TMB Base} = (10 \times \text{peso em kg}) + (6.25 \times \text{altura em cm}) - (5 \times \text{idade})$$
  - Se `sex === 'masculino'`:
    $$\text{TMB} = \text{TMB Base} + 5$$
  - Se `sex === 'feminino'` ou `sex === 'prefiro_nao_responder'`:
    $$\text{TMB} = \text{TMB Base} - 161$$

#### 3. Gasto Energético Total Diário (TDEE)
$$\text{TDEE} = \text{TMB} \times \text{Multiplicador de Atividade}$$

Multiplicadores aplicados:
- `sedentario`: 1.2
- `pouco_ativo`: 1.375
- `moderadamente_ativo`: 1.55
- `muito_ativo`: 1.725
- `extremamente_ativo`: 1.9
*(Caso nível não especificado, aplica o padrão 1.2)*.

#### 4. Calorias Sugeridas por Objetivo
- `perder_peso`: Déficit calórico de 20% ($\text{TDEE} \times 0.80$)
- `ganhar_massa`: Superávit calórico de 15% ($\text{TDEE} \times 1.15$)
- `manter_peso`: Manutenção calórica ($\text{TDEE} \times 1.0$)

#### 5. Piso Mínimo de Segurança Calórica
Para evitar dietas restritivas extremas danosas à saúde:
- Usuários do sexo masculino: Mínimo inegociável de **1500 kcal**.
- Usuárias do sexo feminino ou não respondido: Mínimo inegociável de **1200 kcal**.
Se o valor calculado for menor que o piso, o valor sugerido é elevado até o limite do piso.

#### 6. Divisão de Macronutrientes (D-15) [CONFIRMADO]
Regras de negócio de saúde aplicadas exclusivamente para geração de metas automáticas (metas manuais permanecem sob livre escolha do usuário). Valores de projeto definidos para revisão periódica por profissional de nutrição:

1. **Determinação da Massa de Referência:**
   - **Com Percentual de Gordura Conhecido (`body_fat` informado e $> 0$):**
     Utiliza a Massa Livre de Gordura (LBM) calculada pela fórmula de Katch-McArdle:
     $$\text{Massa de Referência} = \text{peso} \times \left(1 - \frac{\text{body\_fat}}{100}\right)$$
   - **Sem Percentual de Gordura:**
     - Se Obesidade ($\text{IMC} \ge 30.0$): aplica a fórmula de peso ajustado:
       $$\text{Peso Ideal (PI)} = 22.5 \times \text{altura (m)}^2$$
       $$\text{Massa de Referência (Peso Ajustado)} = \text{PI} + 0.25 \times (\text{peso} - \text{PI})$$
     - Se $\text{IMC} < 30.0$: utiliza o peso corporal atual:
       $$\text{Massa de Referência} = \text{peso}$$

2. **Cálculo Base de Macronutrientes:**
   - **Proteína:** $1.6 \text{ g/kg}$ da massa de referência, limitada a no máximo 35% das calorias totais.
   - **Gordura:** 25% das calorias totais ($9 \text{ kcal/g}$).
   - **Carboidrato:** Saldo restante das calorias totais ($4 \text{ kcal/g}$).

3. **Ordem de Ajuste para Garantia de Carboidratos (se Carboidrato $< 20\%$ das calorias):**
   - Caso o carboidrato calculado resulte em menos de 20% das calorias totais da meta:
     1. Reduzir a gordura progressivamente até o piso de 20% das calorias totais.
     2. Se o carboidrato ainda permanecer abaixo de 20%, reduzir a proteína progressivamente até o piso de $1.2 \text{ g/kg}$ da massa de referência.

4. **Invariantes e Reconciliação:**
   - **Tolerância Calórica:** A soma calórica dos macronutrientes finais fica dentro de $\pm 1\%$ da meta estipulada.
   - **Não-negatividade:** Nenhum macronutriente pode ter valor negativo.
   - **Proteção Metabólica:** O carboidrato nunca é forçado a zero por sobrecarga de proteínas e gorduras.
   - **Reconciliação Inteira:** O saldo calórico após proteína e gordura é convertido em gramas inteiras de carboidrato via $\text{round}\left(\frac{\text{kcal} - (\text{P} \times 4) - (\text{G} \times 9)}{4}\right)$, garantindo que a soma aritmética coincida exatamente com as calorias totais exibidas.

---

### RF-003: Vigência de Metas e Histórico Corporal [CONFIRMADO]
- **Endpoints:**
  - `POST /api/users/onboarding`: Conclusão do cadastro inicial, gerando a primeira meta automática e primeira medição corporal.
  - `GET /api/users/goals/active?date=YYYY-MM-DD`: Retorna a meta calórica e de macros que vigora em determinada data.
  - `POST /api/users/goals/preview`: Simula os novos cálculos com base em dados provisórios sem persistir no banco.
  - `PUT /api/users/goals`: Persiste novas metas (modo `auto` ou `manual`).
- **Regras de Negócio:**
  - **Vigência por Data (`effective_from`):** Metas são registradas na tabela `user_goals` com a chave `(user_id, effective_from)`.
  - **Preservação do Histórico:** Ao alterar metas hoje, as refeições de ontem continuam comparadas com a meta vigente ontem. A consulta ativa executa:
    ```sql
    SELECT * FROM user_goals WHERE user_id = $1 AND effective_from <= $2 ORDER BY effective_from DESC LIMIT 1;
    ```
  - **Unicidade Diária (Upsert):** Há no máximo 1 registro de meta por usuário por dia civil; alterações no mesmo dia atualizam o registro existente via `ON CONFLICT (user_id, effective_from) DO UPDATE`.
  - **Histórico de Medições:** A cada conclusão de onboarding ou alteração de peso/gordura no perfil, um registro correspondente é inserido em `body_measurements` com timestamp de medição.

---

### RF-004: Catálogo e Busca de Alimentos [CONFIRMADO]
- **Endpoints:**
  - `GET /api/foods?search=termo&limit=50&offset=0`: Busca de alimentos ativos no catálogo.
- **Regras de Negócio:**
  - **Parâmetro Único de Busca (D-09):** Aceita estritamente o parâmetro `search` (parâmetro alternativo `q` descontinuado). Validado com Zod (limite máximo de caracteres) e caracteres curinga (`%`, `_`, `\`) devidamente escapados antes da interpolação no SQL `ILIKE`.
  - **Busca Tolerante:** Termos com ou sem acentos (ex: "feijao" vs "feijão") e diferenças de maiúsculas/minúsculas encontram os mesmos itens através de `f_unaccent(name) ILIKE f_unaccent($1)`.
  - **Ordenação por Similaridade:** O operador `<->` do `pg_trgm` classifica no topo os itens com maior proximidade ortográfica em relação ao que foi digitado.
  - **Contrato Público e Projeção Explícita (D-08):** Proibido `SELECT *`. A consulta projeta apenas os campos consumidos pelo cliente: `id`, `name`, `calories`, `proteins`, `carbs`, `fats`, `base_unit`, `serving_weight`, `unit_name`, `unit_weight`, `source`. Campos internos como `external_id` e `active` nunca são expostos na API.
  - **Cache HTTP (D-07):** Endpoint autenticado responde com headers `Cache-Control: private, max-age=300`, `ETag` (nativo do Express) e `Vary: Authorization`. Não utiliza cache público nem LRU global na memória do processo.
  - **Catálogo Somente-Leitura:** Não existem rotas de criação ou exclusão de alimentos para usuários finais. A base é mantida por migrações e scripts de importação de tabelas como a TACO (`backend/scripts/import-foods.ts`).
  - **Ativação Lógica:** Apenas registros com `active = true` são retornados nas consultas.

---

### RF-005: Registro e Gestão de Refeições [CONFIRMADO]
- **Endpoints:**
  - `POST /api/meals`: Registro de nova refeição com múltiplos alimentos.
  - `GET /api/meals/today?date=YYYY-MM-DD`: Listagem das refeições registradas no dia especificado.
  - `PUT /api/meals/:id`: Atualização completa do nome, horário e itens de uma refeição.
  - `DELETE /api/meals/:id`: Exclusão de refeição.
- **Regras de Negócio:**
  - **Fuso Horário Oficial e Janela Diária (D-01):**
    - O servidor é a autoridade única do fuso `America/Sao_Paulo` (`APP_TIMEZONE = 'America/Sao_Paulo'`).
    - Parâmetro `?date=YYYY-MM-DD` é validado via Zod (formato `YYYY-MM-DD`, data de calendário real entre `2000-01-01` e `hoje + 1 dia`). Na ausência do parâmetro, o servidor utiliza `todayInAppTz()` baseado em `Intl.DateTimeFormat('en-CA', { timeZone })`.
    - Datas de calendário são tratadas exclusivamente como strings (proibido `toISOString().split('T')[0]` e `new Date('YYYY-MM-DD')`).
    - A janela diária no SQL utiliza faixa em `meal_time` compatível com índices:
      `meal_time >= ($1::date)::timestamp AT TIME ZONE $tz AND meal_time < (($1::date + 1))::timestamp AT TIME ZONE $tz`
  - **Cálculo Nutricional Proporcional:**
    A base nutricional é definida por 100g ou 100ml (`serving_weight = 100`).
    Se o item utilizar unidade (`un`) e o alimento possuir `unit_weight`, a quantidade em gramas é calculada como $\text{displayAmount} \times \text{unit\_weight}$.
    O fator multiplicador aplicado é:
    $$\text{fator} = \frac{\text{quantidade final em gramas}}{\text{serving\_weight}}$$
    Cada macro do item é arredondado para uma casa decimal: $\text{Math.round}(\text{valor} \times \text{fator} \times 10) / 10$.
  - **Imutabilidade Histórica (Denormalização):** Os macros calculados são gravados diretamente nas colunas `calories`, `proteins`, `carbs` e `fats` de `meal_items`. Alterações futuras no alimento base não retroagem no diário do usuário.
  - **Atomicidade Transacional:** Toda escrita de refeição abre uma transação (`BEGIN`), grava o cabeçalho em `meals`, insere/substitui os itens em `meal_items` e encerra com `COMMIT` (ou `ROLLBACK` em caso de falha).

---

### RF-006: Estatísticas e Médias Analíticas [CONFIRMADO]
- **Endpoints:**
  - `GET /api/meals/stats?period=week|month&date=YYYY-MM-DD`: Agrupamento histórico para a página de estatísticas.
- **Regras de Negócio:**
  - **Fuso Horário no Agrupamento (D-01):** O agrupamento diário utiliza `(meal_time AT TIME ZONE $tz)::date`. É proibido o uso de `DATE(meal_time)` puro para evitar deslocamento de datas em registros noturnos.
  - **Períodos Suportados:** `week` (últimos 7 dias) ou `month` (últimos 30 dias).
  - **Agregação SQL com `LATERAL JOIN`:** O banco de dados agrupa as refeições por data e correlaciona a meta que estava em vigor em cada um dos dias do intervalo.
  - **Cálculo Justo de Médias:** As médias do período (`averages.consumed` e `averages.goal`) são calculadas dividindo a soma dos macros **exclusivamente pela quantidade de dias em que houve registros efetivos**, sem derrubar as médias artificialmente em virtude de dias em que o usuário não registrou consumo.
  - **Preenchimento de Lacunas:** Para visualização correta nos gráficos, dias do período sem qualquer registro são retornados com zeros em calorias e macronutrientes.

---

## 2. Tratamento Centralizado de Erros e Contratos de API (D-10) [CONFIRMADO]

1. **Contrato Universal de Resposta:**
   Toda resposta HTTP da API segue estritamente:
   ```json
   {
     "success": boolean,
     "data"?: any,
     "message"?: string,
     "code"?: string
   }
   ```
   `code` é opcional e carrega códigos de negócio estáveis consumidos pelo cliente, como
   `EMAIL_NOT_VERIFIED`, `INVALID_VERIFICATION_CODE`, `INVALID_RESET_TOKEN` e `USER_NOT_FOUND`.
   Códigos HTTP adicionais do fluxo de autenticação: `202 Accepted` para respostas genéricas sem
   corpo de sessão e `403 Forbidden` para credencial válida com e-mail ainda não confirmado.
2. **Hierarquia de Erros Tipados (`AppError`):**
   - Classes dedicadas estendendo `AppError`: `ValidationError` (400), `UnauthorizedError` (401), `NotFoundError` (404), `ConflictError` (409).
   - Encaminhamento assíncrono via `asyncHandler` para o Express 4 delegar ao `next(err)`.
3. **Tratamento Centralizado e Mascaramento de 500:**
   - Erros desconhecidos respondem status `500` com mensagem genérica opaca (`"Erro interno do servidor"`).
   - Proibido expor `err.message` ou stack traces em respostas JSON. Detalhes reais são registrados unicamente em `console.error` no servidor.
   - Códigos de erro do PostgreSQL são mapeados sem vazamento de strings cruas: `23505` (unique violation) → 409, `23503` (foreign key) → 409, `22P02` (invalid syntax) → 400, demais → 500.
