# Arquitetura do Sistema (ARCHITECTURE.md)

Este documento detalha o desenho arquitetural, o modelo relacional de dados, as camadas de software e as decisões técnicas implementadas no **CalorieSync**.

---

## 1. Visão Geral e Camadas [CONFIRMADO]

O projeto é estruturado em um monorepo com separação estrita entre o cliente SPA e o servidor de API:

```
[Cliente Web (React 19 + Vite)]
         │
         ▼  (HTTP REST / JSON - Authorization: Bearer <JWT>)
[Middlewares (CORS, Helmet, Rate-Limit, Auth JWT, Zod Validate)]
         │
         ▼
[Controllers (Express - Parse HTTP & Resposta Padronizada)]
         │
         ▼
[Services (Regras de Negócio Puras, TMB, Transações)]
         │
         ▼
[Models (SQL Puro via pg.Pool - Parametrizado)]
         │
         ▼
[(PostgreSQL 14+ com pg_trgm e unaccent)]
```

### Camadas do Backend (`/backend/src/`) [CONFIRMADO]
1. **`routes/`**: Declaração dos endpoints e associação com middlewares específicos (`authenticate`, `validate(schema)`), incluindo probe de integridade do banco `/health`.
2. **`controllers/`**: Extração de dados da requisição (`req.body`, `req.params`, `req.query`, `req.userId`), invocação do service correspondente e devolução de resposta formatada no padrão `{ success, data, message }`, com headers de cache privado (`Cache-Control`, `Vary: Authorization`) no catálogo de alimentos.
3. **`services/`**: Lógica de aplicação, cálculos matemáticos (TMB/TDEE, divisão proporcional de macros), coordenação de persistência, transações atômicas (`BEGIN`/`COMMIT`/`ROLLBACK`) e validações de regras de negócio.
4. **`models/`**: Consultas diretas ao PostgreSQL via driver nativo `pg.Pool`, com parametrização estrita de valores contra SQL Injection, projeções explícitas de colunas e inserções multi-row em lote.
5. **`middlewares/`**:
   - `compression`: Compressão HTTP ativa de respostas no topo da cadeia.
   - `auth.ts`: Validação de tokens JWT e extração de `userId`.
   - `validate.ts`: Middleware genérico para validação particionada de esquemas Zod (body, params, query) retornando 400 em caso de falha.
   - `requestLogger.ts`: Logging HTTP estruturado em JSON e propagação/geração do header `X-Request-Id` (correlation ID) para rastreabilidade de ponta a ponta.
   - `errorHandler.ts`: Captura global de exceções não tratadas com resposta 500 mascarada sem vazamento de detalhes internos.

### Camadas do Frontend (`/frontend/src/`) [CONFIRMADO]
1. **`router.tsx` (`react-router` v7)**: Roteamento SPA declarativo via `createBrowserRouter`, suporte a URLs amigáveis, rotas públicas/protegidas e code-splitting por rota com `React.lazy()`.
2. **`services/api.ts` (`apiFetch`)**: Wrapper centralizado de `fetch` que injeta o token Bearer, trata respostas não-JSON (502 HTML) defensivamente e sincroniza o evento global `auth:unauthorized` sob 401.
3. **TanStack Query (React Query v5)**: Gerencia chamadas assíncronas, estado de cache, revalidação e invalidação cruzada de dados (`mealStats`, `todayMeals`, `active-goal`).
4. **`context/AuthContext.tsx`**: Gerencia autenticação global, sincronização do token e perfil em memória, mantendo o `localStorage` sanitizado sem dados biométricos.
5. **`components/` & `pages/`**: Componentes estilizados com Tailwind CSS em estética brutalista (`rounded-none`, bordas contrastantes) e modais acessíveis via Radix UI com focus trap.

### Pacote Compartilhado (`/shared/`) [CONFIRMADO]
1. **Fonte única de contratos**: schemas Zod puros (`src/schemas/`), DTOs/tipos (`src/types/`) e cálculo nutricional (`src/nutrition/nutrients.ts`) consumidos por backend e frontend.
2. **Resolução por alias**: `@caloriesync/shared` (barrel) e `@caloriesync/shared/nutrition` (subpath do cálculo) configurados em `backend/tsconfig.json`, `frontend/tsconfig.app.json` e `frontend/vite.config.ts`. Sem `npm workspaces` nesta branch.
3. **Bundle enxuto**: imports de valores usam o subpath `nutrition` para não arrastar os schemas Zod ao bundle do frontend; imports apenas de tipos usam o barrel e são apagados na compilação.

