# Avaliação e Revisão da Suíte de Testes (CalorieSync)

**Arquivo:** `docs/reviews/tests.md`  
**Data da Auditoria:** 13 de Outubro de 2026  
**Modo:** SOMENTE LEITURA (Análise Estática e Execução Determinística Local)  
**Escopo Auditado:** Testes de Backend (`/backend/tests/`), Testes de Frontend (`/frontend/src/`), Mocks de Rede MSW (`/frontend/src/mocks/`), Configurações de Runners (`node:test`, `vitest`), Cobertura de Código e Pipeline de CI (`.github/workflows/ci.yml`).

---

## 1. Sumário Executivo e Métricas Determinísticas

A auditoria da suíte de testes do **CalorieSync** avaliou as camadas de backend, frontend e integração com o banco PostgreSQL. Foram executadas ferramentas determinísticas no ambiente local (`node:test` com `--experimental-test-coverage`, `vitest run`, e análises de variação de fuso horário `TZ`).

### 1.1. Status Geral de Execução dos Testes

| Camada | Runner / Ferramenta | Total Declarado | Passando | Falhando | Status Real Verificado |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Backend** | `node:test` + `supertest` via `tsx` | 37 testes (11 suítes) | **37** | 0 | ⚠️ **Passa com ressalvas críticas**: cobertura real de linhas é de apenas 61.97% e depende de `TZ=America/Sao_Paulo` forçado. |
| **Frontend** | `Vitest 5.0.3` + RTL + MSW 2.7 | 13 testes (5 arquivos) | **1** | **12** | ❌ **Falha Crítica**: 12 dos 13 testes falham por seletores regex frágeis, labels divergentes e falta de handlers MSW. |
| **Linter** | `ESLint` | Monorepo completo | - | 1 erro, 1 aviso | ❌ Falha em `NewMealModal.tsx` (`prefer-const`). |
| **Build** | `tsc -b && vite build` | Frontend | - | 2 erros TS | ❌ Falha de tipos com `react-select`. |
| **CI** | GitHub Actions (`ci.yml`) | Pipeline completo | 0 | 3 etapas | ❌ **Quebrado na branch main** devido às falhas de lint, teste e build. |

---

### 1.2. Relatório Determinístico de Cobertura de Código do Backend

Executado via `node --import tsx --test --experimental-test-coverage "tests/**/*.test.ts"` contra o banco real `contador_calorias_test`:

```text
-----------------------------------------------------------------------------------------------------------------------------------
file                   | line % | branch % | funcs % | uncovered lines
-----------------------------------------------------------------------------------------------------------------------------------
src                    |        |          |         | 
 app.ts                |  91.18 |   100.00 |    0.00 | 26-28
 config                |        |          |         | 
  env.ts               |  82.14 |    50.00 |  100.00 | 19-23
 controllers           |        |          |         | 
  food.controller.ts   |  94.44 |    88.89 |  100.00 | 20-21
  meal.controller.ts   |  61.33 |    66.67 |   50.00 | 14-15 23-24 28-36 39-44 46-55
  user.controller.ts   |  42.33 |    66.67 |   30.00 | 13-17 24-30 33-47 50-65 67-79 82-94 98-110 114-128 130-141
 database              |        |          |         | 
  pool.ts              |  90.32 |    11.11 |    0.00 | 11-13
 middlewares           |        |          |         | 
  auth.ts              | 100.00 |    75.00 |  100.00 | 
  errorHandler.ts      |  60.00 |   100.00 |   50.00 | 5-14
  validate.ts          | 100.00 |   100.00 |  100.00 | 
 models                |        |          |         | 
  food.model.ts        |  90.38 |    83.33 |   75.00 | 34-38
  history.model.ts     |  47.37 |   100.00 |   25.00 | 8-33 36-39 41-50
  meal.model.ts        |  58.02 |    63.64 |   62.50 | 83-84 87-128 132-197
  user.model.ts        |  40.29 |   100.00 |   42.86 | 21-27 29-30 35-105 107-109
 routes                |        |          |         | 
  food.routes.ts       | 100.00 |   100.00 |  100.00 | 
  meal.routes.ts       | 100.00 |   100.00 |  100.00 | 
  user.routes.ts       | 100.00 |   100.00 |  100.00 | 
 schemas               |        |          |         | 
  meal.schema.ts       | 100.00 |   100.00 |  100.00 | 
  user.schema.ts       | 100.00 |   100.00 |  100.00 | 
 services              |        |          |         | 
  food.service.ts      |  80.95 |   100.00 |   66.67 | 13-16
  meal.service.ts      |  54.50 |    50.00 |   66.67 | 35-37 55-69 71-78 83-147
  nutrition.service.ts | 100.00 |    82.35 |  100.00 | 
  user.service.ts      |  41.04 |    50.00 |   36.36 | 9-11 22-25 34-37 41-46 49-84 88-151 153-168 172-173 176-192 195-209 212-225
-----------------------------------------------------------------------------------------------------------------------------------
TOTAL GERAL            |  61.97 |    71.65 |   55.13 | 
-----------------------------------------------------------------------------------------------------------------------------------
```

