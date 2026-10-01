# ROADMAP.md: guia de desenvolvimento daqui pra frente

Documento vivo. Atualize o status ao fechar cada tarefa. Cada item vira uma tarefa no formato `TASK_TEMPLATE.md`.

## 1. Como trabalhamos (resumo)

1. Uma tarefa por vez, pequena e verificável. Uma sessão nova de IA por tarefa, apoiada em `CLAUDE.md` e nos docs.
2. A IA propõe o plano, você aprova, depois ela implementa e se autoverifica (`npm run test`, `lint`, `build`).
3. Você revisa o diff e testa o fluxo real nos marcos (seção 5), não em cada passo.
4. Ao fechar a tarefa: commit atômico e atualização do status do RF em `SPEC.md`.
5. Nenhuma feature nova entra antes da Fase 0 estar concluída.

## 2. O que a auditoria mudou na ordem

- **Segredos no histórico do git** (`JWT_SECRET`, `DB_PASSWORD=1234`): é o primeiro item, antes de tudo.
- **Testes usam banco real sem isolamento**: qualquer feature nova com IA pode apagar seus dados de desenvolvimento. Resolver antes de continuar.
- **Lint falhando (4 erros)**: sem lint verde não há CI confiável.
- **Frontend sem testes**: é o que precisa existir antes do redesign e das mudanças no dashboard.
- **O modelo de dados já tem sexo, data de nascimento, peso, altura, gordura corporal e nível de atividade**, então o cálculo de TMB é viável. Faltam histórico de medidas, metas de carboidrato e gordura e um indicador de meta automática vs. manual.
- **25 testes em ~38 s não é "muito rápido".** Vale investigar (custo do bcrypt, reset de banco por teste), pode estar ligado à lentidão que você sente.

## 3. Decisões assumidas (edite se discordar)

| # | Decisão | Padrão adotado |
|---|---------|----------------|
| 1 | CI | GitHub Actions: lint + test + build a cada push/PR |
| 2 | Migrations | `node-pg-migrate` (SQL puro, sem ORM) |
| 3 | Testes de frontend | Vitest + Testing Library + MSW, consultas por role/label (não por classe CSS) |
| 4 | Base de alimentos | Base própria no Postgres, populada por script de importação (ex.: TACO), sem API externa em tempo de uso |
| 5 | Metas | Sugeridas automaticamente (Mifflin-St Jeor / Katch-McArdle) e **sempre editáveis** |

### Decisões tomadas

- **Repositório público.** Os segredos vazados são tratados como comprometidos: rotação primeiro, limpeza do histórico depois.
- **Catálogo de alimentos é somente leitura para usuários.** Usuários só criam refeições escolhendo alimentos existentes. O catálogo muda apenas por script de importação/migration.
- **Meta diária com histórico.** Cada dia é comparado com a meta que valia naquele dia; médias semanais e mensais são calculadas a partir disso.
- **Fonte dos alimentos:** começar pela TACO (algumas centenas de alimentos, boa para validar o fluxo) e avaliar a TBCA-USP (mais de 3 mil alimentos, segundo material da USP) quando precisar de volume. **Não consegui confirmar os termos de redistribuição de nenhuma das duas**, então o arquivo de dados bruto não entra no repositório público até você confirmar (ex.: e-mail para o NEPA/Unicamp).

### Ainda em aberto

- Onde vai hospedar?
- O campo `sex` aceita só dois valores? Como tratar quem não quer informar?
- Regra das médias (ver 2.3b): só dias com refeição registrada, ou todos os dias do período?

---

## 4. Fases

### Fase 0: Fundação (obrigatória antes de features)

