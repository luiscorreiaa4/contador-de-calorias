# Diário de Execução de Agente (AGENT_LOG.md)

Este arquivo registra a execução autônoma em lote do plano de correção dos itens de Corrigir Agora (CA).

## 0. Linha de Base (Executada em 15/10/2026)

- **Backend Tests (`npm run test` / `npm --prefix backend test`):**
  - **Status:** PASSOU (37 testes passaram, 0 falhas, 11 suítes).
- **Backend Build (`npm --prefix backend run build`):**
  - **Status:** PASSOU (`tsc` código 0).
- **Lint Monorepo / Frontend (`npm run lint` / `npm --prefix frontend run lint`):**
  - **Status:** PASSOU (código 0).
- **Frontend Build (`npm run build` / `npm --prefix frontend run build`):**
  - **Status:** FALHOU (código 1).
  - **Erro:** TS2322 em `src/components/meals/NewMealModal.tsx:454,460` (generics incompatíveis do `react-select`).
- **Frontend Tests (`npm --prefix frontend test`):**
  - **Status:** FALHOU (3 arquivos falharam, 2 passaram; 9 testes falharam, 4 passaram; 1 erro não tratado do MSW em `StatsPage.test.tsx`).
  - **Falhas:**
    - `LoginForm.test.tsx`: 3 testes falharam.
    - `RegisterForm.test.tsx`: 4 testes falharam.
    - `NewMealModal.test.tsx`: 2 testes falharam.
    - `StatsPage.test.tsx`: Unhandled rejection do MSW.

---

## 1. Execução dos Itens (Ordem: CA-02, CA-08, CA-03, depois CA em ordem numérica)

### CA-02: Corrigir generics do react-select em NewMealModal.tsx
- **Status:** CORRIGIDO
- **Ação:** Criação do tipo `FoodOption` e aplicação explícita de generics `<FoodOption, false>` no componente `Select` e em `CustomMenuList` (`MenuListProps<FoodOption, false>`).
- **Validação:** `tsc -b && vite build` passou com sucesso (0 erros). Testes do backend e lint passaram com sucesso.
- **Commit:** `c81d59f`

### CA-08: Restaurar npm run lint (prefer-const e diretivas órfãs)
- **Status:** CORRIGIDO
- **Ação:** Variável `timeToUse` confirmada como `const`, diretiva órfã na `:181` removida e escopo de lint mantido limpo com 0 erros e 0 warnings.
- **Validação:** `npm run lint` passou com código 0 em todo o repositório.
- **Commit:** `fc7416c`

### CA-03: Restaurar suíte do frontend (MSW + RTL)
- **Status:** CORRIGIDO
- **Ação:**
  - `frontend/src/mocks/handlers.ts`: corrigido contrato de `/foods` para retornar `{ foods: [...], total: 2 }` e adicionado handler para `GET /meals/stats`.
  - `frontend/src/components/auth/LoginForm.test.tsx`: alinhadas consultas por acessibilidade com texto do botão (`Acessar Dashboard`), label (`Email`) e mensagens de validação.
  - `frontend/src/components/auth/RegisterForm.test.tsx`: alinhada consulta da label `Email` e mensagem de validação correspondente.
  - `frontend/src/components/meals/NewMealModal.test.tsx`: alinhadas buscas case-insensitive para alimento (`ARROZ BRANCO`), label `NOME`, unidade `150 G` e botão `CRIAR REFEIÇÃO`.
- **Validação:** `npm --prefix frontend test` com 13/13 testes passando (5 arquivos, 0 erros). `npm run test`, `npm run lint` e `npm run build` 100% verdes.
- **Commit:** `7cb617a`

