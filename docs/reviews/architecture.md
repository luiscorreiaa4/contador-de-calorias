# Revisão de Arquitetura e Qualidade de Código (CalorieSync)

**Arquivo:** `docs/reviews/architecture.md`  
**Data da Auditoria:** 13 de Outubro de 2026  
**Modo:** SOMENTE LEITURA (Análise Estática e Medição Determinística)  
**Ambiente de Testes:** Node.js v24.14.0, TypeScript 5.7.3 / 6.0.2, PostgreSQL 18.3 / driver `pg` 8.13.1, Vite 8.2.0, React 19.2.8.  
**Ferramentas Determinísticas Utilizadas:** `eslint .`, `tsc` (backend), `tsc -b` (frontend), `vitest run` (frontend), `node --test` (backend), `depcheck`, `knip`.  
**Escopo Auditado:** Arquitetura em camadas, acoplamento, contratos entre banco/backend/frontend, consistência de schemas e tipos, dead code, fuso horário e integridade relacional, observabilidade e shutdown, acessibilidade (WCAG AA).

---

## Sumário Executivo de Arquitetura & Qualidade

A auditoria identificou não conformidades arquiteturais relevantes, pontos de acoplamento excessivo, código morto e divergências de contratos que impactam a manutenibilidade, a robustez operacional e a integridade do sistema:

| Severidade | Quantidade | Principais Frentes Afetadas |
| :--- | :---: | :--- |
| **Crítica** | 3 | Build de produção do frontend quebrado (`tsc -b`), suíte de testes do frontend com 9 falhas ativas no Vitest, e race conditions de data/fuso horário com UTC que quebram o cálculo de metas diárias após as 21:00 BRT. |
| **Alta** | 7 | Ausência de transações atômicas em operações de múltiplos inserts/updates no backend, isolamento defeituoso do `errorHandler` com vazamento de mensagens SQL internas para o cliente, duplicação do registro de rotas no Express (`app.ts` + `server.ts`), divergência de contratos e tipos entre banco, backend e frontend, ausência de validação Zod de parâmetros/queries em rotas-chave, violação da regra de formulários complexos (sem `react-hook-form`), e seed de alimentos não idempotente com duplicação em potencial. |
| **Média** | 8 | Health check raso e fora do padrão `{ success, data, message }`, ausência de tratamento de encerramento gracioso (Graceful Shutdown) para o servidor e pool do banco, falta de logging HTTP estruturado, ausência de índice FK em `meal_items(food_id)`, monólitos de código no frontend (`EditProfilePage` com 885 linhas e `NewMealModal` com 753 linhas), ausência de `content-type` check no cliente `apiFetch`, popover de calendário sem atributos de acessibilidade (WCAG), e `react-select` sem label acessível. |
| **Baixa** | 5 | Código morto (8 arquivos, 2 dependências de produção e 4 dependências de desenvolvimento sem uso), exports não consumidos, dependências duplicadas no frontend, sintaxe híbrida de migrações (CommonJS vs ESM) e scripts soltos fora da pasta `scripts/`. |

---

## Tabela de Diagnóstico das Ferramentas Determinísticas

| Ferramenta Executada | Comando | Status | Resultado Observado |
| :--- | :--- | :---: | :--- |
| **Backend TypeScript Check** | `npm --prefix backend run build` (`tsc`) | ✅ Sucesso (0) | 0 erros de compilação TypeScript no backend. |
| **Backend Integration Tests** | `npm test` (`tsx --test`) | ✅ Sucesso (0) | 37 testes unitários e de integração aprovados em 919 ms. |
| **Root ESLint** | `npm run lint` (`eslint .`) | ❌ Falha (1) | 1 erro (`prefer-const` em `NewMealModal.tsx:298`) e 1 warning de diretiva não utilizada. |
| **Frontend TypeScript Check** | `npm --prefix frontend run build` (`tsc -b`) | ❌ Falha (1) | 2 erros de compilação em `NewMealModal.tsx` (linhas 455 e 461) com generics do `react-select`. |
| **Frontend Test Suite** | `npm --prefix frontend test` (`vitest run`) | ❌ Falha (1) | 3 arquivos de teste falharam, 9 testes quebrados e 1 erro não tratado do MSW (`StatsPage.test.tsx`). |
| **Backend Dead Code Check** | `npx knip --directory backend` | ⚠️ Achados | 1 script órfão (`clean-foods.ts`), 1 schema órfão (`food.schema.ts`), 3 devDependencies obsoletas, 2 exports e 4 tipos não usados. |
| **Frontend Dead Code Check** | `npx knip --directory frontend` | ⚠️ Achados | 6 arquivos não utilizados (`ThemeToggle.tsx`, `App.css`, 4 componentes `ui/`), 2 dependências Radix não usadas, devDependencies duplicadas. |
| **Backend Dependency Audit** | `npx depcheck backend` | ⚠️ Achados | `ts-node-dev` presente sem uso (substituído por `tsx`). |
| **Frontend Dependency Audit** | `npx depcheck frontend` | ⚠️ Achados | 5 devDependencies de lint duplicadas da raiz. |

---

## 1. Violações de Camadas e Regras de Backend (`.agents/rules`)