---

## 2. Diagrama Entidade-Relacionamento (ER) [CONFIRMADO]

O esquema do banco de dados é composto por **6 tabelas**, geradas pelas migrações em `backend/migrations/`:

```mermaid
erDiagram
    users ||--o{ meals : "possui"
    users ||--o{ body_measurements : "registra"
    users ||--o{ user_goals : "possui vigencia"
    meals ||--o{ meal_items : "contem"
    foods ||--o{ meal_items : "referenciado em"

    users {
        UUID id PK "default uuid_generate_v4()"
        VARCHAR name "NOT NULL"
        VARCHAR email UK "NOT NULL, UNIQUE"
        VARCHAR password_hash "NOT NULL"
        VARCHAR goal "NOT NULL, DEFAULT 'perder_peso'"
        VARCHAR sex "NULLABLE"
        DATE birth_date "NULLABLE"
        NUMERIC weight "5,2 NULLABLE"
        NUMERIC height "5,2 NULLABLE"
        NUMERIC body_fat "5,2 NULLABLE"
        VARCHAR activity_level "NULLABLE"
        NUMERIC daily_calories_goal "6,2 DEFAULT 2000"
        NUMERIC daily_proteins_goal "6,2 DEFAULT 100"
        BOOLEAN onboarding_completed "DEFAULT FALSE"
        TIMESTAMPTZ terms_accepted_at "NULLABLE"
        TIMESTAMPTZ created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMPTZ updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    foods {
        UUID id PK "default uuid_generate_v4()"
        VARCHAR name "NOT NULL"
        NUMERIC calories "8,2 NOT NULL"
        NUMERIC proteins "8,2 NOT NULL"
        NUMERIC carbs "8,2 NOT NULL"
        NUMERIC fats "8,2 NOT NULL"
        VARCHAR base_unit "10 NOT NULL, DEFAULT 'g'"
        NUMERIC serving_weight "8,2 NOT NULL, DEFAULT 100"
        VARCHAR unit_name "50 NULLABLE"
        NUMERIC unit_weight "8,2 NULLABLE"
        VARCHAR source "50 NULLABLE"
        VARCHAR external_id "100 NULLABLE"
        BOOLEAN active "NOT NULL, DEFAULT TRUE"
        TIMESTAMPTZ created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMPTZ updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    meals {
        UUID id PK "default uuid_generate_v4()"
        UUID user_id FK "NOT NULL, ON DELETE CASCADE"
        VARCHAR name "NOT NULL"
        TIMESTAMPTZ meal_time "NOT NULL"
        TIMESTAMPTZ created_at "DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMPTZ updated_at "DEFAULT CURRENT_TIMESTAMP"
    }

    meal_items {
        UUID id PK "default uuid_generate_v4()"
        UUID meal_id FK "NOT NULL, ON DELETE CASCADE"
        UUID food_id FK "NOT NULL, ON DELETE RESTRICT"
        NUMERIC quantity "8,2 NOT NULL"
        VARCHAR unit "10 NOT NULL, DEFAULT 'g'"
        NUMERIC display_amount "8,2 NULLABLE"
        NUMERIC calories "8,2 NOT NULL"
        NUMERIC proteins "8,2 NOT NULL"
        NUMERIC carbs "8,2 NOT NULL"
        NUMERIC fats "8,2 NOT NULL"
        TIMESTAMPTZ created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    body_measurements {
        UUID id PK "default uuid_generate_v4()"
        UUID user_id FK "NOT NULL, ON DELETE CASCADE"
        NUMERIC weight "5,2 NOT NULL"
        NUMERIC body_fat "5,2 NULLABLE"
        TIMESTAMPTZ measured_at "NOT NULL, DEFAULT CURRENT_TIMESTAMP"
        TIMESTAMPTZ created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    user_goals {
        UUID id PK "default uuid_generate_v4()"
        UUID user_id FK "NOT NULL, ON DELETE CASCADE"
        DATE effective_from "NOT NULL"
        NUMERIC calories "6,2 NOT NULL"
        NUMERIC proteins "6,2 NOT NULL"
        NUMERIC carbs "6,2 NOT NULL"
        NUMERIC fats "6,2 NOT NULL"
        VARCHAR mode "20 NOT NULL, DEFAULT 'auto'"
        TIMESTAMPTZ created_at "DEFAULT CURRENT_TIMESTAMP"
    }
```

