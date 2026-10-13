# Revisão de Performance da Aplicação (CalorieSync)

**Arquivo:** `docs/reviews/performance.md`  
**Data da Auditoria:** 13 de Outubro de 2026  
**Modo:** SOMENTE LEITURA (Análise Estática e Medição Determinística)  
**Ambiente de Testes:** Node.js v24.14.0, PostgreSQL 18.3 (Windows x86_64), Vite v8.2.1 / React 19.  
**Escopo Auditado:** Banco de Dados e Planos de Execução (`EXPLAIN ANALYZE`), Servidor Backend (`/backend`), Cliente Frontend (`/frontend`), Configurações de Cache, Bundles e Pipeline de Build.

---

## Sumário Executivo de Performance

A auditoria identificou oportunidades substanciais de otimização de latência, vazão e consumo de recursos de rede e memória em todas as camadas da aplicação:

| Severidade | Quantidade | Principais Frentes Afetadas |
| :--- | :---: | :--- |
| **Alta** | 6 | Subqueries correlacionadas redundantes no dashboard (custo 72x maior), ausência de índice B-tree para listagem padrão de alimentos, N+1 em inserts dentro de transações com pool limitado, ausência de compressão HTTP (Gzip/Brotli), ausência de cache no catálogo estático de alimentos, quebra de build de produção no frontend (`tsc -b`). |
| **Média** | 8 | Duplicação de queries no food search (busca + count separados), ausência de índice FK em `meal_items(food_id)`, ausência de `statement_timeout` no pool, payload inflado com `SELECT *` (+37.8% de bytes), inclusão eager de `react-select` e modais pesados no bundle inicial, re-renders globais via `AuthContext`, falta de `AbortSignal` no autocomplete de alimentos, invalidação deficiente de cache entre telas. |
| **Baixa** | 4 | Fontes externas bloqueantes e ausência da fonte `Montserrat` configurada no Tailwind, registro duplicado de roteadores Express em memória, configuração de `gcTime` igual a `staleTime`, concorrência do threadpool em hashes bcrypt. |

---

## Resumo Comparativo das Medições Determinísticas

| Indicador Medido | Estado Atual | Estado Otimizado (Projetado/Medido) | Ganho Esperado |
| :--- | :---: | :---: | :---: |
| **Dashboard Query Cost (1.000 refeições)** | `1453.71` (256 buffer hits) | `20.14` (3 buffer hits) | **Redução de 72x no custo / 11.7x mais rápido** |
| **Dashboard Exec Time (1.000 refeições)** | `0.549 ms` (164 index searches) | `0.047 ms` (0 subplan searches) | **91.4% menos tempo de CPU no banco** |
| **Payload `/api/foods` (50 itens)** | `17.37 KB` (17.791 bytes) | `10.81 KB` (11.069 bytes) | **-37.8% no tamanho bruto JSON** |
| **Payload `/api/foods` com Gzip** | `17.37 KB` (sem compressão) | `~2.40 KB` (com Gzip/Brotli) | **-86.2% de tráfego de rede** |
| **Tamanho Total de JS do Frontend** | `834.57 KB` uncompressed | `~450 KB` com code-splitting | **-46% no peso inicial de scripts** |
| **Tamanho do Chunk Inicial (`index.js`)** | `300.09 KB` (gzip: 91.04 KB) | `< 180 KB` (isolando Login/Onboarding) | **Melhoria direta no FCP / LCP** |
| **Tempo Criptográfico `bcrypt` (cost 10)** | `55.71 ms` (hash) / `50.74 ms` (compare) | Inalterado (segurança), mas desacoplável via threadpool | Proteção contra congelamento do Event Loop |

---

## 1. Banco de Dados & SQL