### CA-01: Remover fallback de JWT_SECRET
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/middlewares/auth.ts`: remoção de `|| 'fallback_jwt_secret'` e uso estrito de `env.JWT_SECRET`.
  - `backend/src/services/user.service.ts`: remoção de `|| 'fallback_jwt_secret'` e uso estrito de `env.JWT_SECRET`.
  - `backend/tests/unit/auth.middleware.test.ts`: teste unitário criado garantindo rejeição (401) de tokens assinados com chaves fallback inseguras e validação com `env.JWT_SECRET`.
- **Validação:** 40 testes de backend passando (12 suítes), lint limpo e build verde.
- **Commit:** `6d59b0f`

### CA-04: Fuso horário em vigência de metas (Intl America/Sao_Paulo)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/utils/date.ts`: criado módulo de data com `getSaoPauloDateString` fixando `America/Sao_Paulo` via `Intl.DateTimeFormat('en-CA', ...)` (conforme decisão D-01).
  - `backend/src/services/user.service.ts`: substituídas chamadas a `toISOString().split('T')[0]` por `getSaoPauloDateString()` nas linhas 106, 268 e 288.
  - `backend/src/services/meal.service.ts`: substituída chamada a `toISOString().split('T')[0]` por `getSaoPauloDateString(d)` na linha 175.
  - `backend/tests/unit/date.util.test.ts`: teste unitário reproduzindo a virada indevida de data após as 21h BRT e comprovando a estabilidade com `getSaoPauloDateString`.
- **Validação:** 43 testes de backend passando (13 suítes), lint limpo e build verde.
- **Commit:** `0278db0`

### CA-05: SSL estrito no pool de conexões (rejectUnauthorized: true)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/config/env.ts`: adicionada variável opcional `DB_SSL_CA` ao `envSchema`.
  - `backend/src/database/pool.ts`: implementada e exportada função `getSslConfig()` que aplica SSL estrito com `rejectUnauthorized: true` em ambiente de produção, suportando CA personalizado via `DB_SSL_CA` (conforme decisão D-19).
  - `backend/tests/unit/pool.ssl.test.ts`: testes unitários garantindo que `rejectUnauthorized` nunca seja `false`, cobrindo cenários com e sem `DB_SSL_CA`.
- **Validação:** 46 testes de backend passando (14 suítes), lint limpo e build verde.
- **Commit:** `8863ad8`

### CA-06: Rotacionar segredos vazados no commit 24d1ce65
- **Status:** PULADO
- **Motivo:** Bloqueado por D-12 (decisão sobre expurgo definitivo do histórico via `git filter-repo`/BFG vs apenas rotação pendente de definição do desenvolvedor).

### CA-07: Remover senha hardcoded do script db:reset:test
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/package.json`: substituída a connection string com senha em texto puro por `node-pg-migrate --database-url-var DATABASE_URL_TEST up`.
  - `backend/.env.example`: documentada a variável `DATABASE_URL_TEST`.
- **Validação:** Verificado cumprimento das regras de segurança; 46 testes de backend passando (14 suítes), lint limpo e build verde.
- **Commit:** `d503412`

### CA-09: Ajuste do cálculo de idade (calculateAge com parse local YYYY-MM-DD)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/services/nutrition.service.ts`: ajustada a função `calculateAge` para extrair diretamente os componentes de ano, mês e dia no padrão `YYYY-MM-DD`, prevenindo o recuo de 1 dia gerado pelo parse UTC padrão do JavaScript no fuso horário brasileiro.
  - `backend/tests/unit/nutrition.service.test.ts`: criados testes unitários validando limites de aniversário, vésperas e virada de ano em 01 de janeiro.
- **Validação:** 48 testes de backend passando (15 suítes), lint limpo e build verde.
- **Commit:** `1df3505`