| ID | Tarefa | Checkpoint seu |
|----|--------|----------------|
| 0.1 | **Segredos (urgente, repo público)**. Assuma que `JWT_SECRET` e `DB_PASSWORD` já estão comprometidos (um `JWT_SECRET` vazado permite forjar tokens de qualquer usuário). (1) **Você** troca os dois agora, antes de qualquer outra coisa; as sessões atuais caem, é esperado. (2) IA cria `.env.example`, valida variáveis com Zod ao iniciar (fail-fast, `JWT_SECRET` com 32+ caracteres), confirma `.env` no `.gitignore` e fora do índice. (3) Rodar `gitleaks` no histórico completo para achar qualquer outro segredo. (4) **Você** limpa o histórico (`git filter-repo`/BFG) e faz force-push; isso não apaga clones, forks e caches já existentes, por isso a rotação vem antes. (5) Ativar *secret scanning* e *push protection* no GitHub (gratuitos em repo público) e gitleaks no CI. | Sim |
| 0.2 | **Banco de testes isolado**: `contador_calorias_test`, e o runner aborta se o nome do banco não terminar em `_test`. | Sim |
| 0.3 | **Lint verde**: corrigir os 4 erros (`set-state-in-effect` no `NewMealModal`, `any` em `meal.service.ts`, variáveis não usadas nos testes). | Não |
| 0.4 | **Segurança básica**: `npm audit fix`, `helmet`, `express-rate-limit` (login/cadastro), CORS restrito por variável de ambiente. | Sim |
| 0.4b | **Catálogo de alimentos somente leitura**. O RF-002 hoje diz "criar, listar e buscar". Verificar `food.routes.ts` e a UI: se existir `POST/PUT/DELETE` acessível a usuários comuns, remover ou bloquear. Teste de integração garantindo que essas rotas não aceitam escrita. Atualizar o RF-002 no `SPEC.md`. | Sim |
| 0.5 | **Migrations**: criar a migration baseline com o schema atual e migrar o `init-db.js` para o fluxo de migrations. | Sim |
| 0.6 | **CI mínimo** (GitHub Actions com serviço Postgres): lint, test, build. Ativar proteção da branch principal. | Não |
| 0.7 | **Testes de frontend**: Vitest + RTL + MSW. Cobrir Login, Cadastro e `NewMealModal` (abrir, buscar alimento, salvar, erro). | Não |
| 0.8 | **Baseline de performance**: medir antes de otimizar (seção Fase 4). Só registrar os números. | Não |
| 0.9 | Investigar por que a suíte do backend leva ~38 s. | Não |

Pronto da fase: lint, test e build verdes no CI; segredos rotacionados; testes rodam só em banco de teste.

### Fase 1: Cálculo técnico e metas editáveis (RF-005, RF-004)

Requisito: estimar o gasto a partir do cadastro; permitir metas manuais; poder editar metas e dados corporais a qualquer momento com recálculo.

- **1.0 Fuso horário (pré-requisito do histórico)**: verificar o tipo de `meal_time` (`TIMESTAMP` sem fuso é ambíguo) e como o "dia" é calculado. Padronizar (`TIMESTAMPTZ` + fuso do usuário, ou fuso fixo se o público for só Brasil). Sem isso, uma refeição às 23h pode cair no dia seguinte e as metas e médias ficam erradas.
- **1.1 Migration**:
  - `body_measurements` (`user_id`, `weight`, `body_fat`, `measured_at`): histórico de peso e composição.
  - `user_goals` com vigência por data: `user_id`, `effective_from DATE`, `calories`, `proteins`, `carbs`, `fats`, `mode` (`auto`/`manual`), `UNIQUE (user_id, effective_from)`. A meta de um dia é a linha mais recente com `effective_from <= dia`. Não se guarda uma linha por dia: ocupa menos e as médias saem de uma consulta SQL.
  - Backfill: criar a primeira linha de cada usuário com as metas atuais de `users`, com `effective_from` na data de criação da conta.
  - As colunas `daily_*_goal` de `users` ficam só até o código migrar; depois, uma migration separada as remove (uma única fonte de verdade).
- **1.2 Service puro e testado**: `calculateEnergyTargets(profile)` retorna TMB, gasto total e meta sugerida.
  - TMB: Mifflin-St Jeor (usar Katch-McArdle quando houver % de gordura).
  - Gasto total = TMB × fator de atividade (1,2 / 1,375 / 1,55 / 1,725 / 1,9).
  - Ajuste por objetivo (déficit/superávit) como constantes configuráveis. **Confirme os percentuais.**
  - Piso mínimo de calorias sugeridas e aviso na UI de que é uma estimativa, não orientação médica.
  - Testes unitários com valores calculados à mão.