### Índices e Constraints Críticas [CONFIRMADO]
- `foods`:
  - `foods_source_external_id_key`: Constraint de unicidade composta `UNIQUE (source, external_id)`.
  - `idx_foods_name_trgm`: Índice GIN de similaridade trigram: `CREATE INDEX idx_foods_name_trgm ON foods USING GIN (f_unaccent(name) gin_trgm_ops)`.
  - `idx_foods_active_name`: Índice parcial B-tree: `CREATE INDEX idx_foods_active_name ON foods (name) WHERE active` (migração `1792099463766_add-food-and-meal-indexes.js` / PC-10).
  - `idx_foods_active_unique_name`: Índice único parcial B-tree: `CREATE UNIQUE INDEX idx_foods_active_unique_name ON foods (f_unaccent(lower(name))) WHERE active = true` (migração `1792445063767_add-food-name-uniqueness.js` / BL-09).
- `meals`:
  - `idx_meals_user_id_meal_time`: Índice composto `ON meals(user_id, meal_time DESC)` para aceleração de buscas no dashboard diário.
- `meal_items`:
  - `idx_meal_items_meal_id`: Índice simples `ON meal_items(meal_id)`.
  - `idx_meal_items_food_id`: Índice de foreign key: `CREATE INDEX idx_meal_items_food_id ON meal_items (food_id)` (migração `1792099463766_add-food-and-meal-indexes.js` / PC-10).
- `body_measurements`:
  - Índice composto `ON body_measurements(user_id, measured_at)`.
- `user_goals`:
  - `unique_user_goal_per_day`: Constraint de unicidade `UNIQUE (user_id, effective_from)`, garantindo uma única meta vigente por data para cada usuário.

---

## 3. Decisões Técnicas com Justificativa [CONFIRMADO]

| Decisão | Escolha | Justificativa |
| :--- | :--- | :--- |
| **Acesso a Dados** | Driver nativo `pg` (sem ORM) | Elimina a sobrecarga e abstração de ORMs (Prisma, Sequelize), permitindo consultas analíticas com SQL puro (CTEs, `LATERAL JOIN`, extensões de trigram). |
| **Migrações** | `node-pg-migrate` com ESM nativo | Gerenciamento determinístico de alterações de esquema em arquivos JS/SQL versionados no Git, sem estado embutido obscuro. Migrações aplicadas são imutáveis (D-13): novas migrações usam `export const up/down`; as legadas em CommonJS ficam congeladas (BL-15, ver `backend/migrations/README.md`). |
| **Denormalização Nutricional** | Macros gravados em `meal_items` | Quando uma refeição é criada, as calorias e macronutrientes da porção são calculados e persistidos diretamente no registro do item. Se os dados do alimento base forem alterados ou removidos futuramente, o registro histórico do que o usuário efetivamente consumiu naquele dia permanece íntegro e imutável. |
| **Transações Atômicas** | `BEGIN` / `COMMIT` / `ROLLBACK` | Operações de gravação que tocam `meals` e múltiplos `meal_items` (criação e atualização) executam obrigatoriamente dentro de transações de banco para evitar registros órfãos. |
| **Validação Universal** | Zod em todo o pipeline | O Zod é usado para validar variáveis de ambiente na inicialização (fail-fast), parâmetros HTTP nos middlewares do backend e entradas de formulários no frontend. |
| **Catálogo Protegido** | `foods` somente-leitura para usuários | Usuários comuns não possuem endpoints para cadastrar, editar ou apagar alimentos globais, evitando corrupção do catálogo. A inserção é restrita a migrações e scripts de carga (`import-foods.ts`). Um índice único parcial (`f_unaccent(lower(name))` onde `active = true`, BL-09) garante a idempotência do seed sem duplicar nomes. |
| **Estratégia de Fuso Horário (D-01)** | Opção A+B: servidor fixa `America/Sao_Paulo` via `Intl` e consultas com `AT TIME ZONE`; cliente envia `?date=YYYY-MM-DD` | Desacopla a consistência das datas civis do fuso do ambiente operacional e garante agregação correta independente de onde o servidor ou container esteja executando. |
| **Tratamento de Falhas 500 (D-10)** | Mascaramento de erros internos nos controllers com mensagem genérica | Previne vazamento de detalhes estruturais, tabelas ou constraints do PostgreSQL em respostas HTTP 500. |
| **SSL e Proxy Seguro (D-19)** | SSL estrito no pool em prod (`rejectUnauthorized: true`), CA via `DB_SSL_CA`, e proxy via `TRUST_PROXY` | Evita ataques de man-in-the-middle em bancos remotos mantendo flexibilidade para certificados de nuvem e proxies reversos. |