### CA-10: Mascarar mensagens internas do banco de dados em respostas HTTP 500
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/controllers/user.controller.ts`, `backend/src/controllers/meal.controller.ts`, `backend/src/controllers/food.controller.ts`: atualizados todos os blocos `catch` para que qualquer resposta de erro com status HTTP 500 retorne estritamente `'Erro interno no servidor.'`, impedindo vazamento de mensagens internas do PostgreSQL (sintaxe, tipagem, constraints ou tabelas).
  - `backend/tests/integration/meal.routes.test.ts`: adicionado teste de integração reproduzindo requisição com ID inválido e validando que o corpo da resposta 500 não expõe a mensagem nativa do Postgres.
- **Validação:** 49 testes de backend passando (15 suítes), 13 testes de frontend passando (5 suítes), lint limpo (0 erros / 0 avisos) e build de produção verde.
- **Commit:** `0d6f7c4`

### CA-11: Tetos de entrada, limites de payload e sanitização de buscas
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/app.ts`: configurado limite explícito de `50kb` para `express.json({ limit: '50kb' })`.
  - `backend/src/middlewares/errorHandler.ts`: adicionado suporte a `err.status` para captura do erro 413 (`PayloadTooLargeError`).
  - `backend/src/schemas/meal.schema.ts`: adicionados tetos para `name` (`.max(100)`), `items` (`.max(50)`), `quantity` (`.max(10000)`) e `displayAmount` (`.max(10000)`).
  - `backend/src/schemas/user.schema.ts`: adicionados limites para `name` (`.max(100)`) e `password` / `newPassword` / `currentPassword` (`.max(72)` para respeitar o limite de truncamento do bcrypt).
  - `backend/src/controllers/food.controller.ts`: adicionado teto de busca `search.max(100)`.
  - `backend/src/models/food.model.ts`: sanitização e escape de caracteres curingas `%`, `_` e `\` na montagem da query `ILIKE`.
  - `backend/tests/unit/input.limits.test.ts` e `backend/tests/integration/food.routes.test.ts`: testes cobrindo todos os limites de entrada, sanitização e rejeição de payloads > 50kb com status 413.
- **Validação:** 58 testes de backend passando (16 suítes), 13 testes de frontend passando (5 suítes), lint limpo e build de produção verde.
- **Commit:** `0d3ec25`

### CA-12: Trava de ambiente seguro em scripts destrutivos (reset-db.js)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/scripts/reset-db.js`: implementada função guard `validateEnvironment()` que aborta imediatamente a execução lançando exceção caso `NODE_ENV !== 'test'` ou `DB_NAME` não termine com o sufixo `_test`. Além disso, a execução automática no carregamento do módulo foi protegida para executar apenas quando o script for chamado diretamente via CLI (`isDirectCall`).
  - `backend/tests/unit/reset_db_guard.test.ts`: testes unitários garantindo que a execução seja impedida em produção, desenvolvimento ou bases sem sufixo `_test`.
- **Commit:** `7e11139`

### CA-13: Atualização de dependências vulneráveis (proxy-addr, tar, shell-quote, brace-expansion)
- **Status:** CORRIGIDO
- **Ação:**
  - `package.json`: adicionado bloco `overrides` para `shell-quote` (`^1.12.0`) e `brace-expansion` (`^5.0.12`). Executado `npm install` na raiz, eliminando todas as vulnerabilidades críticas e altas de injeção de comando e negação de serviço (`found 0 vulnerabilities`).
  - `backend/package.json`: adicionado bloco `overrides` para `proxy-addr` (`^2.0.8`), `tar` (`^7.5.22`) e `braces` (`^3.0.3`). Executado `npm --prefix backend install`, eliminando as vulnerabilidades críticas de IP spoofing em subredes IPv4-mapped IPv6 e Directory Traversal do `node-tar`.
- **Validação:** 62 testes de backend passando (17 suítes), 13 testes de frontend passando (5 suítes), lint limpo e build de produção verde.
- **Commit:** `d02a025`