**Principais Alertas da Cobertura:**
- `user.service.ts`: apenas **41.04%** das linhas cobertas.
- `user.controller.ts`: apenas **42.33%** das linhas cobertas.
- `history.model.ts`: apenas **47.37%** das linhas cobertas e **25.00%** das funções (upsert de metas, vigência e medições corporais estão descobertos).
- `meal.service.ts`: **54.50%** das linhas cobertas.
- No frontend, o pacote de cobertura `@vitest/coverage-v8` não está instalado, impossibilitando a geração do relatório correspondente.

---

### 1.3. Divergência Crítica entre Documentação (`TESTING.md`) e Realidade

O documento [`docs/TESTING.md`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/TESTING.md) contém afirmações desatualizadas e incorretas sobre a suíte:
1. **Afirmação Falsa:** `TESTING.md:46` afirma que `user.routes.test.ts` cobre *"obtenção de perfil, fluxo de onboarding, prévia e atualização de metas com vigência, e exclusão física de conta com validação de senha"*.  
   **Realidade:** O arquivo possui **apenas 3 testes** cobrindo registro e login. Perfil, onboarding, metas e exclusão possuem **zero testes de integração**.
2. **Afirmação Falsa:** `TESTING.md:47` afirma que `meal.routes.test.ts` cobre *"atualização completa (com substituição atômica de itens), exclusão e estatísticas por período via LATERAL JOIN"*.  
   **Realidade:** O arquivo possui **apenas 3 testes** (401 sem token, setup de usuário e 1 inserção de refeição). `PUT /meals/:id`, `DELETE /meals/:id` e `GET /meals/stats` possuem **zero testes de integração**.
3. **Afirmação Falsa:** `TESTING.md:48` afirma que `food.routes.test.ts` cobre *"bloqueio de criação/edição/deleção por usuários comuns"*.  
   **Realidade:** Não há nenhum teste enviando verbos `POST`, `PUT` ou `DELETE` para `/api/foods`.
4. **Afirmação Falsa:** `TESTING.md:72` afirma que *"O banco de testes executa limpeza controlada de tabelas dependentes antes/depois das suites"*.  
   **Realidade:** Não há rotinas de `TRUNCATE` ou limpeza nos hooks `after()` dos testes. Cada execução acumula novos usuários (`tester-Timestamp@example.com`) e refeições no banco `contador_calorias_test`.

---

## 2. Catálogo Consolidado de Achados