- **1.3 Endpoints**: ler/atualizar perfil e metas; ao mudar peso/altura/atividade, devolver uma **prévia** ("nova sugestão X, atual Y"). Nunca sobrescrever meta manual sem confirmação.
- **1.4 Tela de perfil/metas**: editar dados, alternar auto/manual, aplicar sugestão.
- **1.5 Dashboard** passa a comparar consumido vs. meta (fecha o pendente do RF-004).
- **Regra do histórico**: mudar a meta (manual ou por recálculo) cria uma nova vigência a partir de **hoje**. Dias passados mantêm a meta da época; editar o passado fica fora da v1. Mudar a meta duas vezes no mesmo dia sobrescreve a linha do dia.

Checkpoint seu: fórmulas, migration e qualquer texto de saúde na interface.

### Fase 2: Dashboard enxuto + página de estatísticas

- **2.1** Definir o que fica no dashboard: consumo de hoje vs. meta, barras de macros, refeições de hoje, botão de registrar refeição.
- **2.2** Nova rota (ex.: `/estatisticas`) com gastos diários, semanais e mensais, histórico e tendência de peso.
- **2.3** Backend: `/meals/stats` com parâmetros de período (dia, semana, mês) e agregação em SQL, sem buscar todas as refeições para somar no JS. Cada dia é comparado com a meta vigente naquele dia (junção com `user_goals`). Índice `meals(user_id, meal_time)`.
- **2.3b Médias**: média semanal e mensal de calorias e macros, ao lado da meta média do período. Padrão proposto: a média considera só os dias com pelo menos uma refeição registrada (dias esquecidos não puxam a média para zero) e mostra "X de Y dias registrados". **Confirme essa regra.**
- **2.4** Testes de UI para os dois fluxos.

Fazer isso antes do redesign evita redesenhar telas que vão mudar.

### Fase 3: Base de alimentos em escala (centenas a milhares)

Milhares de linhas é trivial para o Postgres **se houver índice e paginação**. O risco real está em listar tudo no frontend.

- **3.1 Migration**: colunas `source`, `external_id` e `active` (desativar em vez de apagar, porque `meal_items` referencia `foods`; as refeições antigas já guardam os valores nutricionais copiados, então correções no catálogo não alteram o histórico); `UNIQUE (source, external_id)`; extensões `pg_trgm` e `unaccent`; índice GIN trigram sobre o nome normalizado (o `unaccent` precisa de uma função wrapper `IMMUTABLE` para ser indexado).
- **3.2 Busca no backend**: tolerante a acento e caixa, ordenada por relevância, `LIMIT` fixo (20–50) e paginação. Nenhuma rota devolve a tabela inteira.
- **3.3 Frontend**: debounce (~250 ms), mínimo de 2 caracteres, `placeholderData` do React Query para não piscar, lista virtualizada se passar de ~100 itens renderizados.
- **3.4 Script de importação**: idempotente (`upsert`), com `--dry-run`, valores normalizados por 100 g, relatório de linhas rejeitadas. Roda como script separado, não no boot da aplicação. Como o repositório é público, **não versione o arquivo de dados bruto** até confirmar a licença: o script lê um arquivo local (no `.gitignore`) e a fonte é citada na interface.
- **3.5 Meta de performance**: busca com p95 < 150 ms localmente com 10 mil alimentos (ajuste se achar necessário). Medir com `EXPLAIN ANALYZE`.
- Backlog relacionado: favoritos e alimentos recentes primeiro.

Checkpoint seu: migration, script de importação (dados em massa) e licença da fonte.

### Fase 4: Passe de performance (guiado por medição)

Primeiro medir, depois mexer. Registrar os números antes e depois.

- Frontend: Lighthouse/Web Vitals, React Query Devtools (refetches excessivos), aba Network (chamadas duplicadas ou pesadas).
- Backend: log do tempo por requisição, `EXPLAIN ANALYZE` nas consultas de `/meals/stats` e listagem de refeições, procurar N+1.
- Candidatos prováveis: code-splitting por rota com `React.lazy` (o build já avisa de chunk > 500 kB), índices (`meal_items(meal_id)`, `meals(user_id, meal_time)`), `staleTime` adequado, custo do bcrypt em ambiente de teste.
- Critério: cada otimização precisa de um número que melhorou.

### Fase 5: Redesign completo do CSS

Só começa com a Fase 0.7 concluída e as telas das fases 1 e 2 estáveis.