### CA-14: Desacoplamento de fuso horário do processo e envio de ?date= pelo cliente (D-01)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/services/meal.service.ts`: refatorado `getTodayMeals` para calcular limites do dia em ISO com offset explícito `-03:00` e aritmética de data ancorada em UTC/Intl de `America/Sao_Paulo`, tornando a janela diária imune ao `TZ` do ambiente hospedeiro. Refatorado `getMealStats` para passar `dateStr` para o model e computar o padding de dias do gráfico sem desvios de timezone.
  - `backend/src/models/meal.model.ts`: query de `getPeriodStats` atualizada para converter `m.meal_time AT TIME ZONE 'America/Sao_Paulo'` tanto no filtro de intervalo de datas quanto no agrupamento `GROUP BY DATE(...)`, aceitando `endDateStr` customizado.
  - `frontend/src/utils/date.ts`: criado utilitário `getLocalDateString()` retornando `YYYY-MM-DD` civil local do navegador.
  - `frontend/src/pages/private/DashboardPage.tsx`, `StatsPage.tsx`, `GoalSettingsCard.tsx`: injetado `clientDate` nas queries `getTodayMeals`, `getActiveGoal` e `getMealStats` (enviando `?date=` ao backend).
  - `backend/tests/integration/meal.routes.test.ts`: testes executados e validados com `cross-env TZ=UTC`, comprovando que refeições às 23:59 BRT são exibidas e agrupadas no dia correto mesmo quando o processo Node roda em UTC.
- **Validação:** 62 testes de backend passando (17 suítes, inclusive sob TZ=UTC), 13 testes de frontend passando (5 suítes), lint limpo e build de produção verde.

### CA-15: Validação centralizada de req.query e req.params via middleware validate (D-09)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/middlewares/validate.ts`: estendido para suportar objetos de validação compostos `{ body?, query?, params? }` mantendo compatibilidade retroativa com schemas diretos de body `validate(schema)`. Todos os erros de validação retornam status 400 padronizado.
  - `backend/src/schemas/common.schema.ts`: criados schemas padronizados e reutilizáveis `uuidParamSchema` (validação de UUID v4 em parâmetros `:id`), `dateQuerySchema` (validação de query `?date=YYYY-MM-DD`) e `statsQuerySchema` (validação de `period` 7d/30d/90d e `date`).
  - `backend/src/schemas/food.schema.ts`: criado `listFoodsQuerySchema` para validação da query de busca (`search` com máx 100 caracteres, `page` e `limit` com máx 50).
  - `backend/src/controllers/food.controller.ts`: removida validação manual imperativa `.parse()`, deixando a camada de rotas responsável exclusiva pela validação conforme arquitetura do projeto.
  - `backend/src/routes/food.routes.ts`, `meal.routes.ts`, `user.routes.ts`: associados middlewares `validate(...)` nas rotas com query ou params (`GET /api/foods`, `GET /api/meals/today`, `GET /api/meals/stats`, `DELETE /api/meals/:id`, `GET /api/users/goals/active`).
  - `docs/SPEC.md`: corrigido parâmetro de busca do catálogo para usar estritamente `search` conforme D-09.
  - `backend/tests/unit/validate.middleware.test.ts` e `backend/tests/integration/meal.routes.test.ts`: testes unitários e de integração validando rejeição com 400 em params/query inválidos e formato UUID.
- **Validação:** 65 testes de backend passando (18 suítes), 13 testes de frontend passando (5 suítes), lint limpo e build de produção verde.
- **Commit:** `9f89c22`

### CA-16: Macros para IMC alto e consistência de calorias (D-15)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/services/nutrition.service.ts`: reformulado o cálculo de macronutrientes conforme evidências científicas modernas de nutrição esportiva e clínica (ISSN, Aragon, Wilkens):
    - Para usuários com IMC >= 28.0 (sem % de gordura informado): aplicação da fórmula de Peso Ajustado de Wilkens ($peso_{ideal} + 0.25 \times (peso_{real} - peso_{ideal})$ com base em IMC 24.0), prevenindo superestimação de proteína e gordura sobre tecido adiposo inerte.
    - Para usuários com percentual de gordura elevado: cálculo proteico baseado na Massa Livre de Gordura ($2.2 \text{ g/kg LBM}$) e gorduras moderadas ($0.8 \text{ g/kg LBM}$ ou 25% das calorias).
    - Trava metabólica de segurança: calorias de proteína + gordura limitadas a no máximo 75% da meta calórica, assegurando no mínimo 25% de carboidratos para desempenho atlético e suporte tireoidiano.
    - Reconciliação aritmética direta (BUG-B04): carboidratos calculados diretamente como o saldo das calorias sugeridas após desconto de proteína e gordura, garantindo consistência com a meta diária exibida ao usuário.
  - `docs/SPEC.md`: atualizada a especificação da regra RF-002 (§6 Divisão de Macronutrientes) com a fundamentação científica e as equações de Wilkens e LBM.
  - `docs/BACKLOG.md` e `docs/ROADMAP.md`: atualizados com status CORRIGIDO e decisão D-15 formalizada.
  - `backend/tests/unit/nutrition.service.test.ts`: adicionados testes unitários validando que carboidratos não zeram e que a soma calórica dos macros coincide com a meta sugerida em perfis de IMC alto e adiposidade elevada.