### [TST-001] Teste Tautológico que Não Afirma Nada do Código Real em Cálculos Nutricionais
- **Arquivo:Linha:** [`backend/tests/meal.test.ts:75-115`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/tests/meal.test.ts#L75-L115)
- **Severidade:** **Alta**
- **O que está errado:** A suite `Nutritional Factor Calculations` define variáveis locais estáticas (`baseCalories = 165`, `quantity = 150`, etc.) e executa contas aritméticas locais com `Math.round`. Não importa, não invoca e não valida nenhuma linha de `meal.service.ts` ou `nutrition.service.ts`.
- **Cenário concreto de impacto:** Se a função interna `calculateItemNutrients` de `meal.service.ts` contiver erros de proporção, divisão por zero em `serving_weight`, arredondamento incorreto ou falha na conversão de unidades (`un` para gramas), este teste continuará passando com 100% de sucesso, pois só testa o operador aritmético nativo do JavaScript.
- **Como verificar/reproduzir:** Inspecione `backend/tests/meal.test.ts` linhas 75 a 115. Observe que as variáveis são declaradas no próprio escopo do teste e nenhum método da aplicação é chamado.
- **Correção sugerida:** Exportar e testar unitariamente a função `calculateItemNutrients` de `backend/src/services/meal.service.ts` passando estruturas reais de alimentos e itens, validando gramas, ml e unidades com `unit_weight`.
- **Esforço:** P

---

### [TST-002] Configuração Forçada de Fuso Horário no Runner Mascara Bug Crítico na Virada do Dia
- **Arquivo:Linha:** [`backend/package.json:9`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/package.json#L9) e [`backend/tests/integration/meal.routes.test.ts:35-62`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/tests/integration/meal.routes.test.ts#L35-L62)
- **Severidade:** **Crítica**
- **O que está errado:** O script `test` injeta `TZ=America/Sao_Paulo`. No serviço `meal.service.ts:68-74`, a data do cliente é processada com `new Date(year, month - 1, day)` (usando o timezone do processo Node) e convertida para UTC com `.toISOString()`. Em qualquer ambiente onde o fuso horário seja UTC (padrão de containers Docker, AWS, Render e GitHub Actions sem a variável `TZ`), a consulta `today.toISOString()` gera limites UTC incompatíveis e a refeição das 23:59 BRT desaparece do dia.
- **Cenário concreto de impacto:** Em produção rodando sob Linux/Docker com relógio em UTC, qualquer refeição cadastrada por usuários brasileiros entre 21:00 e 23:59 desaparece do dashboard do dia corrente e cai no dia seguinte ou é omitida.
- **Como verificar/reproduzir:** Execute o teste isolado forçando fuso UTC:
  ```bash
  npx cross-env NODE_ENV=test DB_NAME=contador_calorias_test TZ=UTC tsx --test tests/integration/meal.routes.test.ts
  ```
  O teste falha deterministicamente com:
  `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 0 !== 1` na linha 53.
- **Correção sugerida:** 
  1. Alterar a lógica de busca diária em `meal.service.ts` e `meal.model.ts` para receber o timezone do usuário ou realizar o cálculo de janela com timestamp offset explícito no SQL (`AT TIME ZONE`).
  2. Adicionar testes de fuso executando com múltiplos fusos parametrizados independentemente do `TZ` do processo hospedeiro.
- **Esforço:** M

---

### [TST-003] Ausência Completa de Testes de Autorização e Isolamento Multiusuário (IDOR)
- **Arquivo:Linha:** [`backend/tests/integration/meal.routes.test.ts`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/tests/integration/meal.routes.test.ts) e [`backend/tests/integration/user.routes.test.ts`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/tests/integration/user.routes.test.ts)
- **Severidade:** **Crítica**
- **O que está errado:** Não existe um único teste no repositório que instancie dois usuários distintos (`User A` e `User B`) para verificar se as rotas impedem o acesso cruzado a dados privados.
- **Cenário concreto de impacto:** Se uma futura refatoração em `meal.model.ts` (ex: `deleteMealById` ou `updateMealWithItems`) omitir o filtro `AND user_id = $2`, ou se uma rota de perfil vazar dados pelo ID, nenhum teste falhará. Usuários poderão alterar e excluir refeições de terceiros ou visualizar histórico calórico alheio (vulnerabilidade IDOR).
- **Como verificar/reproduzir:** Busque em toda a pasta `backend/tests/` por testes com múltiplos tokens. Verifique que todos os testes usam exclusivamente um único token por arquivo.
- **Correção sugerida:** Criar arquivo `backend/tests/integration/authorization.test.ts` criando `userA` e `userB` e assegurando:
  - `User B` recebe `404` ou `403` ao tentar `PUT /api/meals/:id` ou `DELETE /api/meals/:id` de `User A`.
  - `User B` não enxerga refeições de `User A` em `GET /api/meals/today`.
  - `User B` não recebe agregações de `User A` em `GET /api/meals/stats`.
- **Esforço:** M

---

### [TST-004] Asserção Inócua (No-op) no Teste de Busca com Acentos (`food.routes.test.ts`)
- **Arquivo:Linha:** [`backend/tests/integration/food.routes.test.ts:34-43`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/tests/integration/food.routes.test.ts#L34-L43)
- **Severidade:** **Média**
- **O que está errado:** O teste intitulado `'GET /api/foods - buscar com acento (maca -> Maçã)'` envia query `?search=maca`, mas afirma apenas:
  ```ts
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  ```
  O próprio autor inseriu comentário no teste: `// Apenas testamos se a busca não quebrou. Como a base pode ter ou não Maçã, checamos pelo menos sucesso.` Não há verificação se o alimento "Maçã" foi retornado nem se o array possui itens.
- **Cenário concreto de impacto:** Se a extensão `unaccent` ou o operador `<->` do `pg_trgm` quebrar no banco e a query retornar `[]` (vazio), o teste continuará passando normalmente com falso positivo.
- **Como verificar/reproduzir:** Inspecione `backend/tests/integration/food.routes.test.ts:34-43`.
- **Correção sugerida:** Criar uma fixture determinística que insere um alimento de teste com acentuação (ex: `"Pão Francês"` ou `"Maçã Fuji"`) e verificar:
  ```ts
  assert.ok(res.body.data.foods.some((f: any) => f.name.includes('Maçã')));
  ```
- **Esforço:** P

---

### [TST-005] Contrato do Mock MSW Incompatível com o Retorno Real da API de Alimentos
- **Arquivo:Linha:** [`frontend/src/mocks/handlers.ts:34-59`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/mocks/handlers.ts#L34-L59) vs [`backend/src/models/food.model.ts:37-40`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/food.model.ts#L37-L40)
- **Severidade:** **Alta**
- **O que está errado:** O handler MSW para `GET /foods` retorna `{ success: true, data: [ ...alimentos ] }` (array diretamente na propriedade `data`). A API real do backend retorna `{ success: true, data: { foods: [...], total: 10 } }`. O serviço do frontend (`food.service.ts:16-19`) espera `{ foods: Food[]; total: number }`.
- **Cenário concreto de impacto:** No componente `NewMealModal.tsx:81`, `foodsData?.foods` resulta em `undefined` sob o MSW porque `foodsData` é um array. A lista de opções fica vazia e o teste `NewMealModal.test.tsx` não consegue selecionar nenhum alimento, falhando a interação de formulário.
- **Como verificar/reproduzir:** Compare a resposta mockada em `frontend/src/mocks/handlers.ts:35` com a interface `GetFoodsResponse` em `frontend/src/services/food.service.ts:16`.
- **Correção sugerida:** Alterar o handler MSW para retornar o contrato idêntico ao do backend:
  ```ts
  return HttpResponse.json({
    success: true,
    data: {
      foods: [ /* mock foods */ ],
      total: 2
    }
  });
  ```
- **Esforço:** P

---

### [TST-006] MSW Abortando Testes com Erro Fatal por Ausência de Mock da Rota de Estatísticas
- **Arquivo:Linha:** [`frontend/src/mocks/handlers.ts`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/mocks/handlers.ts) e [`frontend/src/pages/private/__tests__/StatsPage.test.tsx:11-20`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/__tests__/StatsPage.test.tsx#L11-L20)
- **Severidade:** **Alta**
- **O que está errado:** O arquivo `setupTests.ts` configura o MSW com `server.listen({ onUnhandledRequest: 'error' })`. Porém, `handlers.ts` não possui mock para `GET /api/meals/stats`. Quando `StatsPage` monta e o TanStack Query dispara a requisição, o MSW rejeita com erro fatal:
  `InternalError: [MSW] Cannot bypass a request when using the "error" strategy for the "onUnhandledRequest" option.`
- **Cenário concreto de impacto:** A suíte do Vitest encerra com erro não tratado, quebrando o pipeline de CI. Além disso, o teste existente em `StatsPage.test.tsx` é inócuo pois só verifica o texto de loading `"Carregando estatísticas"`, sem testar gráficos nem renderização de métricas.
- **Como verificar/reproduzir:** Execute `npx vitest run StatsPage` dentro de `/frontend`.
- **Correção sugerida:** Implementar o handler `http.get(`${baseURL}/meals/stats`, ...)` em `handlers.ts` retornando dados agregados completos e reescrever `StatsPage.test.tsx` para aguardar os gráficos e métricas.
- **Esforço:** P

---

### [TST-007] Suíte de Frontend Quebrada por Seletores Frágeis (12 de 13 Testes Falhando)
- **Arquivo:Linha:** [`frontend/src/components/auth/LoginForm.test.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/auth/LoginForm.test.tsx), [`frontend/src/components/auth/RegisterForm.test.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/auth/RegisterForm.test.tsx), [`frontend/src/components/meals/NewMealModal.test.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.test.tsx)
- **Severidade:** **Alta**
- **O que está errado:** 12 dos 13 testes do frontend falham continuamente. Os testes em `LoginForm.test.tsx` e `RegisterForm.test.tsx` buscam `getByLabelText(/e-mail/i)` com hífen obrigatório, enquanto os labels dos componentes utilizam `"Email"` sem hífen. Os testes buscam botões com texto `/entrar/i` e `/salvar/i`, quando os componentes utilizam `"Acessar Dashboard"` e `"Criar Refeição"`.
- **Cenário concreto de impacto:** O frontend está totalmente sem rede de proteção contra regressões. Desenvolvedores habituam-se a rodar testes falhando e ignoram quebras reais.
- **Como verificar/reproduzir:** Execute `npm --prefix frontend test`. Observe que apenas 1 teste passa (`LoginPage.test.tsx`) e 12 falham.
- **Correção sugerida:** Atualizar as expressões regulares dos seletores para aceitar `/(?:email|e-mail)/i` e alinhar os nomes dos botões com o design brutalista atual.
- **Esforço:** P

---

### [TST-008] Ausência da Ferramenta de Cobertura no Frontend (`@vitest/coverage-v8`)
- **Arquivo:Linha:** [`frontend/package.json:50`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/package.json#L50)
- **Severidade:** **Média**
- **O que está errado:** O frontend não possui `@vitest/coverage-v8` instalado. O comando `npx vitest run --coverage` falha instantaneamente com erro de dependência ausente.
- **Cenário concreto de impacto:** Impossibilidade de medir cobertura de componentes e hooks do frontend ou aplicar thresholds mínimos de qualidade no CI.
- **Como verificar/reproduzir:** Execute `npx vitest run --coverage` em `/frontend`.
- **Correção sugerida:** Instalar `@vitest/coverage-v8` nas devDependencies do frontend e declarar o provider no `vite.config.ts`.
- **Esforço:** P

---

### [TST-009] Gaps Críticos de Cobertura de Rotas e Serviços no Backend (40% a 75% Descoberto)
- **Arquivo:Linha:** [`backend/src/controllers/user.controller.ts:46-189`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/user.controller.ts#L46-L189), [`backend/src/services/user.service.ts:62-232`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L62-L232), [`backend/src/models/history.model.ts:24-76`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/history.model.ts#L24-L76), [`backend/src/controllers/meal.controller.ts:36-75`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/meal.controller.ts#L36-L75)
- **Severidade:** **Crítica**
- **O que está errado:** Quase metade da lógica do backend não é tocada por nenhum teste:
  1. `GET /api/users/me` (`getProfile`): 0 testes.
  2. `PUT /api/users/me` (`updateProfile` com validação de senha atual na troca de e-mail/senha): 0 testes.
  3. `PUT /api/users/me/onboarding` (`completeOnboarding` com cálculo TDEE e criação de meta/medida): 0 testes.
  4. `DELETE /api/users/me` (`deleteAccount` com verificação de senha e exclusão em cascata): 0 testes.
  5. `POST /api/users/me/preview-goals` e `PUT /api/users/me/goals`: 0 testes.
  6. `GET /api/users/me/goals` (`getActiveGoal` com vigência `effective_from`): 0 testes.
  7. `PUT /api/meals/:id` (atualização e substituição atômica de itens): 0 testes.
  8. `DELETE /api/meals/:id`: 0 testes.
  9. `GET /api/meals/stats` (cálculo de médias e agregação temporal): 0 testes.
  10. `history.model.ts` (`insertGoal`, `getActiveGoal`, `insertBodyMeasurement`): 0 testes.
- **Cenário concreto de impacto:** Regressões quebrem regras centrais de negócio (ex: usuário alterar dados sem confirmar senha atual, corrupção da vigência de metas, falhas no cálculo de médias excluindo dias sem registro) sem que a suíte aponte falhas.
- **Como verificar/reproduzir:** Inspecione o relatório de cobertura gerado deterministicamente na seção 1.2.
- **Correção sugerida:** Expandir `user.routes.test.ts` e `meal.routes.test.ts` para cobrir os verbos e modelos faltantes.
- **Esforço:** G

---

### [TST-010] Ausência de Limpeza do Banco de Testes Entre Execuções (Poluição Acumulativa)
- **Arquivo:Linha:** [`backend/tests/integration/user.routes.test.ts:8-10`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/tests/integration/user.routes.test.ts#L8-L10), [`backend/tests/integration/meal.routes.test.ts:8-10`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/tests/integration/meal.routes.test.ts#L8-L10)
- **Severidade:** **Média**
- **O que está errado:** Os testes de integração realizam escritas reais no banco `contador_calorias_test`, mas nenhum arquivo executa limpeza (`TRUNCATE` ou `DELETE`) após a execução. Apenas o pool é encerrado (`pool.end()`).
- **Cenário concreto de impacto:** O banco de testes acumula milhares de registros a cada execução local ou em runners de CI reutilizáveis. Testes futuros que dependam de paginação, ordenação ou contagens sofrerão interferência de dados residuais.
- **Como verificar/reproduzir:** Conte os registros em `users` no banco `contador_calorias_test` antes e depois de rodar `npm test`.
- **Correção sugerida:** Criar um script helper de teardown que remove os usuários de teste (`DELETE FROM users WHERE email LIKE 'tester-%' OR email LIKE 'tz-%'`) no hook `after()`.
- **Esforço:** P

---

### [TST-011] Ausência de Testes para as Principais Telas da Aplicação (`DashboardPage`, `EditProfilePage`, `OnboardingFlow`)
- **Arquivo:Linha:** [`frontend/src/pages/private/DashboardPage.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/DashboardPage.tsx), [`frontend/src/pages/private/EditProfilePage.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/EditProfilePage.tsx), [`frontend/src/components/onboarding/OnboardingFlow.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/onboarding/OnboardingFlow.tsx), [`frontend/src/context/AuthContext.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/context/AuthContext.tsx)
- **Severidade:** **Alta**
- **O que está errado:** As telas centrais onde ocorrem as principais interações do usuário possuem zero testes automatizados:
  - `DashboardPage.tsx`: não há teste para cálculo do saldo calórico restante, barras de macronutrientes, estado vazio (`"Nenhuma refeição registrada"`) ou navegação entre dias.
  - `EditProfilePage.tsx`: não há teste para edição de biometria, troca de e-mail ou troca de senha.
  - `OnboardingFlow.tsx`: não há teste para preenchimento sequencial das etapas, cálculo de TDEE e persistência inicial.
  - `AuthContext.tsx` e `apiFetch`: não há teste para injeção de token `Bearer`, expiração ou logout em resposta `401`.
- **Cenário concreto de impacto:** Quebras na camada visual ou de integração com TanStack Query chegam ao usuário final sem detecção prévia.
- **Como verificar/reproduzir:** Inspecione `frontend/src/pages/private/` e `frontend/src/components/`. Apenas `StatsPage.test.tsx` existe e está falhando.
- **Correção sugerida:** Implementar testes de integração de componentes com RTL para `DashboardPage`, `OnboardingFlow` e `AuthContext`.
- **Esforço:** G

---

### [TST-012] Ausência de Testes de Transações Atômicas e Rollback em Falha Parcial
- **Arquivo:Linha:** [`backend/src/models/meal.model.ts:18-60`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/meal.model.ts#L18-L60) e [`backend/src/models/meal.model.ts:137-186`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/meal.model.ts#L137-L186)
- **Severidade:** **Alta**
- **O que está errado:** As operações `createMealWithItems` e `updateMealWithItems` executam bloco `BEGIN / COMMIT / ROLLBACK`. Porém, não há nenhum teste automatizado que simule falha na inserção de um dos itens para validar se o `ROLLBACK` é acionado e previne registros órfãos.
- **Cenário concreto de impacto:** Se uma query de inserção em `meal_items` falhar por chave estrangeira inválida ou erro de dados e o rollback não for executado corretamente, surgem refeições vazias sem itens ou estados inconsistentes no banco.
- **Como verificar/reproduzir:** Busque na suite por testes que forcem erro no segundo item da refeição. Nenhum teste executa esse cenário.
- **Correção sugerida:** Criar teste de integração disparando payload com `foodId` inválido no segundo item e confirmando via consulta SQL direta que zero linhas foram persistidas em `meals`.
- **Esforço:** P

---

## 3. Hipóteses e Riscos Não Confirmados [HIPÓTESE]

### [HIPÓTESE-001] Concorrência e Race Condition no Upsert Diário de Metas
- **Arquivo:** [`backend/src/models/history.model.ts:35-47`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/history.model.ts#L35-L47)
- **Descrição:** O método `insertGoal` executa `ON CONFLICT (user_id, effective_from) DO UPDATE`. Caso duas requisições simultâneas tentem atualizar metas para a mesma data no mesmo milissegundo, há risco potencial de deadlock ou leitura suja, visto que não há teste de concorrência cobrindo essa operação com múltiplas threads.

### [HIPÓTESE-002] Efeito Colateral do Rate Limiter em Testes de Integração Rápidos
- **Arquivo:** [`backend/src/routes/user.routes.ts:10-14`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/user.routes.ts#L10-L14)
- **Descrição:** O middleware `authLimiter` limita a 10 requisições a cada 15 minutos por IP em `/login` e `/register`. Conforme a suíte de testes de integração for expandida, pode ocorrer falso positivo de `429 Too Many Requests` durante os testes se o IP local acumular 10 tentativas sem reset do limiter no ambiente de teste.

---

## 4. Matriz de Priorização de Testes por Redução de Risco

Abaixo está o plano priorizado dos testes que devem ser criados para mitigar os maiores riscos operacionais e de segurança do **CalorieSync**:

| Prioridade | Domínio / Módulo | O que Cobre | Por que Cobre (Risco Mitigado) | Tipo | Esforço |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **P1** | **Autorização (IDOR)** | Tentativas cruzadas de leitura, edição e exclusão de refeições e metas entre `User A` e `User B`. | Impede vazamento e corrupção de dados entre diferentes usuários. | Integração (API) | M |
| **P1** | **Fuso Horário & Datas** | Criação e listagem de refeições às 23:59 em múltiplos fusos (UTC, BRT) sem depender de `TZ` local. | Garante que refeições do final do dia não sumam do dashboard em produção. | Integração (API) | M |
| **P1** | **Cálculo Nutricional** | `calculateItemNutrients` com gramas, ml, unidade (`unit_weight`), fator e arredondamentos. | Elimina teste tautológico; assegura exatidão matemática nas calorias e macros consumidos. | Unitário (Service) | P |
| **P1** | **Vigência de Metas** | `effective_from` em `user_goals` garantindo preservação de metas históricas passadas. | Impede que alteração de meta hoje altere o histórico nutricional de dias anteriores. | Integração (DB) | M |
| **P2** | **Rotas de Perfil & Auth** | `updateProfile` (exigência de senha atual na troca de credenciais) e `deleteAccount` (cascata). | Garante segurança de conta e integridade relacional do banco. | Integração (API) | M |
| **P2** | **Atomicidade / Rollback** | Criação de refeição com falha intencional no 2º item validando rollback total. | Previne corrupção e criação de registros órfãos no banco de dados. | Integração (DB) | P |
| **P2** | **Frontend: Correção MSW & Seletores** | Alinhamento do mock MSW com a API real e ajuste de regexes nos testes de Auth e NewMealModal. | Restaura a confiabilidade da suíte do frontend (de 1 para 13 testes passando). | Frontend (Vitest) | P |
| **P2** | **Frontend: DashboardPage** | Renderização do resumo diário, barras de progresso de macros e listagem de refeições. | Cobre a tela principal da aplicação onde o usuário passa a maior parte do tempo. | Frontend (RTL) | M |
| **P3** | **Frontend: OnboardingFlow** | Fluxo multi-etapas de primeiro acesso, preenchimento de biometria e conclusão. | Assegura que novos usuários consigam completar o cadastro sem quebras de UI. | Frontend (RTL) | M |
| **P3** | **Frontend: AuthContext** | Login, persistência em localStorage, injeção de token Bearer e logout automático em 401. | Garante integridade do ciclo de vida da sessão do usuário. | Frontend (Context) | P |
| **P3** | **Busca de Alimentos com Acentos** | Busca por `"maca"`, `"feijao"`, `"pao"` assertando os itens retornados e ordenação por trigram. | Valida se a tolerância a acentos e relevância funcionam na prática. | Integração (DB) | P |

---

## 5. Descrição Detalhada dos Testes Top-Priority (P1)

### 1. Teste de Isolamento Multiusuário (IDOR)
- **Arquivo Alvo:** `backend/tests/integration/authorization.test.ts`
- **O que cobre:**
  - Cria dois usuários isolados no banco de teste (`User A` e `User B`).
  - Cria uma refeição pertencente ao `User A`.
  - Dispara requisição `PUT /api/meals/:id` com o token do `User B` tentando alterar nome ou itens da refeição do `User A`. Deve retornar `404 Not Found` e não alterar a refeição.
  - Dispara requisição `DELETE /api/meals/:id` com o token do `User B`. Deve retornar `404 Not Found` e não deletar a refeição.
  - Dispara requisição `GET /api/meals/today` com o token do `User B`. Deve retornar lista vazia `[]`.
- **Por que é essencial:** IDOR é uma das vulnerabilidades de maior impacto em aplicações web. Sem esse teste, qualquer refatoração na camada SQL pode expor todos os dados de saúde dos usuários.

### 2. Teste de Fuso Horário e Virada do Dia sem Dependência de Ambiente
- **Arquivo Alvo:** `backend/tests/integration/timezone.test.ts`
- **O que cobre:**
  - Insere refeição com timestamp ISO às `2026-10-13T23:59:00-03:00` (horário de Brasília).
  - Consulta `GET /api/meals/today?date=2026-10-13` e valida que a refeição é retornada, independentemente de a variável `process.env.TZ` estar definida como `UTC` ou `America/Sao_Paulo`.
  - Consulta `GET /api/meals/today?date=2026-10-14` e valida que a refeição não é retornada.
  - Repete o teste para refeição às `2026-10-13T00:01:00-03:00`.
- **Por que é essencial:** O teste atual é um falso positivo que passa apenas porque o script do `package.json` injeta `TZ=America/Sao_Paulo`. Em produção (servidores cloud com fuso UTC), a consulta falha e refeições somem da tela.

### 3. Teste Unitário Real de Cálculos Nutricionais
- **Arquivo Alvo:** `backend/tests/unit/meal.service.test.ts`
- **O que cobre:**
  - Exporta e invoca `calculateItemNutrients` passando alimentos reais com diferentes unidades:
    - 150g de frango (base 100g, 165 kcal, 31g prot) -> 247.5 kcal, 46.5g prot.
    - 250ml de leite (base 100ml, 60 kcal, 3.2g prot) -> 150 kcal, 8g prot.
    - 2 unidades de ovo (`displayAmount: 2`, `unit_weight: 50`, base 100g: 156 kcal) -> 156 kcal.
  - Valida arredondamento para 1 casa decimal e tratamento de `unit_weight` nulo.
- **Por que é essencial:** Substitui os testes tautológicos em `backend/tests/meal.test.ts` que operavam apenas sobre variáveis locais e não testavam o código da aplicação.

### 4. Teste de Vigência Temporal de Metas (`effective_from`)
- **Arquivo Alvo:** `backend/tests/integration/goals.history.test.ts`
- **O que cobre:**
  - Cria meta para o usuário em `2026-10-01` (2000 kcal).
  - Cria nova meta em `2026-10-10` (1800 kcal).
  - Consulta `GET /api/users/me/goals?date=2026-10-05` -> deve retornar 2000 kcal.
  - Consulta `GET /api/users/me/goals?date=2026-10-12` -> deve retornar 1800 kcal.
  - Atualiza a meta no mesmo dia `2026-10-10` e verifica se o upsert atualiza o registro sem duplicar a chave composta `(user_id, effective_from)`.
- **Por que é essencial:** O histórico imutável de metas é um requisito fundamental especificado em `docs/SPEC.md (RF-003)` e atualmente possui zero cobertura no banco de dados.