---

## 4. Tratamento de Fuso Horário e Datas [CONFIRMADO]

1. **Definição e Desacoplamento de Fuso no Node.js (D-01):**
   - Embora scripts injetem `cross-env TZ=America/Sao_Paulo`, as rotas e regras de negócio não dependem do fuso da máquina hospedeira: manipulações de data civil e janelas diárias utilizam `getSaoPauloDateString` ancorado em `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })` e queries de banco utilizam `AT TIME ZONE 'America/Sao_Paulo'`.
2. **Armazenamento no Banco de Dados:**
   - Colunas de momento temporal (`created_at`, `updated_at`, `meal_time`, `measured_at`) são tipadas como `TIMESTAMP WITH TIME ZONE` (`TIMESTAMPTZ`), garantindo persistência em UTC com preservação de offset.
   - Colunas puramente de data civil (`birth_date`, `user_goals.effective_from`) são do tipo `DATE`.
3. **Consultas Diárias:**
   - Na listagem de refeições de hoje (`GET /api/meals/today`) e estatísticas (`GET /api/meals/stats`), o frontend envia o parâmetro de consulta `date=YYYY-MM-DD` com base no relógio do navegador. O backend utiliza esse intervalo `[dateT00:00:00-03:00, date+1T00:00:00-03:00[` para evitar que usuários no fuso UTC-3 vejam refeições agrupadas no dia incorreto.

---

## 5. Estratégia de Busca em Escala (`pg_trgm` + `unaccent`) [CONFIRMADO]

Para viabilizar a pesquisa em catálogos com centenas ou milhares de alimentos (ex: tabela TACO) sem lentidão e tolerando erros ortográficos e acentuação:

1. **Extensões Ativas:**
   - `pg_trgm`: Decompõe textos em trigramas de 3 caracteres para cálculo de similaridade.
   - `unaccent`: Remove diacríticos e acentos do português (ex: "maçã" vira "maca").
2. **Wrapper Imutável (`f_unaccent`):**
   - O PostgreSQL exige que funções usadas em índices de expressão sejam estritamente `IMMUTABLE`. Como `unaccent` nativo depende de dicionários locais, a migração `1791390511650_add-food-scale-features.js` cria uma função wrapper declarada explicitamente como `IMMUTABLE`:
     ```sql
     CREATE OR REPLACE FUNCTION f_unaccent(text)
     RETURNS text AS
     $func$
     SELECT public.unaccent('public.unaccent', $1)
     $func$ LANGUAGE sql IMMUTABLE;
     ```
3. **Índice GIN:**
   - Criado sobre a coluna normalizada:
     `CREATE INDEX idx_foods_name_trgm ON foods USING GIN (f_unaccent(name) gin_trgm_ops);`
4. **Consulta no Modelo (`food.model.ts`):**
   ```sql
   SELECT * FROM foods 
   WHERE active = true AND f_unaccent(name) ILIKE f_unaccent($1)
   ORDER BY f_unaccent(name) <-> f_unaccent($2) ASC
   LIMIT $3 OFFSET $4
   ```
   - O operador `<->` calcula a distância de similaridade trigram, trazendo os resultados mais próximos do termo digitado no topo da lista.

