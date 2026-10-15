# Especificação de Requisitos e Regras de Negócio (SPEC.md)

Este documento descreve detalhadamente os Requisitos Funcionais (RFs) e as regras de negócio vigentes no código-fonte do **CalorieSync**. Todas as afirmações foram verificadas diretamente na implementação.

---

## 1. Requisitos Funcionais (RFs)

### RF-001: Autenticação, Gestão de Conta e Sessão [CONFIRMADO]
- **Endpoints:**
  - `POST /api/users/register`: Cadastro com nome, e-mail e senha (mínimo 6 caracteres).
  - `POST /api/users/login`: Autenticação por e-mail e senha.
  - `GET /api/users/profile`: Obtenção dos dados cadastrais do usuário logado (excluindo hash de senha).
  - `PUT /api/users/profile`: Atualização de dados cadastrais, biometria e credenciais.
  - `DELETE /api/users/account`: Exclusão definitiva de conta mediante confirmação com a senha atual.
- **Regras de Negócio:**
  - **Criptografia:** Senhas são protegidas com `bcrypt` (fator de custo 10 em desenvolvimento/produção; custo 1 em ambiente de testes para agilidade).
  - **Tokens JWT:** Sessão autenticada via token Bearer assinado com `JWT_SECRET` (mínimo de 32 caracteres) e validade de 7 dias (`JWT_EXPIRES_IN=7d`).
  - **Alteração Segura de E-mail ou Senha:** Caso o usuário altere seu e-mail ou defina uma nova senha, o envio da senha atual (`currentPassword`) é mandatório.
  - **Exclusão com Cascata:** A exclusão de um usuário dispara remoção física imediata em todas as tabelas dependentes (`meals`, `meal_items`, `body_measurements`, `user_goals`) por integridade referencial `ON DELETE CASCADE`.

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

#### 6. Divisão de Macronutrientes (D-15)
A repartição é baseada em evidências científicas de nutrição esportiva e clínica (ISSN / Aragon / Wilkens):
1. **Determinação do Peso de Referência:**
   - **Com Percentual de Gordura Conhecido (`body_fat`):**
     - Se adiposidade elevada ($\ge 25\%$ masculino ou $\ge 32\%$ feminino): baseia na **Massa Livre de Gordura (LBM)**, com **Proteínas** a $2.2 \text{ g/kg LBM}$ e **Gorduras** a $\max(0.8 \text{ g/kg LBM}, 25\% \text{ das calorias})$.
     - Se composição corporal padrão/atlética: **Proteínas** a $2.0 \text{ g por kg de peso corporal}$ e **Gorduras** a $1.0 \text{ g por kg de peso corporal}$.
   - **Sem Percentual de Gordura:**
     - Se sobrepeso acentuado ou obesidade ($\text{IMC} \ge 28.0$): aplica o **Peso Ajustado de Wilkens**:
       $$\text{Peso Ideal} = 24.0 \times \text{altura (m)}^2$$
       $$\text{Peso Ajustado} = \text{Peso Ideal} + 0.25 \times (\text{Peso Real} - \text{Peso Ideal})$$
       **Proteínas:** $2.0 \text{ g por kg de Peso Ajustado}$ | **Gorduras:** $0.8 \text{ g por kg de Peso Ajustado}$.
     - Se $\text{IMC} < 28.0$: **Proteínas** a $2.0 \text{ g por kg de peso corporal}$ e **Gorduras** a $1.0 \text{ g por kg de peso corporal}$.
2. **Garantia de Carboidratos (Trava de Segurança Metabólica):**
   - Proteína e gordura somadas não podem ultrapassar 75% das calorias totais, assegurando no mínimo 25% de calorias destinadas a carboidratos para suporte glicolítico e função tireoidiana.
3. **Reconciliação Aritmética de Carboidratos:**
   - O saldo de calorias é convertido diretamente em carboidratos inteiros ($4 \text{ kcal/g}$):
     $$\text{Carboidratos (g)} = \text{round}\left(\frac{\text{Calorias Sugeridas} - (\text{Proteínas} \times 4) - (\text{Gorduras} \times 9)}{4}\right)$$
   - Evita divergências aritméticas entre a soma física dos macros e o valor de calorias totais exibido ao usuário.

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
  - **Busca Tolerante:** Termos com ou sem acentos (ex: "feijao" vs "feijão") e diferenças de maiúsculas/minúsculas encontram os mesmos itens através de `f_unaccent(name) ILIKE f_unaccent($1)`.
  - **Ordenação por Similaridade:** O operador `<->` do `pg_trgm` classifica no topo os itens com maior proximidade ortográfica em relação ao que foi digitado.
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
  - **Períodos Suportados:** `week` (últimos 7 dias) ou `month` (últimos 30 dias).
  - **Agregação SQL com `LATERAL JOIN`:** O banco de dados agrupa as refeições por data e correlaciona a meta que estava em vigor em cada um dos dias do intervalo.
  - **Cálculo Justo de Médias:** As médias do período (`averages.consumed` e `averages.goal`) são calculadas dividindo a soma dos macros **exclusivamente pela quantidade de dias em que houve registros efetivos**, sem derrubar as médias artificialmente em virtude de dias em que o usuário não registrou consumo.
  - **Preenchimento de Lacunas:** Para visualização correta nos gráficos, dias do período sem qualquer registro são retornados com zeros em calorias e macronutrientes.