1. **Direção visual** primeiro: escolha 2–3 referências e defina o estilo (posso ajudar a montar o briefing).
2. **Design tokens**: cores, tipografia, espaçamento, raios e sombras centralizados no tema do Tailwind/variáveis CSS. Trocar o visual depois vira editar tokens.
3. **Componentes base** (Button, Input, Card, Modal, Select) antes das telas.
4. **Tela por tela**, uma tarefa por tela: Login → Dashboard → Estatísticas → Perfil → demais.
5. Regra: o comportamento não muda. Os testes de UI devem continuar passando (por isso consultas por role/label, não por classe).
6. Verificar contraste, foco de teclado e dark mode em cada tela.

---

## 5. Onde a IA vai sozinha e onde você entra

| Autonomia alta (você confere no fim) | Seu checkpoint obrigatório |
|---|---|
| Services puros com testes, refactors cobertos por teste, correções de lint, componentes de UI com teste | Migrations, autenticação/segurança, fórmulas de saúde, importação de dados em massa, qualquer `DELETE`/`DROP`, mudanças de CI e dependências |

## 6. Ciclo de cada tarefa

1. Preencher `TASK_TEMPLATE.md` (peça à IA um rascunho e você ajusta).
2. Sessão nova: a IA lê `CLAUDE.md`, `SPEC.md` e a tarefa, e **propõe o plano sem codar**.
3. Você aprova o plano. Implementação com testes (nos pontos críticos, testes primeiro).
4. A IA roda `test`, `lint`, `build` e só então reporta.
5. Você revisa o diff e testa o fluxo real.
6. Commit atômico + atualizar status do RF no `SPEC.md` + remover o item resolvido do `TECH_DEBT.md`.

### Prompt para iniciar uma tarefa

````markdown
Leia CLAUDE.md, docs/SPEC.md, docs/ARCHITECTURE.md e docs/ROADMAP.md.
Tarefa: [ID e descrição do ROADMAP]. Critérios de aceite: [cole].
Primeiro, proponha um plano curto (arquivos a mudar, riscos, testes a escrever) e PARE para minha aprovação. Não escreva código ainda.
Depois de aprovado: implemente, rode test/lint/build e reporte o resultado real.
Não mexa em nada fora do escopo. Se algo estiver ambíguo, pergunte.
````

### Primeira tarefa (0.1, segredos)

````markdown
Tarefa 0.1. NÃO reescreva o histórico do git e NÃO apague nada do banco.
1. Crie .env.example com todas as variáveis necessárias e valores fictícios.
2. Confirme que .env está no .gitignore e que não está rastreado (se estiver, git rm --cached).
3. Adicione validação das variáveis de ambiente com Zod no backend, falhando ao iniciar se faltar algo ou se JWT_SECRET tiver menos de 32 caracteres.
4. Liste, sem executar, os passos manuais para eu rotacionar DB_PASSWORD e JWT_SECRET.
Proponha o plano antes de alterar arquivos.
````

## 7. Backlog (sem prioridade ainda)

- Recuperação de senha (exige serviço de e-mail e rota no backend)
- Refresh token em cookie HTTP-only (hoje o JWT dura 7 dias)
- LGPD: dados de saúde são dados sensíveis; revisar consentimento, política de privacidade e exportação/exclusão de dados (a exclusão de conta já existe)
- Favoritos, alimentos recentes, refeições salvas/modelos
- Hospedagem e deploy automatizado
- Repo público: adicionar `LICENSE` e `README` (e reavaliar se `TECH_DEBT.md` deve ficar público enquanto houver falhas de segurança abertas)
- Logs estruturados e monitoramento de erros

## 8. Manutenção dos documentos

- `SPEC.md`: atualizar o status do RF ao fechar cada tarefa.
- `TECH_DEBT.md`: remover o que foi resolvido, acrescentar o que for descoberto.
- `ARCHITECTURE.md`: atualizar o diagrama ER a cada migration.
- `CLAUDE.md`: manter curto (~100 linhas). Adicione a regra "sem `alert` nativo" e a lista de variáveis de ambiente.
- `/.agents`: definir uma fonte única para cada regra. Se uma regra estiver em `CLAUDE.md` e em `/.agents`, vai divergir.