---

## 6. Agregações e Vigência com `LATERAL JOIN` [CONFIRMADO]

Para a visualização histórica de consumo na página de estatísticas (`GET /api/meals/stats?period=week|month`), a consulta deve correlacionar cada dia consumido com a meta calórica que vigorava **naquela data específica**, sem que alterações posteriores de metas distorçam os dados do passado.

Essa lógica é implementada em `backend/src/models/meal.model.ts` em uma única query SQL de alta performance:

```sql
WITH daily_consumption AS (
  SELECT 
    DATE(m.meal_time) as date_val,
    SUM(mi.calories) as consumed_calories,
    SUM(mi.proteins) as consumed_proteins,
    SUM(mi.carbs) as consumed_carbs,
    SUM(mi.fats) as consumed_fats
  FROM meals m
  JOIN meal_items mi ON mi.meal_id = m.id
  WHERE m.user_id = $1
    AND m.meal_time >= CURRENT_DATE - ($2 || ' days')::interval
  GROUP BY DATE(m.meal_time)
),
daily_goals AS (
  SELECT
    dc.date_val,
    dc.consumed_calories,
    dc.consumed_proteins,
    dc.consumed_carbs,
    dc.consumed_fats,
    ug.calories as goal_calories,
    ug.proteins as goal_proteins,
    ug.carbs as goal_carbs,
    ug.fats as goal_fats
  FROM daily_consumption dc
  LEFT JOIN LATERAL (
    SELECT calories, proteins, carbs, fats
    FROM user_goals
    WHERE user_id = $1 AND effective_from <= dc.date_val
    ORDER BY effective_from DESC
    LIMIT 1
  ) ug ON true
)
SELECT 
  TO_CHAR(date_val, 'YYYY-MM-DD') as date,
  consumed_calories,
  consumed_proteins,
  consumed_carbs,
  consumed_fats,
  goal_calories,
  goal_proteins,
  goal_carbs,
  goal_fats
FROM daily_goals 
ORDER BY date_val ASC;
```

### Vantagens Técnicas do `LATERAL JOIN`:
- **Subconsulta Correlacionada Otimizada:** Para cada linha agrupada da CTE `daily_consumption`, a subconsulta lateral busca unicamente o registro mais recente de `user_goals` com `effective_from <= date_val`.
- **Sem Junções Cartesianas:** Elimina a necessidade de fazer joins completos com filtros no `WHERE` que gerariam produtos cartesianos ou exigiriam funções de janela (`ROW_NUMBER() OVER`) sobre todo o histórico.
- **Zero N+1 Queries:** O backend não precisa iterar em loops na memória para buscar as metas dia a dia; o PostgreSQL resolve toda a projeção analítica em um único plano de execução indexado.

---

## 6. Convenções de Nomenclatura e Contratos (A-038) [CONFIRMADO]

1. **Banco de Dados e Modelos:** Nomes de tabelas e colunas utilizam estritamente `snake_case` (`meal_time`, `base_unit`, `measured_at`, `effective_from`).
2. **Respostas da API:** Os payloads HTTP retornados pelo backend preservam os nomes do modelo relacional em `snake_case`, evitando camadas arbitrárias de transformação e deserialização.
3. **Contratos Zod Compartilhados (`@caloriesync/shared`):**
   - DTOs de entrada no shared devem respeitar os campos esperados pela camada de serviço e banco.
   - Qualquer discrepância histórica pontual é absorvida nos schemas de validação Zod sem quebrar clientes legados.

---

## 7. Identificadores UUID e Compatibilidade PostgreSQL (A-065) [CONFIRMADO]

1. **Requisito de Versão:** O CalorieSync requer PostgreSQL 14+ (o ambiente padrão utiliza PostgreSQL 16 via Docker Compose).
2. **Geração Nativa:** A partir do PostgreSQL 13, a função criptográfica `gen_random_uuid()` integra o núcleo do banco de dados (core), não exigindo extensões externas como `pgcrypto`. As migrações novas utilizam `gen_random_uuid()` nativo com garantia de performance e portabilidade. Migrações de baseline mantêm a extensão `uuid-ossp` apenas para compatibilidade histórica de bootstrapping.