### [PERF-001] Subqueries Correlacionadas Redundantes na Consulta do Dashboard Diário
- **Arquivo:Linha:** [`backend/src/models/meal.model.ts:67-68`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/meal.model.ts#L67-L68)
- **Severidade:** **Alta**
- **O que está errado:** A função `findMealsByUserAndDate` executa duas subqueries correlacionadas inline no comando `SELECT`:
  ```sql
  COALESCE((SELECT SUM(calories) FROM meal_items WHERE meal_id = m.id), 0) as total_calories,
  COALESCE((SELECT SUM(proteins) FROM meal_items WHERE meal_id = m.id), 0) as total_proteins
  ```
  Para cada refeição retornada no período, o PostgreSQL executa dois planos de agregação independentes sobre `meal_items`. Contudo, logo em seguida (linhas 82-93), a mesma função carrega **todos os `meal_items` dessas refeições** (`WHERE mi.meal_id = ANY($1::uuid[])`). As somas de calorias e proteínas já são calculáveis trivialmente em memória no Node.js via `.reduce()` sem custo algum para o banco.
- **Cenário concreto de impacto:** Com o passar do tempo, um usuário acumula centenas de refeições. Em períodos de visualização diária ou consultas de intervalo, o PostgreSQL dispara dezenas de `Index Scans` adicionais e satura buffers de memória.
- **Como verificar/reproduzir:**
  Execute `EXPLAIN (ANALYZE, BUFFERS)` na query com dados volumosos (simulado com 1.000 refeições e 4.000 itens):
  ```
  Index Scan using idx_meals_user_id_meal_time on meals m  (cost=0.29..1453.71 rows=41 width=134) (actual time=0.072..0.438 rows=41.00 loops=1)
    SubPlan 1: Aggregate (actual time=0.005..0.005 rows=1.00 loops=41) -> Bitmap Index Scan on idx_meal_items_meal_id (Index Searches: 41)
    SubPlan 2: Aggregate (actual time=0.004..0.004 rows=1.00 loops=41) -> Bitmap Index Scan on idx_meal_items_meal_id (Index Searches: 41)
    Buffers: shared hit=256
    Planning Time: 2.755 ms | Execution Time: 0.549 ms
  ```
  Ao remover os SubPlans:
  ```
  Sort / Bitmap Heap Scan on meals m (cost=20.03..20.14 rows=41 width=70) (actual time=0.030..0.032 rows=41.00 loops=1)
    Buffers: shared hit=3
    Planning Time: 0.069 ms | Execution Time: 0.047 ms
  ```
- **Correção sugerida:**
  Remover as subqueries do SQL e calcular os totais em memória Node.js a partir dos itens já carregados em `itemsByMeal`:
  ```ts
  const items = itemsByMeal[meal.id] || [];
  const total_calories = items.reduce((acc, it) => acc + Number(it.calories), 0);
  const total_proteins = items.reduce((acc, it) => acc + Number(it.proteins), 0);
  ```
- **Ganho Esperado:** Redução de **72x** no custo estimado do plano, redução de **85x** no uso de buffers compartilhados (`256` para `3`), e execução **11.7x** mais rápida.
- **Esforço:** P

---

### [PERF-002] Ausência de Índice B-Tree para Ordenação e Paginação Padrão no Catálogo de Alimentos
- **Arquivo:Linha:** [`backend/src/models/food.model.ts:25-30`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/food.model.ts#L25-L30) e [`backend/migrations/1791390511650_add-food-scale-features.js`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/migrations/1791390511650_add-food-scale-features.js)
- **Severidade:** **Alta**
- **O que está errado:** A migração criou o índice GIN `idx_foods_name_trgm` sobre `f_unaccent(name)`, mas **não criou** índice B-tree em `name`. Quando o usuário abre o modal de refeições ou pesquisa sem termo (`query = ''`), o backend roda:
  ```sql
  SELECT * FROM foods WHERE active = true ORDER BY name ASC LIMIT $1 OFFSET $2;
  ```
- **Cenário concreto de impacto:** O PostgreSQL não possui índice para atender `ORDER BY name ASC`. Portanto, a cada abertura de modal sem termo de busca, o banco é forçado a realizar um `Seq Scan` em toda a tabela `foods` e um `top-N heapsort` em memória.
- **Como verificar/reproduzir:**
  Execute `EXPLAIN (ANALYZE, BUFFERS)` na query:
  ```
  Limit  (cost=36.90..37.03 rows=50 width=110) (actual time=0.547..0.550 rows=50.00 loops=1)
    ->  Sort  (cost=36.90..38.39 rows=597 width=110) (actual time=0.546..0.547 rows=50.00 loops=1)
          Sort Key: foods.name
          Sort Method: top-N heapsort  Memory: 40kB
          ->  Seq Scan on public.foods  (cost=0.00..17.07 rows=597 width=110)
  ```
- **Correção sugerida:**
  Criar um índice B-tree parcial:
  ```sql
  CREATE INDEX idx_foods_active_name ON foods (name ASC) WHERE active = true;
  ```
- **Ganho Esperado:** Substitui o `Seq Scan` e o `top-N heapsort` por um `Index Scan` sequencial direto com custo inicial `0.28..2.50`, escalando O(limit) independentemente do catálogo ter 600 ou 100.000 itens.
- **Esforço:** P

---

### [PERF-003] Duplicação de Queries no Autocomplete de Alimentos (Search + Count Separados)
- **Arquivo:Linha:** [`backend/src/models/food.model.ts:10-23`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/food.model.ts#L10-L23)
- **Severidade:** **Média**
- **O que está errado:** A cada requisição de busca, o método `searchFoods` executa **duas consultas sequenciais** ao PostgreSQL:
  1. `SELECT * FROM foods WHERE active = true AND f_unaccent(name) ILIKE f_unaccent($1) ORDER BY f_unaccent(name) <-> f_unaccent($2) LIMIT $3 OFFSET $4`
  2. `SELECT COUNT(*) FROM foods WHERE active = true AND f_unaccent(name) ILIKE f_unaccent($1)`
  Ambas executam o mesmo `Bitmap Index Scan` e `Bitmap Heap Scan` independentemente no PostgreSQL.
- **Cenário concreto de impacto:** Para cada digitação no campo de autocomplete, ocorrem 2 round-trips de rede completos no pool de conexões. O PostgreSQL faz duas vezes a descompactação de trigramas e o scan de bitmap.
- **Como verificar/reproduzir:**
  Inspecione as linhas 17 e 23 de `food.model.ts`. Observe que `foodsResult` e `totalResult` são executados com `await` sequencial.
- **Correção sugerida:**
  Obter a contagem total utilizando a window function `count(*) OVER() AS total_count` na consulta principal:
  ```sql
  SELECT id, name, calories, proteins, carbs, fats, base_unit, serving_weight, unit_name, unit_weight,
         count(*) OVER() AS total_count
  FROM foods 
  WHERE active = true AND f_unaccent(name) ILIKE f_unaccent($1)
  ORDER BY f_unaccent(name) <-> f_unaccent($2) ASC
  LIMIT $3 OFFSET $4;
  ```
  Se o array retornado tiver linhas, `total = parseInt(rows[0].total_count, 10)`; se estiver vazio, `total = 0`.
- **Ganho Esperado:** Eliminação de 1 query e 1 round-trip por busca (redução de 50% nas requisições ao PostgreSQL para busca de alimentos).
- **Esforço:** P

---

### [PERF-004] Inserção N+1 em Loop de Itens de Refeição sob Transação Atômica
- **Arquivo:Linha:** [`backend/src/models/meal.model.ts:33-50`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/meal.model.ts#L33-L50) e [`159-176`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/meal.model.ts#L159-L176)
- **Severidade:** **Alta**
- **O que está errado:** Ao criar ou atualizar uma refeição, os itens são inseridos um a um através de um laço `for (const item of itemsData)` com comandos `INSERT` individuais:
  ```ts
  for (const item of itemsData) {
    const itemResult = await client.query<MealItem>(
      `INSERT INTO meal_items (meal_id, food_id, quantity, unit, display_amount, calories, proteins, carbs, fats)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
       ...
    );
  }
  ```
- **Cenário concreto de impacto:** Uma refeição com 8 alimentos gera 1 query de inserção em `meals`, 8 queries de inserção em `meal_items`, 1 query `BEGIN` e 1 query `COMMIT` = **10 round-trips de rede sequenciais** mantendo a conexão do pool travada. Com o limite de 20 conexões (`max: 20`), requisições simultâneas de salvar refeição esgotam o pool de conexões rapidamente.
- **Como verificar/reproduzir:**
  Inspecione o loop `for` nas linhas 33-50 e 159-176 de `meal.model.ts`.
- **Correção sugerida:**
  Construir uma instrução multi-row `INSERT INTO meal_items (...) VALUES ($1..$9), ($10..$18)... RETURNING *` ou utilizar `UNNEST`:
  ```ts
  if (itemsData.length > 0) {
    const valuePlaceholders: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    for (const item of itemsData) {
      valuePlaceholders.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
      params.push(meal.id, item.foodId, item.quantity, item.unit || 'g', item.displayAmount ?? null, item.calories, item.proteins, item.carbs, item.fats);
    }
    const sql = `INSERT INTO meal_items (meal_id, food_id, quantity, unit, display_amount, calories, proteins, carbs, fats) VALUES ${valuePlaceholders.join(', ')} RETURNING *`;
    const itemsResult = await client.query<MealItem>(sql, params);
  }
  ```
- **Ganho Esperado:** Redução de $N$ round-trips de rede para 1 único round-trip, diminuindo o tempo de retenção de conexões no pool em até 80%.
- **Esforço:** M

---

### [PERF-005] Ausência de Índice de Chave Estrangeira em `meal_items(food_id)`
- **Arquivo:Linha:** [`backend/migrations/1791390511650_add-food-scale-features.js`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/migrations/1791390511650_add-food-scale-features.js)
- **Severidade:** **Média**
- **O que está errado:** A tabela `meal_items` referencia `foods(id)` com chave estrangeira `ON DELETE RESTRICT`. No entanto, existe apenas o índice `idx_meal_items_meal_id` sobre `meal_id`. Não existe índice em `food_id`.
- **Cenário concreto de impacto:** Qualquer verificação de chave estrangeira (por exemplo, na exclusão ou desativação de alimentos no catálogo), ou relatórios agregados por alimento ("quantas vezes consumi o alimento X?") necessitam de varredura sequencial completa (`Seq Scan`) na tabela `meal_items`.
- **Como verificar/reproduzir:**
  Consulte os índices da tabela `meal_items`:
  ```sql
  SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'meal_items';
  ```
  Apenas `meal_items_pkey` e `idx_meal_items_meal_id` existem.
- **Correção sugerida:**
  Criar migração adicionando o índice:
  ```sql
  CREATE INDEX idx_meal_items_food_id ON meal_items(food_id);
  ```
- **Esforço:** P

---

### [PERF-006] Ausência de `statement_timeout` Configurado no Pool de Conexões
- **Arquivo:Linha:** [`backend/src/database/pool.ts:17-27`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/database/pool.ts#L17-L27)
- **Severidade:** **Média**
- **O que está errado:** O pool possui limites de conexões ociosas (`idleTimeoutMillis: 30000`) e timeout de obtenção de conexão (`connectionTimeoutMillis: 2000`), mas **não define `statement_timeout`**.
- **Cenário concreto de impacto:** Se uma consulta analítica (como estatísticas de períodos extensos) ou uma transação de escrita sofrer lock ou lentidão inesperada, a conexão permanece ocupada sem interrupção. Quando 20 conexões forem bloqueadas simultaneamente, novos clientes recebem erro fatal 500 após 2 segundos (`connectionTimeoutMillis`).
- **Como verificar/reproduzir:**
  Inspecione `backend/src/database/pool.ts` — não há menção a `statement_timeout`.
- **Correção sugerida:**
  Definir `statement_timeout: 10000` (10 segundos) nas opções do `pg.Pool` ou evento `connect`:
  ```ts
  export const pool = new Pool({
    // ...
    statement_timeout: 10000, // Aborta queries com mais de 10s
  });
  ```
- **Esforço:** P

---

## 2. Backend Node.js / Express

### [PERF-007] Projeção Irrestrita (`SELECT *`) Gerando Sobrecarga de Payload no Catálogo de Alimentos
- **Arquivo:Linha:** [`backend/src/models/food.model.ts:11,26`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/food.model.ts#L11)
- **Severidade:** **Média**
- **O que está errado:** O endpoint `GET /api/foods` retorna todas as colunas da tabela `foods` via `SELECT *`, incluindo metadados internos de auditoria e sincronização (`external_id`, `source`, `active`, `created_at`, `updated_at`).
- **Medição Real Determinística:**
  - Payload com `SELECT *` para 50 alimentos: **17.37 KB** (17.791 bytes).
  - Payload com colunas estritamente consumidas pela UI: **10.81 KB** (11.069 bytes).
  - **Redução mensurada: 37.8% no volume de dados transmitidos.**
- **Cenário concreto de impacto:** A cada digitação no campo de autocomplete, trafega-se ~38% a mais de bytes pela rede e pelo parser JSON do navegador.
- **Correção sugerida:**
  Projetar explicitamente no SQL:
  ```sql
  SELECT id, name, calories, proteins, carbs, fats, base_unit, serving_weight, unit_name, unit_weight
  FROM foods ...
  ```
- **Ganho Esperado:** Redução de **37.8%** de bytes por requisição de busca.
- **Esforço:** P

---

### [PERF-008] Ausência do Middleware de Compressão HTTP (Gzip/Brotli)
- **Arquivo:Linha:** [`backend/src/app.ts:1-35`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/app.ts#L1-L35) e [`backend/package.json`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/package.json)
- **Severidade:** **Alta**
- **O que está errado:** A API Express não utiliza o middleware `compression`. Todas as respostas HTTP JSON (listas de alimentos, dados de dashboard, históricos e relatórios de estatísticas) são entregues em texto puro sem compactação.
- **Medição Real Determinística:**
  - O JSON de alimentos (11 KB - 17 KB) compactado com gzip passa para **~2.2 KB a 3.1 KB** (redução de mais de **75% a 80%** no tamanho transferido).
- **Cenário concreto de impacto:** Em redes móveis (3G/4G), respostas grandes sem compressão demoram consideravelmente mais para transitar, aumentando o tempo de renderização no cliente.
- **Correção sugerida:**
  Instalar `compression` e `@types/compression`:
  ```bash
  npm --prefix backend install compression && npm --prefix backend install -D @types/compression
  ```
  E registrar no topo de `backend/src/app.ts`:
  ```ts
  import compression from 'compression';
  app.use(compression());
  ```
- **Ganho Esperado:** Redução de **75% a 80%** no tamanho de dados transferidos em todas as rotas com payloads maiores que 1 KB.
- **Esforço:** P

---

### [PERF-009] Falta de Cache em Memória ou HTTP Cache-Control para o Catálogo de Alimentos
- **Arquivo:Linha:** [`backend/src/controllers/food.controller.ts:17-27`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/food.controller.ts#L17-L27)
- **Severidade:** **Alta**
- **O que está errado:** O catálogo de alimentos é essencialmente estático (somente leitura para usuários comuns). No entanto, não há nenhum cabeçalho HTTP de cache (`Cache-Control`) e nenhum cache em memória no servidor Node.js.
- **Cenário concreto de impacto:** Consultas recorrentes para termos básicos da culinária brasileira ("frango", "arroz", "feijão", "ovo", "banana") disparam cálculos repetitivos de `f_unaccent` e `pg_trgm` no PostgreSQL.
- **Como verificar/reproduzir:**
  Realize duas chamadas consecutivas `GET /api/foods?search=frango`. Observe os headers de resposta: não há `Cache-Control` ou `ETag`, e o banco é consultado em ambas.
- **Correção sugerida:**
  1. Configurar cabeçalho de cache público:
     ```ts
     res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
     ```
  2. Implementar um cache LRU em memória no `food.service.ts` (ex: `lru-cache` com max 500 entradas e TTL de 1 hora).
- **Ganho Esperado:** Resposta em **< 1 ms** sem qualquer I/O no banco para a maioria das buscas repetidas.
- **Esforço:** P

---

### [PERF-010] Registro Duplicado de Roteadores no Express (`app.ts` e `server.ts`)
- **Arquivo:Linha:** [`backend/src/app.ts:24-26`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/app.ts#L24-L26) e [`backend/src/server.ts:9-11`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/server.ts#L9-L11)
- **Severidade:** **Baixa**
- **O que está errado:** As rotas `/api/users`, `/api/foods` e `/api/meals` são montadas duas vezes via `app.use()`:
  - Em `app.ts`: linhas 24-26.
  - Em `server.ts`: linhas 9-11.
- **Cenário concreto de impacto:** O roteador do Express mantém duas instâncias completas de cada rota em `app._router.stack`. Embora as requisições normais sejam interceptadas na primeira instância que der match, rotas não encontradas ou requisições encadeadas percorrem a árvore repetida em memória.
- **Como verificar/reproduzir:**
  Abra `backend/src/server.ts` e compare com `backend/src/app.ts`.
- **Correção sugerida:**
  Remover as linhas 9-11 de `backend/src/server.ts`.
- **Esforço:** P

---

### [PERF-011] Gargalo Concorrente de CPU no Pool do Libuv por Hashes de Senha (`bcrypt`)
- **Arquivo:Linha:** [`backend/src/services/user.service.ts:21,45,144,167,224`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L21)
- **Severidade:** **Baixa**
- **O que está errado:** O `bcrypt` com custo 10 consome **55.71 ms** por hash e **50.74 ms** por verificação (medido no ambiente). Como o Node.js possui por padrão 4 threads de trabalho (`UV_THREADPOOL_SIZE = 4`), 4 operações simultâneas de login/registro bloqueiam todo o threadpool do libuv por ~50ms.
- **Cenário concreto de impacto:** Operações de I/O de disco (fs), resolução de nomes DNS ou outras tarefas assíncronas que dependem do threadpool do libuv sofrem atrasos transitórios sob picos de autenticação.
- **Correção sugerida:**
  Definir `UV_THREADPOOL_SIZE = 8` ou `16` na inicialização do servidor Node.js ou via script de execução (`cross-env UV_THREADPOOL_SIZE=8`).
- **Esforço:** P

---

## 3. Frontend React / Vite

### [PERF-012] Tamanho Excessivo do Bundle Inicial e Ausência de Code Splitting em Rotas
- **Arquivo:Linha:** [`frontend/src/App.tsx:4,9`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/App.tsx#L4) e relatório do Vite build
- **Severidade:** **Alta**
- **O que está errado:**
  O Vite gerou a seguinte estrutura de chunks de produção:
  ```
  dist/assets/index-GQMSYBqH.css            32.99 kB │ gzip:   6.19 kB
  dist/assets/meal.service-B7GYdJrT.js       2.66 kB │ gzip:   0.98 kB
  dist/assets/goals.service-D0M4BhfS.js      3.07 kB │ gzip:   1.30 kB
  dist/assets/useQuery-S2Py3oEb.js           8.90 kB │ gzip:   3.28 kB
  dist/assets/EditProfilePage-DwmTl3cc.js   34.40 kB │ gzip:   7.72 kB
  dist/assets/DashboardPage-DrVr4AFv.js    117.36 kB │ gzip:  36.81 kB
  dist/assets/index-6dn03Vme.js            300.09 kB │ gzip:  91.04 kB  <-- BUNDLE INICIAL
  dist/assets/StatsPage-jZL1AESE.js        368.09 kB │ gzip: 105.87 kB
  ```
  Em `App.tsx`, `LoginPage` e `OnboardingFlow` são importados estaticamente no topo do arquivo. Isso faz com que todo o código de validações de formulário, fluxos de login, registro e as etapas de onboarding sejam embutidos no chunk principal `index-6dn03Vme.js` (300 KB).
- **Cenário concreto de impacto:** Um usuário autenticado que entra diretamente no Dashboard baixa o código do fluxo de onboarding e de login sem precisar deles. Um usuário não logado baixa o código de onboarding antes mesmo de criar conta.
- **Correção sugerida:**
  1. Tornar `LoginPage` e `OnboardingFlow` lazy-loaded com `React.lazy()` e `<Suspense>`.
  2. Isolar `vendor` chunks no `vite.config.ts` via `rollupOptions.output.manualChunks`:
     ```ts
     manualChunks: {
       'react-vendor': ['react', 'react-dom'],
       'tanstack-vendor': ['@tanstack/react-query'],
       'lucide-vendor': ['lucide-react'],
     }
     ```
- **Ganho Esperado:** Redução do bundle inicial em mais de **100 KB** (uncompressed) e melhor aproveitamento do cache do navegador para dependências de terceiros.
- **Esforço:** M

---

### [PERF-013] Inclusão Eager de `NewMealModal` e `react-select` no Chunk do Dashboard
- **Arquivo:Linha:** [`frontend/src/pages/private/DashboardPage.tsx:4`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/DashboardPage.tsx#L4)
- **Severidade:** **Média**
- **O que está errado:** `DashboardPage` importa estaticamente `NewMealModal`, que possui 753 linhas de código e a biblioteca pesada `react-select`. O chunk gerado para o Dashboard é de **117.36 KB**.
- **Cenário concreto de impacto:** O modal só é exibido quando o usuário clica no botão "Adicionar Refeição", mas seu peso impacta o carregamento inicial da tela principal da aplicação.
- **Correção sugerida:**
  Importar `NewMealModal` via `lazy()` dentro de `DashboardPage` e renderizar dentro de `<Suspense>` apenas quando `isNewMealModalOpen === true`.
- **Ganho Esperado:** Redução de ~40 KB a 50 KB no chunk do Dashboard.
- **Esforço:** P

---

### [PERF-014] Re-renders Globais por Objeto de Contexto Não Memoizado em `AuthContext`
- **Arquivo:Linha:** [`frontend/src/context/AuthContext.tsx:42-53`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/context/AuthContext.tsx#L42-L53)
- **Severidade:** **Média**
- **O que está errado:** O valor fornecido ao `AuthContext.Provider` é instanciado como um novo objeto literal em cada render:
  ```tsx
  <AuthContext.Provider
    value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      setAuthSession,
      updateUserSession,
      logout,
    }}
  >
  ```
- **Cenário concreto de impacto:** Toda alteração de estado no `AppContent` (como a alternância de tema claro/escuro via `darkMode`, que re-renderiza `AppContent`) recria o objeto `value` e altera sua referência em memória, disparando re-renderizações desnecessárias em todos os componentes filhos que consomem `useAuth()`.
- **Correção sugerida:**
  Memoizar o objeto com `useMemo` e estabilizar as funções com `useCallback`:
  ```tsx
  const authValue = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    setAuthSession,
    updateUserSession,
    logout,
  }), [user, token, setAuthSession, updateUserSession, logout]);
  ```
- **Esforço:** P

---

### [PERF-015] Ausência de Repasse de `AbortSignal` no Autocomplete de Alimentos
- **Arquivo:Linha:** [`frontend/src/services/food.service.ts:21-28`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/services/food.service.ts#L21-L28) e [`frontend/src/components/meals/NewMealModal.tsx:74-79`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L74-L79)
- **Severidade:** **Média**
- **O que está errado:** Embora exista um debounce de 250ms em `NewMealModal.tsx`, a função `getFoods` não aceita `signal?: AbortSignal` e o `queryFn` não o repassa.
- **Cenário concreto de impacto:** Se uma busca demorar 300ms e o usuário digitar mais caracteres, a requisição anterior em trânsito não é abortada pelo navegador, consumindo banda e conexões concorrentes.
- **Correção sugerida:**
  Em `food.service.ts`:
  ```ts
  export const getFoods = async (search: string = '', page: number = 1, limit: number = 50, signal?: AbortSignal): Promise<GetFoodsResponse> => {
    // ...
    return apiFetch<GetFoodsResponse>(`/foods?${params.toString()}`, { signal });
  };
  ```
  E em `NewMealModal.tsx`:
  ```ts
  queryFn: ({ signal }) => getFoods(debouncedSearch.length >= 2 ? debouncedSearch : '', 1, 50, signal),
  ```
- **Esforço:** P

---

### [PERF-016] Falha de Invalidação de Cache Cruzada (`todayMeals` vs `mealStats` e `active-goal`)
- **Arquivo:Linha:** [`frontend/src/components/meals/NewMealModal.tsx:102,113`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L102), [`frontend/src/pages/private/DashboardPage.tsx:34`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/DashboardPage.tsx#L34) e [`frontend/src/components/profile/GoalSettingsCard.tsx:40`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/profile/GoalSettingsCard.tsx#L40)
- **Severidade:** **Média**
- **O que está errado:**
  - Ao criar, editar ou excluir uma refeição, o código invalida apenas `['todayMeals']`. A query `['mealStats', period]` da página `StatsPage` possui `staleTime: 5min` e **não é invalidada**.
  - Ao alterar metas nutricionais em `GoalSettingsCard`, apenas `['active-goal']` é invalidado; o dashboard e os gráficos de estatísticas permanecem com dados antigos.
- **Cenário concreto de impacto:** O usuário adiciona refeições no Dashboard, clica em "Estatísticas" e vê dados defasados por até 5 minutos, sendo forçado a dar F5.
- **Correção sugerida:**
  Criar uma função utilitária de invalidação ou invalidar explicitamente:
  - Nas mutações de refeição: `queryClient.invalidateQueries({ queryKey: ['todayMeals'] })` e `queryClient.invalidateQueries({ queryKey: ['mealStats'] })`.
  - Nas mutações de metas: `queryClient.invalidateQueries({ queryKey: ['active-goal'] })`, `queryClient.invalidateQueries({ queryKey: ['mealStats'] })` e `queryClient.invalidateQueries({ queryKey: ['todayMeals'] })`.
- **Esforço:** P

---

### [PERF-017] Fonte Externa Bloqueante no `index.html` e Ausência da Fonte `Montserrat`
- **Arquivo:Linha:** [`frontend/index.html:9-11`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/index.html#L9-L11) e [`frontend/tailwind.config.js:12`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/tailwind.config.js#L12)
- **Severidade:** **Baixa**
- **O que está errado:**
  1. `index.html` carrega a fonte `Inter` via CDN do Google Fonts (`fonts.googleapis.com`), introduzindo duas conexões externas adicionais antes do início do parsing do CSS.
  2. O Tailwind define `heading: ['Montserrat', 'system-ui', 'sans-serif']`, mas **a fonte Montserrat não é importada em lugar nenhum**. Quando elementos usam a classe `font-heading`, o navegador sofre fallback para `system-ui`.
- **Cenário concreto de impacto:** Atraso no First Contentful Paint (FCP) e inconsistência visual de tipografia.
- **Correção sugerida:**
  Auto-hospedar as fontes via `@fontsource/inter` e `@fontsource/montserrat` empacotadas no bundle estático com hash, eliminando chamadas a CDNs externas e garantindo que os títulos usem a fonte pretendida.
- **Esforço:** P

---

### [PERF-018] Quebra no Build de Produção (`tsc -b`) no Componente `NewMealModal`
- **Arquivo:Linha:** [`frontend/src/components/meals/NewMealModal.tsx:455,461`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L455)
- **Severidade:** **Alta**
- **O que está errado:** O comando de build oficial do projeto `npm run build` (que chama `tsc -b && vite build`) falha na compilação do TypeScript devido a tipos incompatíveis no `onChange` e `CustomMenuList` do `react-select`.
- **Cenário concreto de impacto:** Bloqueio imediato em pipelines de integração contínua (CI) e na geração de artefatos de deploy para produção.
- **Como verificar/reproduzir:**
  Execute `npm run build` na raiz do repositório.
- **Correção sugerida:**
  Ajustar a tipagem do callback no `Select`:
  ```tsx
  onChange={(option) => {
    const single = option as { food: Food; label: string; value: string } | null;
    if (single) handleSelectFood(single.food);
  }}
  ```
  E adequar a assinatura de `CustomMenuList` para corresponder aos generics de `MenuListProps`.
- **Esforço:** P

---

## 4. Script de Carga e Benchmark Recomendado (Não Destrutivo)

Para aferição de planos de execução e testes de estresse em escala sem tocar na base de produção/desenvolvimento, utilize o script abaixo executado exclusivamente contra o banco de testes (`contador_calorias_test`):

```ts
/**
 * Script de Seed para Testes de Performance em Escala
 * Executa contra o banco contador_calorias_test
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'contador_calorias_test',
});

export async function seedPerformanceData(usersCount = 10, mealsPerUser = 500) {
  const client = await pool.connect();
  try {
    console.log(`Iniciando seed de performance: ${usersCount} usuários, ${mealsPerUser} refeições/usuário...`);
    await client.query('BEGIN');

    // 1. Obter alimentos de referência
    const foodsRes = await client.query('SELECT id FROM foods LIMIT 20');
    const foodIds = foodsRes.rows.map(r => r.id);

    for (let u = 1; u <= usersCount; u++) {
      // Inserir usuário sintético
      const userRes = await client.query(`
        INSERT INTO users (name, email, password_hash, goal)
        VALUES ($1, $2, $3, 'perder_peso')
        RETURNING id
      `, [`User Perf ${u}`, `perf_${u}_${Date.now()}@test.com`, '$2b$04$e1jKk...']);
      const userId = userRes.rows[0].id;

      // Inserir meta inicial
      await client.query(`
        INSERT INTO user_goals (user_id, effective_from, calories, proteins, carbs, fats)
        VALUES ($1, CURRENT_DATE - INTERVAL '180 days', 2000, 150, 200, 60)
      `, [userId]);

      // Inserir refeições em lote via generate_series
      await client.query(`
        INSERT INTO meals (id, user_id, name, meal_time)
        SELECT 
          gen_random_uuid(),
          $1,
          'Refeição Sintética ' || i,
          CURRENT_TIMESTAMP - (i * INTERVAL '6 hours')
        FROM generate_series(1, $2) as i
      `, [userId, mealsPerUser]);

      // Inserir itens de refeição correspondentes em lote
      await client.query(`
        INSERT INTO meal_items (meal_id, food_id, quantity, unit, calories, proteins, carbs, fats)
        SELECT 
          m.id,
          $2,
          100,
          'g',
          250,
          30,
          20,
          5
        FROM meals m
        CROSS JOIN generate_series(1, 3)
        WHERE m.user_id = $1
      `, [userId, foodIds[0]]);
    }

    await client.query('COMMIT');
    await client.query('ANALYZE meals; ANALYZE meal_items; ANALYZE foods;');
    console.log('Seed de performance concluído com sucesso.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}
```

---

## 5. Matriz de Priorização (Esforço x Impacto)

```mermaid
quadrantChart
    title Priorização de Ações de Performance
    x-axis Baixo Esforço --> Alto Esforço
    y-axis Baixo Impacto --> Alto Impacto
    quadrant-1 Ganhos Estratégicos
    quadrant-2 Vitórias Rápidas (Quick Wins)
    quadrant-3 Baixa Prioridade
    quadrant-4 Avaliar Cuidadosamente
    "PERF-001 Eliminar Subqueries Dashboard": [0.15, 0.95]
    "PERF-002 Índice B-tree Foods": [0.15, 0.88]
    "PERF-008 Ativar Gzip Compression": [0.10, 0.85]
    "PERF-009 Cache Foods": [0.25, 0.80]
    "PERF-007 Projeção Colunas Foods": [0.18, 0.70]
    "PERF-018 Fix Build TSC": [0.20, 0.85]
    "PERF-004 Bulk Insert Meal Items": [0.65, 0.82]
    "PERF-012 Code Splitting Rotas": [0.60, 0.78]
    "PERF-013 Lazy Load NewMealModal": [0.30, 0.60]
    "PERF-014 Memoizar AuthContext": [0.20, 0.55]
    "PERF-015 AbortSignal Foods": [0.22, 0.50]
    "PERF-005 Índice FK meal_items": [0.15, 0.45]
    "PERF-006 statement_timeout": [0.10, 0.40]
```