- **Validação:** 67 testes de backend passando (18 suítes), 13 testes de frontend passando (5 suítes), lint limpo e build de produção verde.
- **Commit:** `7ede68f`

---

## Sessão: Formalização das Decisões D-01 a D-20 e Sincronização Geral
- **Data:** 15/10/2026
- **Branch:** `fase2`
- **Ações Realizadas:**
  - **Decisões D-01 a D-20:** Consolidada a tabela unificada na Seção 5 de `docs/BACKLOG.md` cobrindo todas as 20 decisões arquiteturais, de produto e de governança com regras de implementação estritas.
  - **`docs/ROADMAP.md`:**
    - Criada a **Fase 4.5: Diário Completo** (BL-02, BL-18, BL-19, BL-20) entre a Fase 4 e a Fase 5 (D-20).
    - Criada a **Fase 5.5: Pacote Compartilhado de Tipos** (`shared/` via npm workspaces) após a Fase 5 e antes do mobile (D-17).
    - Ajustada a Fase 4: `react-router` v7 (PC-21) executado antes do code-splitting (PC-20) (D-16); cache privado em foods (D-07); projeção SQL explícita (D-08); limpeza de teste (D-11); unificação de dívidas no BACKLOG.md (D-18).
    - Ajustada a Fase 5: expurgo de código morto (PC-31) executado obrigatoriamente antes de correções visuais (PC-25) (D-06).
    - Ajustada a Fase 6: ordem de autenticação BL-12 -> BL-05 -> BL-06 (D-03).
    - Ajustada a Fase 7: LGPD (BL-10) com severidade Média/M e bloqueante para lançamento público (D-04).
    - Ajustada a Fase 8: revogação de sessão (BL-04) com cookie HttpOnly + refresh token (D-02); SSL estrito e saltos em trust proxy (D-19).
  - **`AGENTS.md` e `docs/TESTING.md`:** Registrada a exceção explícita de limpeza de banco de testes em `AGENTS.md` §4 e `TESTING.md` §3 (`DELETE FROM users WHERE email LIKE 'tester-%'` com runtime guard `current_database()` terminando em `_test`) conforme D-11.
  - **`backend/src/utils/date.ts`:** Exportada constante `APP_TIMEZONE = 'America/Sao_Paulo'` e função `todayInAppTz` baseada em `Intl.DateTimeFormat('en-CA', { timeZone })` conforme D-01.
  - **`backend/src/services/nutrition.service.ts` e `backend/tests/unit/nutrition.service.test.ts`:**
    - Atualizados parâmetros do cálculo de macronutrientes da decisão D-15:
      - Massa de referência: LBM se %gordura informado; senão peso ajustado ($PI + 0.25 \times (peso - PI)$ com $PI = 22.5 \times altura^2$) para IMC >= 30; senão peso atual.
      - Proteína: 1,6 g/kg da massa de referência (limite de 35% das calorias).
      - Gordura: 25% das calorias totais.
      - Carboidrato: restante das calorias totais.
      - Ordem de ajuste se carboidrato < 20%: reduzir gordura até 20% -> reduzir proteína até 1,2 g/kg da massa de referência.
      - Invariantes: tolerância de ±1%, nenhum macro negativo, carboidrato nunca zerado, reconciliação de carboidrato inteiro.
    - Testes unitários atualizados e validados com 100% de sucesso.
  - **`docs/SPEC.md`:**
    - Atualizada a especificação RF-002 (§6 Divisão de Macronutrientes) com a fórmula D-15.
    - Atualizadas regras de RF-004 com busca por `search` (D-09), projeção explícita com `source` (D-08) e cache privado (D-07).
    - Atualizadas regras de RF-005 e RF-006 com diretrizes de fuso horário `America/Sao_Paulo` e janelas SQL indexadas (D-01).
    - Adicionada Seção 2 formalizando o tratamento centralizado de erros com `AppError`, `asyncHandler` e mascaramento de 500 (D-10).
  - **`docs/BACKLOG.md`:** Coluna de fase alvo atualizada nas tabelas 3.1 e 3.2 (BL-02 e BL-18/19/20 na 4.5, BL-03 na 5.5, BL-25 em Futura).