### [ARCH-001] Quebra do Isolamento de Erros e Vazamento de Detalhes Internos via Controllers
- **Arquivo:Linha:** [`backend/src/controllers/user.controller.ts:18-25`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/user.controller.ts#L18-L25), [`backend/src/controllers/meal.controller.ts:15-19`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/meal.controller.ts#L15-L19), [`backend/src/controllers/food.controller.ts:28-35`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/food.controller.ts#L28-L35) e [`backend/src/middlewares/errorHandler.ts:7-25`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/middlewares/errorHandler.ts#L7-L25).
- **Severidade:** **Alta**
- **O que está errado:** 
  1. Todos os controllers interceptam erros em blocos `try/catch` locais e devolvem respostas HTTP imediatas sem nunca repassar a exceção para o middleware central via `next(error)`. Como consequência, o middleware `errorHandler.ts` registrado em `app.ts:34` é **código inalcançável**.
  2. Nos blocos de captura dos controllers, a mensagem de erro retornada ao cliente é extraída diretamente de `err.message`:
     ```ts
     const err = error as CustomError;
     const statusCode = err.statusCode ?? 500;
     return res.status(statusCode).json({ success: false, message: err.message ?? 'Erro interno no servidor.' });
     ```
     Quando ocorre um erro 500 no banco de dados (ex: falha de sintaxe, timeout, perda de conexão ou violação de integridade não tratada), o PostgreSQL gera um `pg.DatabaseError` sem propriedade `statusCode`. O controller assume `statusCode = 500`, mas envia `err.message` diretamente na resposta JSON, violando a regra de mascaramento e expondo a topologia interna para o cliente.
- **Cenário concreto de impacto:** Se uma query SQL falhar por erro de schema, coluna ou restrição relacional em produção, o usuário recebe a mensagem crua do driver PostgreSQL (ex: `relation "users" does not exist` ou `null value in column "email" of relation "users" violates not-null constraint`), facilitando fingerprinting e expondo detalhes de infraestrutura.
- **Como verificar/reproduzir:**
  Invoque qualquer endpoint simulando uma falha de conexão do pool ou passe um ID com formato inválido para um endpoint sem validação Zod (ex: `GET /api/meals/stats?period=invalid`). O controller captura a falha e cospe a mensagem do erro sem passar pelo `errorHandler`.
- **Correção sugerida:**
  Adotar o padrão canônico do Express: controllers devem repassar erros não esperados via `next(error)`. No `errorHandler.ts`, manter a sanitização rigorosa de qualquer erro com status 500 (`message: 'Erro interno no servidor.'`) e registrar o stack trace detalhado exclusivamente nos logs de servidor.
- **Esforço:** M

---

### [ARCH-002] Ausência de Atomicidade Transacional em Gravações Múltiplas Relacionadas
- **Arquivo:Linha:** [`backend/src/services/user.service.ts:91-122`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L91-L122), [`backend/src/services/user.service.ts:178-204`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L178-L204) e [`backend/src/services/user.service.ts:268-284`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L268-L284).
- **Severidade:** **Alta**
- **O que está errado:** A diretriz de banco de dados (`.agents/rules/backend-rules.md`, Seção 6) determina: *"Qualquer operação que realize mais de uma instrução de escrita (INSERT, UPDATE, DELETE) relacionada DEVE ser encapsulada em transação com client = await pool.connect(), BEGIN, COMMIT e ROLLBACK em bloco try/finally"*. No entanto:
  1. Em `completeOnboarding`, o serviço execita três escritas separadas: `UserModel.updateUser`, `HistoryModel.insertGoal` e `HistoryModel.insertBodyMeasurement`, cada uma executando seu próprio `pool.query()` independente fora de qualquer transação.
  2. Em `updateProfile`, o serviço executa `UserModel.updateUser` e opcionalmente `HistoryModel.insertBodyMeasurement` de forma desacoplada.
  3. Em `updateGoals`, o serviço executa `HistoryModel.insertGoal` e logo em seguida `UserModel.updateUser` (linhas 269 e 279) sem transação.
- **Cenário concreto de impacto:** Se a gravação de `HistoryModel.insertGoal` for bem-sucedida, mas o servidor cair ou a conexão for abortada antes de `UserModel.updateUser`, o estado do banco fica inconsistente: `user_goals` registrará a nova meta diária, mas o registro do usuário em `users` manterá as calorias e proteínas desatualizadas. No caso do onboarding, se `insertBodyMeasurement` falhar, o usuário fica com flag `onboarding_completed: true` sem o histórico biométrico inicial.
- **Como verificar/reproduzir:**
  Injetar uma falha simulada (ou desconectar a rede) entre as chamadas em `completeOnboarding` ou `updateGoals`. O primeiro comando é comitado definitivamente no banco e o segundo não é executado, deixando a base em estado parcial órfão.
- **Correção sugerida:**
  Encapsular operações de escrita compostas em transações gerenciadas pelo cliente `pg.PoolClient`, garantindo que falhas em qualquer etapa disparem `ROLLBACK` completo.
- **Esforço:** M

---

### [ARCH-003] Evasão do Middleware Zod na Rota e Lógica de Negócio em Controller
- **Arquivo:Linha:** [`backend/src/routes/food.routes.ts:10`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/food.routes.ts#L10), [`backend/src/controllers/food.controller.ts:11-24`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/food.controller.ts#L11-L24), [`backend/src/routes/meal.routes.ts:12-15`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/meal.routes.ts#L12-L15) e [`backend/src/routes/user.routes.ts:25`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/user.routes.ts#L25).
- **Severidade:** **Alta**
- **O que está errado:**
  1. A regra de arquitetura (`.agents/rules/backend-rules.md`, Seção 3) proíbe categoricamente invocar `.parse()` dentro de controllers e exige o middleware `validate(schema)` diretamente na rota. Em `food.controller.ts`, o schema `listQuerySchema` foi definido e executado manualmente com `listQuerySchema.parse(req.query)` dentro da action `list`.
  2. Em `food.controller.ts:22`, há lógica de negócio e validação manual (`if (search && search.trim().length < 2) return res.status(400)...`) que deveria estar descrita no próprio schema Zod (`z.string().min(2)`).
  3. As rotas `GET /api/meals/today`, `GET /api/meals/stats`, `PUT /api/meals/:id`, `DELETE /api/meals/:id` e `GET /api/users/me/goals` não possuem middlewares `validate` para seus parâmetros de consulta (`query`) ou identificadores de rota (`params`), permitindo que valores arbitrários cheguem aos controllers e services.
- **Cenário concreto de impacto:** Requisições com parâmetros inválidos (como strings não-UUID em `:id` ou datas fora de padrão) propagam até a camada de modelo, disparando exceções de sintaxe de tipo no PostgreSQL (`invalid input syntax for type uuid`) em vez de serem rejeitadas limpa e precocemente com HTTP 400.
- **Como verificar/reproduzir:**
  Execute `curl -X DELETE http://localhost:3001/api/meals/not-a-uuid -H "Authorization: Bearer <TOKEN>"`. A aplicação atinge o controller e o model em vez de ser interceptada pelo middleware.
- **Correção sugerida:**
  Criar schemas para parâmetros (`idParamSchema = z.object({ id: z.string().uuid() })`) e queries (`dateQuerySchema`, `foodSearchQuerySchema`), aplicando `validate(schema, 'query')` e `validate(schema, 'params')` nas rotas correspondentes.
- **Esforço:** P

---

### [ARCH-004] Registro Duplicado em Memória de Roteadores Express
- **Arquivo:Linha:** [`backend/src/app.ts:24-26`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/app.ts#L24-L26) e [`backend/src/server.ts:9-11`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/server.ts#L9-L11).
- **Severidade:** **Alta**
- **O que está errado:** Os roteadores `/api/users`, `/api/foods` e `/api/meals` são registrados **duas vezes consecutivas** na instância da aplicação Express. O arquivo `app.ts` executa:
  ```ts
  app.use('/api/users', userRoutes);
  app.use('/api/foods', foodRoutes);
  app.use('/api/meals', mealRoutes);
  ```
  E em seguida `server.ts` importa `app` e repete exatamente os mesmos três comandos `app.use(...)`.
- **Cenário concreto de impacto:** Cada rota da API passa a ter duas instâncias idênticas da pilha de middlewares registradas na tabela de roteamento interna do Express (`app._router.stack`). Além de consumo redundante de memória, se um middleware terminar invocando `next()` em vez de encerrar a resposta, o segundo handler idêntico é acionado, podendo causar avisos de `Cannot set headers after they are sent to the client`.
- **Como verificar/reproduzir:**
  Inspecione a stack do Express em tempo de execução:
  `console.log(app._router.stack.filter(layer => layer.name === 'router').length)`. O resultado exibe o dobro de rotas registradas.
- **Correção sugerida:**
  Remover os registros duplicados de `server.ts`, mantendo `app.ts` como a única autoridade de definição de rotas e middlewares da aplicação.
- **Esforço:** P

---

## 2. Acoplamento, Contratos e Consistência de Dados

### [ARCH-005] Race Condition de Fuso Horário e Falha na Vigência de Metas com `toISOString`
- **Arquivo:Linha:** [`backend/src/services/user.service.ts:105`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L105), [`backend/src/services/user.service.ts:268`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L268) e [`backend/src/services/user.service.ts:288`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L288).
- **Severidade:** **Crítica**
- **O que está errado:** 
  1. O backend grava e consulta a coluna `effective_from` (do tipo `DATE` civil) utilizando:
     `const todayStr = new Date().toISOString().split('T')[0];`
  2. A função `.toISOString()` converte o momento para o fuso UTC (zero offset). Como o Brasil reside em UTC-3, qualquer usuário que complete o onboarding ou altere suas metas após as 21:00 (horário de Brasília) terá `new Date().toISOString()` correspondendo às 00:00 ou posterior do **dia seguinte** em UTC.
  3. A meta é salva no banco com a data de amanhã (`effective_from = '2026-10-14'`).
  4. Quando o usuário abre o dashboard ainda na noite de hoje (`date = 2026-10-13`), a consulta do backend executa:
     `WHERE user_id = $1 AND effective_from <= '2026-10-13'`.
     Como `2026-10-14 <= 2026-10-13` é falso, a query retorna `NULL`. O backend recorre ao fallback incompleto ou o dashboard exibe calorias zeradas.
- **Cenário concreto de impacto:** Qualquer cadastro, onboarding ou alteração de metas realizado entre 21:00 e 23:59 (horário de pico de uso de aplicativos móveis e fitness) faz a meta sumir da tela do usuário no momento imediato após a conclusão.
- **Como verificar/reproduzir:**
  Simule uma execução às 21:30 BRT:
  ```ts
  const d = new Date('2026-10-13T21:30:00-03:00');
  console.log(d.toISOString().split('T')[0]); // Imprime: '2026-10-14' (Data distorcida!)
  ```
- **Correção sugerida:**
  Nunca utilizar `.toISOString().split('T')[0]` para obter a data local de negócio. Utilizar formatação no fuso explícito de Brasília (`Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())`) ou extrair o parâmetro `date` enviado pelo cliente.
- **Esforço:** P

---

### [ARCH-006] Omissão do Parâmetro de Fuso Horário nas Chamadas do Frontend
- **Arquivo:Linha:** [`frontend/src/pages/private/DashboardPage.tsx:21`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/DashboardPage.tsx#L21), [`frontend/src/pages/private/DashboardPage.tsx:28`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/DashboardPage.tsx#L28) e [`frontend/src/pages/private/StatsPage.tsx:12`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/StatsPage.tsx#L12).
- **Severidade:** **Alta**
- **O que está errado:** A especificação arquitetural (`docs/ARCHITECTURE.md`, Seção 4) estabelece explicitamente que o frontend deve enviar o parâmetro de consulta `date=YYYY-MM-DD` com base no relógio do navegador para evitar desencontros de fuso. No entanto, o código atual implementa:
  - Em `DashboardPage.tsx:21`: `queryFn: ({ signal }) => getTodayMeals(undefined, signal)`
  - Em `DashboardPage.tsx:28`: `queryFn: () => getActiveGoal()`
  - Em `StatsPage.tsx:12`: `queryFn: ({ signal }) => getMealStats(period, undefined, signal)`
  Todas as três chamadas passam `undefined` no parâmetro de data, fazendo a requisição omitir o parâmetro `?date=` na URL.
- **Cenário concreto de impacto:** O frontend delega a interpretação do "dia de hoje" inteiramente para o relógio do servidor backend. Se o backend estiver hospedado em infraestrutura de nuvem com relógio UTC padrão (ex: AWS, Railway, Render), haverá uma janela diária de 3 horas em que o dashboard exibirá dados do dia errado para usuários brasileiros.
- **Como verificar/reproduzir:**
  Abra a aba Rede das ferramentas de desenvolvedor do navegador no Dashboard. Observe a requisição HTTP enviada: `GET /api/meals/today` (sem query string).
- **Correção sugerida:**
  Criar um utilitário centralizado no frontend `getLocalDateString()` que retorne `YYYY-MM-DD` local do navegador e injetá-lo em todas as queries do TanStack Query:
  ```ts
  const localToday = new Date().toLocaleDateString('en-CA');
  queryFn: ({ signal }) => getTodayMeals(localToday, signal);
  ```
- **Esforço:** P

---

### [ARCH-007] Divergência de Contratos e Tipos entre Banco de Dados, Backend e Frontend
- **Arquivo:Linha:** [`backend/src/types/food.types.ts:1-14`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/types/food.types.ts#L1-L14), [`backend/migrations/1791390511650_add-food-scale-features.js:26-30`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/migrations/1791390511650_add-food-scale-features.js#L26-L30), [`frontend/src/services/food.service.ts:3-14`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/services/food.service.ts#L3-L14) e [`frontend/src/services/meal.service.ts:14-40`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/services/meal.service.ts#L14-L40).
- **Severidade:** **Alta**
- **O que está errado:**
  1. A migração `1791390511650_add-food-scale-features.js` adicionou à tabela `foods` as colunas `source`, `external_id` e `active`. No entanto, a interface `Food` em `backend/src/types/food.types.ts` e em `frontend/src/services/food.service.ts` não possui nenhuma dessas três propriedades tipadas.
  2. Em `backend/src/types/meal.types.ts`, os campos temporais são tipados como objetos nativos `Date` (`meal_time: Date; created_at: Date; updated_at: Date;`). Já no frontend (`frontend/src/services/meal.service.ts:35-36`), são tipados como `string`, e a propriedade `updated_at` foi omitida.
  3. Não há compartilhamento de contratos: schemas Zod e DTOs de mutação são duplicados artesanalmente nas duas pontas do monorepo, propiciando desvios silenciosos quando regras de campos obrigatórios forem alteradas.
- **Cenário concreto de impacto:** Desenvolvedores no backend ou frontend trabalham sob suposições incompatíveis sobre os campos retornados pela API (como presença de `active` ou tipo de data), mascarando erros em tempo de compilação.
- **Como verificar/reproduzir:**
  Compare a definição de `Food` em `backend/src/types/food.types.ts` com o retorno de `SELECT * FROM foods`. O payload inclui `source`, `external_id` e `active`, mas o TypeScript do backend os considera inexistentes.
- **Correção sugerida:**
  Criar um pacote compartilhado ou pasta de tipos unificada (ex: `shared/src/types/`) consumida tanto pelo backend quanto pelo frontend, assegurando que o contrato JSON trafegado na rede seja único.
- **Esforço:** M

---

### [ARCH-008] Duplicação de Regras de Negócio Nutricional no Cliente e no Servidor
- **Arquivo:Linha:** [`frontend/src/components/meals/NewMealModal.tsx:35-44`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L35-L44) e [`backend/src/services/meal.service.ts:9-42`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/meal.service.ts#L9-L42).
- **Severidade:** **Média**
- **O que está errado:** A lógica de cálculo proporcional de macronutrientes, conversão de unidades (`un` para gramas via `unit_weight`) e arredondamento decimal foi implementada duas vezes de forma independente:
  - No frontend (`calculateNutrients`), utilizada para alimentar a UI em tempo real enquanto o usuário edita a quantidade.
  - No backend (`calculateItemNutrients`), executada antes de persistir os itens em `meal_items`.
- **Cenário concreto de impacto:** Qualquer ajuste na política de arredondamento de macros (ex: de 1 casa decimal para número inteiro ou truncamento) ou na fórmula de cálculo exige sincronização manual em arquivos não correlacionados. Se houver divergência, o usuário visualiza um total de calorias no modal e, após salvar, a refeição aparece no diário com valores divergentes.
- **Como verificar/reproduzir:**
  Compare o código da função `calculateNutrients` em `NewMealModal.tsx` com `calculateItemNutrients` em `meal.service.ts`. Ambas repetem as mesmas equações e fatores de conversão.
- **Correção sugerida:**
  Isolar as funções de cálculo nutricional em um módulo compartilhado puro (ex: `shared/nutrition-calc.ts`), consumido tanto pelos serviços do backend quanto pelos hooks de preview do frontend.
- **Esforço:** P

---

## 3. Qualidade de Código, Monólitos e Testes do Frontend

### [ARCH-009] Quebra do Build de Produção do Frontend via TypeScript (`tsc -b`)
- **Arquivo:Linha:** [`frontend/src/components/meals/NewMealModal.tsx:455`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L455) e [`frontend/src/components/meals/NewMealModal.tsx:461`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L461).
- **Severidade:** **Crítica**
- **O que está errado:** O script de build de produção do frontend (`npm run build` ou `npm --prefix frontend run build`) falha sistematicamente com erro de saída 1:
  ```
  src/components/meals/NewMealModal.tsx(455,19): error TS2322: Type '(option: { food: Food; label: string; value: string; } | null) => void' is not assignable to type '(newValue: SingleValue<...> | MultiValue<...>, actionMeta: ActionMeta<...>) => void'.
  src/components/meals/NewMealModal.tsx(461,33): error TS2322: Type '(props: MenuListProps) => React.JSX.Element' is not assignable to type 'ComponentType<MenuListProps<...>> | undefined'.
  ```
  Isso ocorre porque o componente `Select` da biblioteca `react-select` possui tipos genéricos estritos para opções e props de componentes customizados que não foram parametrizados adequadamente.
- **Cenário concreto de impacto:** Qualquer pipeline de CI/CD (GitHub Actions, Vercel, Docker build) falha na etapa de compilação, impossibilitando a geração do bundle estático de produção.
- **Como verificar/reproduzir:**
  Execute `npm --prefix frontend run build` no terminal da aplicação. O processo encerra com exit code 1.
- **Correção sugerida:**
  Declarar o tipo da opção explicitamente no `Select`:
  ```tsx
  type FoodOption = { food: Food; label: string; value: string };
  <Select<FoodOption, false> ... />
  ```
  E ajustar a tipagem do componente `CustomMenuList = (props: MenuListProps<FoodOption, false>) => ...`.
- **Esforço:** P

---

### [ARCH-010] Suíte de Testes do Frontend Quebrada no Vitest
- **Arquivo:Linha:** [`frontend/src/components/meals/NewMealModal.test.tsx:63`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.test.tsx#L63) e [`frontend/src/pages/private/__tests__/StatsPage.test.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/__tests__/StatsPage.test.tsx).
- **Severidade:** **Crítica**
- **O que está errado:** A execução de `npm --prefix frontend test` (`vitest run`) resulta em falhas em 3 arquivos de teste (9 testes falhando no total):
  1. Em `NewMealModal.test.tsx`, o teste procura por um botão com texto `/salv/i` ("Salvar"), enquanto a interface brutalista utiliza o rótulo "CRIAR REFEIÇÃO" / "SALVAR ALTERAÇÕES".
  2. Em `StatsPage.test.tsx`, o interceptor do MSW (Mock Service Worker) dispara uma rejeição não tratada: `InternalError: [MSW] Cannot bypass a request when using the "error" strategy for the "onUnhandledRequest" option`, indicando que as rotas de estatísticas chamadas pela página não possuem handlers configurados no mock de testes.
- **Cenário concreto de impacto:** Perda total de confiabilidade na suíte de testes de regressão do cliente; o comando de teste bloqueia pipelines automatizadas.
- **Como verificar/reproduzir:**
  Execute `npm --prefix frontend test` no terminal.
- **Correção sugerida:**
  1. Atualizar as asserções de acessibilidade em `NewMealModal.test.tsx` para buscar os nomes acessíveis corretos dos botões (`name: /criar refeição/i`).
  2. Adicionar o handler de interceptação para `GET /api/meals/stats` em `frontend/src/mocks/handlers.ts`.
- **Esforço:** P

---

### [ARCH-011] Monólitos de Componentes no Frontend (`EditProfilePage` e `NewMealModal`)
- **Arquivo:Linha:** [`frontend/src/pages/private/EditProfilePage.tsx:1-885`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/EditProfilePage.tsx#L1-L885) (885 linhas, 38.1 KB) e [`frontend/src/components/meals/NewMealModal.tsx:1-753`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L1-L753) (753 linhas, 33.3 KB).
- **Severidade:** **Média**
- **O que está errado:** Ambos os arquivos violam o princípio da responsabilidade única (SRP), acumulando em um único bloco de código:
  - Em `EditProfilePage`: gerenciamento de dados de usuário, alteração segura de credenciais, biometria, sincronização manual de 12 variáveis de `useState`, submissão assíncrona, modais de confirmação e estilos brutalistas extensos.
  - Em `NewMealModal`: lógica de autocomplete com paginação virtual, conversor dinâmico de gramas/unidades, cálculo de macros em tempo real, validação de campos de formulário, formatação de horário e controle de animação.
- **Cenário concreto de impacto:** Altíssimo custo de manutenção, risco elevado de regressões em qualquer edição simples de layout e lentidão de re-renderização em digitação devido ao acúmulo de estados no mesmo componente pai.
- **Como verificar/reproduzir:**
  Inspecione a contagem de linhas: `EditProfilePage.tsx` possui 885 linhas e `NewMealModal.tsx` possui 753 linhas.
- **Correção sugerida:**
  1. Decompor `EditProfilePage` em submódulos isolados: `PersonalInfoSection.tsx`, `SecuritySection.tsx` e `BiometricsSection.tsx`.
  2. Decompor `NewMealModal` em `FoodSearchSelect.tsx`, `MealItemList.tsx` e `NutrientSummaryFooter.tsx`.
- **Esforço:** M

---

### [ARCH-012] Ausência de `react-hook-form` e Falta de Dependência no Frontend
- **Arquivo:Linha:** [`frontend/package.json:13-27`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/package.json#L13-L27) e [`frontend/src/pages/private/EditProfilePage.tsx:43-85`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/EditProfilePage.tsx#L43-L85).
- **Severidade:** **Alta**
- **O que está errado:** A diretriz `.agents/rules/react-rules.md`, Seção 4, estipula categoricamente: *"Formulários com 3 ou mais campos editáveis DEVEM utilizar react-hook-form integrado com resolvers de validação Zod (@hookform/resolvers/zod)"*. No entanto, nenhuma das duas dependências (`react-hook-form` e `@hookform/resolvers`) está instalada em `frontend/package.json`. Todos os formulários complexos da aplicação (perfil, cadastro, onboarding) foram implementados com estados manuais volumosos e validação imperativa manual.
- **Cenário concreto de impacto:** Proliferação de código repetitivo de validação e re-renderizações desnecessárias da página a cada caractere digitado em campos de texto.
- **Como verificar/reproduzir:**
  Execute `cat frontend/package.json`. Note a ausência de `react-hook-form` na lista de dependencies.
- **Correção sugerida:**
  Instalar `react-hook-form` e `@hookform/resolvers` no frontend e refatorar os formulários complexos para `useForm({ resolver: zodResolver(...) })`.
- **Esforço:** M

---

## 4. Código Morto e Auditoria de Dependências

### [ARCH-013] Arquivos de Código Morto Não Importados no Frontend e Backend
- **Arquivo:Linha:** Vários (confirmados via `knip` e busca estática reversa):
  1. [`backend/clean-foods.ts:1-6`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/clean-foods.ts#L1-L6): Script de uso pontual solto na raiz do backend que viola as regras de isolamento.
  2. [`backend/src/schemas/food.schema.ts:1-6`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/schemas/food.schema.ts#L1-L6): Schema Zod vazio nunca importado, pois `food.controller.ts` instanciou seu próprio schema inline.
  3. [`frontend/src/components/ThemeToggle.tsx:1-32`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ThemeToggle.tsx#L1-L32): Componente de alternância de tema que não é importado em nenhuma tela ou layout.
  4. [`frontend/src/components/ui/card.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ui/card.tsx), [`switch.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ui/switch.tsx), [`textarea.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ui/textarea.tsx) e [`tooltip.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ui/tooltip.tsx): Quatro componentes utilitários de UI gerados e não referenciados por nenhum componente do sistema.
  5. [`frontend/src/styles/App.css:1`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/styles/App.css#L1): Arquivo CSS legado vazio/morto, não referenciado em `App.tsx` ou `main.tsx`.
- **Severidade:** **Baixa**
- **O que está errado:** Arquivos residem na árvore de código ocupando espaço, aumentando o tempo de varredura de linters/formatadores e induzindo desenvolvedores a utilizarem componentes desatualizados.
- **Cenário concreto de impacto:** Confusão de manutenção; por exemplo, `ThemeToggle.tsx` continha violações de regras brutalistas (`rounded-lg`), mas nunca esteve ativo em produção.
- **Como verificar/reproduzir:**
  Execute `npx knip --directory frontend` e `npx knip --directory backend`.
- **Correção sugerida:**
  Excluir com segurança os arquivos não utilizados e mover `food.schema.ts` para ser o schema oficial da rota `food.routes.ts`.
- **Esforço:** P

---

### [ARCH-014] Dependências Órfãs e Duplicadas no Monorepo
- **Arquivo:Linha:** [`backend/package.json:41`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/package.json#L41), [`backend/package.json:33`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/package.json#L33) e [`frontend/package.json:16-17, 29-51`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/package.json#L16-L17).
- **Severidade:** **Baixa**
- **O que está errado:**
  1. No backend: `ts-node-dev` permanece listado em `devDependencies` apesar do projeto ter migrado 100% dos scripts para `tsx`. Além disso, `@types/express-rate-limit` (v5) está instalado enquanto a dependência de produção é `express-rate-limit` v8 (que já inclui suas próprias tipagens).
  2. No frontend: `@radix-ui/react-switch` e `@radix-ui/react-tooltip` foram instaladas exclusivamente para os componentes mortos `switch.tsx` e `tooltip.tsx`.
  3. No frontend: As `devDependencies` de ESLint (`@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`) estão duplicadas em `frontend/package.json`, mas a configuração ativa reside no arquivo único `eslint.config.js` na raiz do repositório.
- **Cenário concreto de impacto:** Inchaço de `node_modules` e lentidão desnecessária em `npm install`.
- **Como verificar/reproduzir:**
  Execute `npx depcheck backend` e `npx depcheck frontend`.
- **Correção sugerida:**
  Desinstalar dependências mortas (`npm --prefix backend rm ts-node-dev @types/express-rate-limit` e `npm --prefix frontend rm @radix-ui/react-switch @radix-ui/react-tooltip`).
- **Esforço:** P

---

## 5. Banco de Dados, Migrations e Idempotência

### [ARCH-015] Ausência de Idempotência e Restrição de Unicidade no Seed de Alimentos
- **Arquivo:Linha:** [`backend/migrations/1790883891276_seed-foods.js:12-25`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/migrations/1790883891276_seed-foods.js#L12-L25).
- **Severidade:** **Alta**
- **O que está errado:** A migração de seed executa:
  ```sql
  INSERT INTO foods (name, calories, proteins, carbs, fats, base_unit, serving_weight, unit_name, unit_weight) VALUES (...)
  ON CONFLICT DO NOTHING;
  ```
  Contudo, a tabela `foods` criada na migração baseline **não possui restrição `UNIQUE` na coluna `name`**. No PostgreSQL, a cláusula `ON CONFLICT DO NOTHING` sem alvo explícito só atua sobre a chave primária (`id`). Como os registros inseridos não especificam `id`, o banco aplica o default `uuid_generate_v4()`, gerando um UUID novo para cada linha.
- **Cenário concreto de impacto:** Se a migração for reexecutada ou se o script de seed rodar novamente em qualquer ambiente, novos registros idênticos serão inseridos em duplicidade no catálogo, duplicando itens como "Frango Grelhado" e "Arroz Branco Cozido".
- **Como verificar/reproduzir:**
  Execute o comando `INSERT` duas vezes consecutivas em um banco local. O PostgreSQL inserirá todas as linhas duas vezes com UUIDs distintos.
- **Correção sugerida:**
  Adicionar uma chave natural única ou executar `WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name = ...)` para assegurar idempotência estrita.
- **Esforço:** P

---

### [ARCH-016] Ausência de Índice FK em `meal_items(food_id)`
- **Arquivo:Linha:** [`backend/migrations/1790883887302_baseline.js:63`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/migrations/1790883887302_baseline.js#L63).
- **Severidade:** **Média**
- **O que está errado:** A coluna `meal_items.food_id` estabelece uma chave estrangeira com regra restritiva:
  `food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT;`
  No entanto, o PostgreSQL **não cria automaticamente índices em colunas de chave estrangeira**. A migração baseline criou apenas `idx_meal_items_meal_id` sobre `meal_id`.
- **Cenário concreto de impacto:** Toda vez que um registro na tabela `foods` for atualizado ou validado pelo banco de dados, o PostgreSQL é obrigado a realizar um `Seq Scan` (varredura sequencial) completa na tabela `meal_items` para assegurar que nenhum item referencia aquele alimento. À medida que `meal_items` cresce para dezenas de milhares de registros, operações de integridade referencial sofrem degradação progressiva.
- **Como verificar/reproduzir:**
  Consulte os índices da tabela `meal_items` no PostgreSQL:
  `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'meal_items';`. Apenas o índice em `meal_id` é retornado.
- **Correção sugerida:**
  Criar um índice B-tree em migração:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_meal_items_food_id ON meal_items(food_id);
  ```
- **Esforço:** P

---

### [ARCH-017] Inconsistência de Módulos (CommonJS vs ESM) nas Migrações
- **Arquivo:Linha:** [`backend/migrations/1791310642375_history-tables.js:1`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/migrations/1791310642375_history-tables.js#L1) e [`backend/migrations/1791390511650_add-food-scale-features.js:11`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/migrations/1791390511650_add-food-scale-features.js#L11).
- **Severidade:** **Baixa**
- **O que está errado:** As duas primeiras migrações do projeto utilizam sintaxe ES Modules (`export const up = ...`), enquanto as duas migrações subsequentes utilizam CommonJS (`exports.up = ...`). O `backend/package.json` declara expressamente `"type": "module"`.
- **Cenário concreto de impacto:** Inconsistência de padrão dentro do mesmo diretório e risco de falha em ferramentas de migração que esperam resolução uniforme de módulos ESM.
- **Como verificar/reproduzir:**
  Inspecione os arquivos em `backend/migrations/`.
- **Correção sugerida:**
  Padronizar todas as migrações para exportação ES Modules (`export const up = ...`, `export const down = ...`).
- **Esforço:** P

---

## 6. Observabilidade, Shutdown e Resiliência

### [ARCH-018] Health Check Raso e Quebra de Contrato da API
- **Arquivo:Linha:** [`backend/src/app.ts:29-31`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/app.ts#L29-L31).
- **Severidade:** **Média**
- **O que está errado:** 
  1. O endpoint `GET /health` responde estaticamente:
     ```ts
     res.json({ status: 'ok', service: 'Contador de Calorias Backend API' });
     ```
     Essa resposta **quebra a convenção obrigatória** do projeto definida em `AGENTS.md`: toda resposta HTTP da API deve seguir estritamente o formato `{ success: boolean, data?: unknown, message?: string }`.
  2. O health check é meramente sintático (shallow). Ele não executa nenhuma sondagem de conectividade com o banco de dados (ex: `await pool.query('SELECT 1')`).
- **Cenário concreto de impacto:** Se o PostgreSQL cair ou as credenciais forem revogadas, orquestradores de contêineres (Kubernetes, AWS ECS, Docker Compose) continuarão recebendo status 200 do `/health` e roteando tráfego de usuários para uma instância incapaz de atender requisições.
- **Como verificar/reproduzir:**
  Execute `curl http://localhost:3001/health`. A resposta recebida é `{ "status": "ok", "service": "..." }`, desprovida do campo `success`.
- **Correção sugerida:**
  Implementar probe de readiness:
  ```ts
  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ success: true, data: { status: 'healthy', database: 'connected' } });
    } catch {
      res.status(503).json({ success: false, message: 'Database disconnected' });
    }
  });
  ```
- **Esforço:** P

---

### [ARCH-019] Ausência de Graceful Shutdown (Encerramento Gracioso)
- **Arquivo:Linha:** [`backend/src/server.ts:13-16`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/server.ts#L13-L16).
- **Severidade:** **Média**
- **O que está errado:** O servidor Express inicia com `app.listen(...)`, mas não registra nenhum manipulador de sinais do sistema operacional (`process.on('SIGTERM')`, `process.on('SIGINT')`). Quando o processo recebe um sinal de encerramento:
  1. O servidor HTTP é abortado imediatamente sem aguardar o encerramento de requisições em trânsito.
  2. O pool de conexões do PostgreSQL (`pool.end()`) nunca é chamado.
- **Cenário concreto de impacto:** Em deploys contínuos ou reinicializações de contêineres, transações ativas de usuários (como gravação de refeições com múltiplos itens) são interrompidas abruptamente no meio da execução, e conexões abertas no PostgreSQL ficam presas no servidor até o esgotamento do timeout de rede do banco.
- **Como verificar/reproduzir:**
  Envie um `SIGTERM` ao processo do Node.js enquanto uma requisição de escrita está ocorrendo. O processo encerra imediatamente sem drenar as conexões ativas.
- **Correção sugerida:**
  Registrar handlers para encerramento coordenado:
  ```ts
  const server = app.listen(PORT, ...);
  const gracefulShutdown = async (signal: string) => {
    console.log(`Recebido sinal ${signal}. Encerrando graciosamente...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  ```
- **Esforço:** P

---

### [ARCH-020] Ausência de Logging HTTP Estruturado
- **Arquivo:Linha:** [`backend/src/app.ts:8-19`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/app.ts#L8-L19).
- **Severidade:** **Média**
- **O que está errado:** A aplicação backend não possui middleware de logging de requisições HTTP (como `pino-http` ou `morgan`). Além disso, não há padronização de logs estruturados (formato JSON para agregadores como Datadog, Grafana Loki ou CloudWatch).
- **Cenário concreto de impacto:** Em ambiente de produção, é impossível rastrear requisições lentas, códigos de status retornados, picos de latência ou o IP de clientes que realizam ataques de negação de serviço sem introduzir logs pontuais em código.
- **Como verificar/reproduzir:**
  Inicie o servidor backend e envie requisições para `/api/foods` ou `/api/meals/today`. O terminal permanece totalmente silencioso, sem registro das requisições recebidas.
- **Correção sugerida:**
  Adicionar um logger HTTP leve em `app.ts` gerando registros com timestamp, método, URL, status code e tempo de resposta em milissegundos.
- **Esforço:** P

---

## 7. Acessibilidade (WCAG AA) e Interações

### [ARCH-021] `react-select` sem Label Acessível no Modal de Refeições
- **Arquivo:Linha:** [`frontend/src/components/meals/NewMealModal.tsx:449-470`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L449-L470).
- **Severidade:** **Média**
- **O que está errado:** O campo de seleção e busca de alimentos (`react-select`) não possui nenhum elemento `<label htmlFor>` correspondente, nem atributos `aria-label` ou `aria-labelledby` associados ao elemento `<input role="combobox">` interno.
- **Cenário concreto de impacto:** Usuários dependentes de leitores de tela (NVDA, VoiceOver, JAWS) ao navegarem pelo formulário via teclado entram no campo de busca de alimentos e ouvem apenas um combobox genérico sem contexto do que deve ser digitado.
- **Como verificar/reproduzir:**
  Inspecione o elemento com leitor de tela ou verifique o DOM gerado pelo teste do RTL: o input do combobox não possui Accessible Name associado.
- **Correção sugerida:**
  Adicionar a propriedade `aria-label="Pesquisar alimento no catálogo"` ou `inputId="food-select-input"` com `<label htmlFor="food-select-input">` ao componente `Select`.
- **Esforço:** P

---

### [ARCH-022] Calendário Dropdown (`DatePickerInput`) com Acessibilidade Incompleta
- **Arquivo:Linha:** [`frontend/src/components/common/DatePickerInput.tsx:188-251`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/common/DatePickerInput.tsx#L188-L251).
- **Severidade:** **Média**
- **O que está errado:**
  1. O painel popover do calendário renderizado quando `isOpen === true` não possui os atributos semânticos recomendados pela WCAG: falta `role="dialog"`, `aria-modal="false"`, `aria-label="Seletor de Data"` e `aria-expanded={isOpen}` no gatilho.
  2. O popover só fecha com clique de mouse fora (`mousedown`). Se um usuário estiver utilizando exclusivamente o teclado, pressionar a tecla `Escape` não fecha o calendário.
  3. A grade de dias é composta por botões avulsos sem navegação por setas direcionais do teclado (padrão WCAG para grids de calendário).
- **Cenário concreto de impacto:** Usuários com mobilidade reduzida que navegam exclusivamente por teclado ficam presos ao abrir o seletor ou não conseguem fechá-lo sem recarregar a página.
- **Como verificar/reproduzir:**
  Abra o seletor de data usando o teclado (Tab + Enter) e pressione a tecla `Escape`. O popover permanece aberto na tela.
- **Correção sugerida:**
  Adicionar ouvinte para a tecla `Escape` no container do `DatePickerInput`, alternando `setIsOpen(false)`, e adicionar os atributos ARIA correspondentes.
- **Esforço:** P

---

## 8. Hipóteses Auditadas

| Hipótese Levantada | Status da Verificação | Parecer Conclusivo |
| :--- | :---: | :--- |
| **[HIPÓTESE-01]** O código utiliza o tipo `any` ou type-casts `as any` proibidos no frontend ou backend? | ❌ Rejeitada | A busca determinística em todo o workspace retornou **zero ocorrências** de `any`. A tipagem estrita de TypeScript foi respeitada nos arquivos de produção. |
| **[HIPÓTESE-02]** Existem diálogos nativos `window.alert()` ou `window.confirm()` esquecidos no código? | ❌ Rejeitada | A busca determinística por `alert(` e `confirm(` retornou zero ocorrências. Todas as confirmações de exclusão utilizam modais customizados com focus-trap. |
| **[HIPÓTESE-03]** O frontend quebra se a API retornar erro não-JSON (ex: 502 Bad Gateway de proxy reverso)? | ✅ Confirmada | Em `api.ts:23`, a instrução `const json = await response.json()` roda incondicionalmente sem verificar `Content-Type` ou envelopar em `try/catch`, disparando `SyntaxError` de JSON em respostas HTML de proxies. |
| **[HIPÓTESE-04]** A tabela `foods` possui restrição de unicidade em `name` que impede duplicação no seed? | ❌ Rejeitada | Verificado no schema das migrações: `foods` possui restrição UNIQUE apenas em `(source, external_id)`, permitindo nomes repetidos. |

---

## Plano de Ação Recomendado (Matriz de Priorização)

```
        ▲ ALTO
        │  [ARCH-009] Fix TS Build (react-select)    [ARCH-005] Fuso Horário UTC/Sao Paulo
        │  [ARCH-010] Corrigir Vitest (9 testes)     [ARCH-002] Transações Atômicas
IMPACTO │  [ARCH-006] Enviar ?date= no Frontend      [ARCH-001] Centralizar ErrorHandler
        │  [ARCH-018] Health Check com DB Probe      [ARCH-003] Validação Zod nas Rotas
        │  [ARCH-012] Instalar react-hook-form       [ARCH-007] Shared Types Package
        │  ─────────────────────────────────────────────────────────────────────────────
        │  [ARCH-004] Remover Rotas Duplas Server    [ARCH-011] Modularizar Monólitos UI
        │  [ARCH-013] Limpeza de Dead Code           [ARCH-016] Índice FK meal_items
        │  [ARCH-014] Limpeza de Dependências        [ARCH-022] Acessibilidade DatePicker
        ▼ BAIXO
           ◄────────────────── ESFORÇO DE IMPLEMENTAÇÃO ──────────────────►
                   PEQUENO (P)                               MÉDIO (M)
```

### Fase 1: Desbloqueio e Confiabilidade Imediata (Esforço P)
1. **[ARCH-009]**: Corrigir a parametrização de tipos do `react-select` em `NewMealModal.tsx`, restabelecendo o build limpo de produção (`npm run build`).
2. **[ARCH-010]**: Adequar os testes em `NewMealModal.test.tsx` e registrar os handlers MSW de `/api/meals/stats`, restaurando 100% de aprovação no Vitest.
3. **[ARCH-005] & [ARCH-006]**: Substituir `.toISOString().split('T')[0]` por extração no fuso de Brasília e injetar a data local do navegador nas chamadas do TanStack Query.
4. **[ARCH-004]**: Eliminar as 3 linhas de registro duplicado de rotas em `server.ts`.
5. **[ARCH-018]**: Atualizar o `/health` para o formato padrão `{ success, data }` com probe ativo `pool.query('SELECT 1')`.

### Fase 2: Robustez de Dados e Arquitetura em Camadas (Esforço M)
1. **[ARCH-001]**: Fazer os controllers delegarem erros para o `errorHandler.ts`, eliminando vazamento de mensagens de banco e repetição de blocos de captura.
2. **[ARCH-002]**: Envolver operações compostas de cadastro de histórico e usuário em transações atômicas `BEGIN`/`COMMIT`/`ROLLBACK`.
3. **[ARCH-003]**: Criar schemas Zod para parâmetros (`params`) e filtros (`query`) de todas as rotas do backend.
4. **[ARCH-016]**: Criar migração adicionando o índice `idx_meal_items_food_id`.
5. **[ARCH-019]**: Implementar rotina de Graceful Shutdown em `server.ts` para fechamento de conexões e pool.

### Fase 3: Manutenibilidade e Limpeza Estrutural (Esforço P a M)
1. **[ARCH-013] & [ARCH-014]**: Excluir arquivos de código morto (`clean-foods.ts`, componentes UI órfãos, schemas vazios) e remover dependências desnecessárias.
2. **[ARCH-007] & [ARCH-008]**: Estruturar pasta ou pacote de tipos compartilhados para eliminar divergências de contratos entre cliente e servidor.
3. **[ARCH-011] & [ARCH-012]**: Modularizar `EditProfilePage` e `NewMealModal`, adotando `react-hook-form` + `@hookform/resolvers/zod`.
4. **[ARCH-021] & [ARCH-022]**: Implementar labels acessíveis e tecla `Escape` no `DatePickerInput`.