---

## 2. Linha de Base do Próximo Ciclo (PC) - 15/10/2026

- **Backend Tests (`npm run test`):** PASSOU (67 testes, 18 suítes, 0 falhas).
- **Backend Build (`npm --prefix backend run build`):** PASSOU (`tsc` código 0).
- **Lint Monorepo (`npm run lint`):** PASSOU (código 0).
- **Frontend Build (`npm run build`):** PASSOU (`tsc -b && vite build` código 0).
- **Frontend Tests (`npm --prefix frontend test -- --run`):** PASSOU (13 testes, 5 suítes, 0 falhas).

---

## 3. Execução dos Itens do Próximo Ciclo (PC)

### PC-01: Eliminar testes falso-positivos (cálculo nutricional e busca com acentos)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/services/meal.service.ts`: exportada função `calculateItemNutrients` para permitir testes unitários diretos.
  - `backend/tests/meal.test.ts`: suíte `Nutritional Factor Calculations` refatorada para importar e chamar `calculateItemNutrients` com cenários reais (gramas, ml, unidades), eliminando variáveis locais e contas tautológicas isoladas.
  - `backend/tests/integration/food.routes.test.ts`: substituída a asserção no-op por verificação real de que o resultado da busca insensível a acentuação (`search=maca`) retorna alimentos contendo "Maçã".
### PC-14: Limpeza determinística do banco de testes (D-11)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/tests/helpers/db.ts`: criado módulo de suporte a testes com função `assertIsTestDatabase` (trava em runtime que valida sufixo `_test` antes de qualquer deleção) e `cleanupTestData(pattern = 'tester-%')` com exclusão em cascata parametrizada por prefixo.
  - `backend/tests/unit/db_cleanup.test.ts`: testes unitários validando bloqueio contra bancos sem sufixo `_test`, rejeição de padrões que não iniciem com `tester-` e confirmação de deleção efetiva.
  - `backend/tests/integration/food.routes.test.ts`, `meal.routes.test.ts`, `user.routes.test.ts`: padronização de e-mails de teste com prefixo `tester-` e chamada determinística de `cleanupTestData` no hook `after()`.
- **Validação:** 70 testes de backend passando (19 suítes), 13 testes de frontend passando, lint 0 erros, build verde.

### PC-18: Testes de integração de autorização multiusuário (IDOR)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/models/meal.model.ts`: adicionado `statusCode = 404` explícito quando `updateMealWithItems` não encontra a refeição ou quando ela pertence a outro usuário, prevenindo status 500 indevido.
  - `backend/tests/integration/authorization.test.ts`: criada suíte completa de isolamento multiusuário instanciando `Usuário A` e `Usuário B` com namespaces isolados, garantindo que `Usuário B` receba 404 ao tentar atualizar ou excluir refeição de `Usuário A`, não veja refeições de `A` em `/api/meals/today`, não receba calorias de `A` em `/api/meals/stats` e acesse unicamente seus próprios dados em `/api/users/me`.
### PC-24: Expansão de cobertura de testes de integração backend
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/tests/integration/user.routes.test.ts`: adicionados 9 novos testes de integração cobrindo consulta de perfil (`GET /me`), fluxo completo de onboarding com cálculo de metas e medidas (`PUT /me/onboarding`), simulação de metas (`POST /me/preview-goals`), metas manuais com vigência (`PUT /me/goals` e `GET /me/goals`), atualização protegida de perfil com validação de senha (`PUT /me`) e exclusão de conta com senha e bloqueio de acessos subsequentes (`DELETE /me`).
  - `backend/tests/integration/meal.routes.test.ts`: adicionados 3 novos testes de integração cobrindo atualização com substituição atômica de itens (`PUT /meals/:id`), estatísticas mensais com médias justas (`GET /meals/stats`) e exclusão com sucesso (`DELETE /meals/:id`).
- **Validação:** 89 testes de backend passando (20 suítes), 13 testes de frontend passando, lint 0 erros, build verde.

### PC-04: Remover registro duplicado de rotas no Express (ARCH-004)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/server.ts`: removida importação redundante e segundo registro de `userRoutes`, `foodRoutes` e `mealRoutes`.
  - `backend/src/app.ts`: organizados todos os imports no topo do arquivo antes da instanciação do Express e registro das rotas unificado exclusivamente antes do `errorHandler`.
  - `backend/tests/unit/routes_registration.test.ts`: teste unitário criado inspecionando a stack interna de roteamento do Express, garantindo que `/api/users`, `/api/foods` e `/api/meals` estejam registrados rigorosamente 1 única vez.
- **Validação:** 90 testes de backend passando (21 suítes), 13 testes de frontend passando, lint 0 erros, build verde.

### PC-07: Bloquear reexecução indevida de onboarding (SEC-008)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/services/user.service.ts`: adicionada checagem em `completeOnboarding` validando se `user.onboarding_completed` já é `true`. Caso positivo, aborta e lança erro com status `400 Bad Request` ("Onboarding já foi concluído para este usuário."), protegendo a tabela `body_measurements` contra poluição e recálculos espúrios.
  - `docs/SPEC.md`: atualizada a seção RF-001 documentando formalmente a regra de Execução Única de Onboarding e bloqueio subsequente com status 400.
  - `backend/tests/integration/user.routes.test.ts`: adicionado teste de integração reproduzindo e confirmando a rejeição com código HTTP 400 ao submeter requisições subsequentes ao endpoint de onboarding.
- **Validação:** 91 testes de backend passando (21 suítes), 13 testes de frontend passando, lint 0 erros, build verde.

### PC-08: Política de senha forte e mitigação de timing attack no login (SEC-004, SEC-005)
- **Status:** CORRIGIDO
- **Ação:**
  - `backend/src/schemas/user.schema.ts`: criado `strongPasswordSchema` exigindo no mínimo 8 caracteres, no máximo 72 caracteres e regex `/(?=.*[a-zA-Z])(?=.*[0-9])/` (ao menos uma letra e um número). Aplicado em `registerUserSchema.password` e `updateUserSchema.newPassword`.
  - `backend/src/services/user.service.ts`: adicionada constante `DUMMY_HASH` e chamada `await bcrypt.compare(data.password, DUMMY_HASH)` na função `login` quando o usuário não é encontrado, equalizando o tempo de resposta e mitigando timing attacks / enumeração de contas válidas.
  - `frontend/src/components/auth/RegisterForm.tsx` e `frontend/src/pages/private/EditProfilePage.tsx`: atualizada a validação client-side para exigir no mínimo 8 caracteres com letra e número.
  - `frontend/src/components/auth/RegisterForm.test.tsx` e `backend/tests/user.test.ts`: testes atualizados com senhas válidas e cobertura de rejeição para senhas fracas.
  - `backend/tests/unit/password_security.test.ts`: suíte unitária reproduzindo e confirmando as regras de senha forte e timing attack mitigation.
  - `docs/SPEC.md`: atualizado RF-001 documentando as novas políticas de segurança de credenciais.
- **Validação:** 97 testes de backend passando (22 suítes), 14 testes de frontend passando (5 suítes), lint 0 erros, build verde.
