# Baseline de Performance (Fase 0.8)

Este documento registra as métricas de performance do aplicativo antes das otimizações da Fase 4. Ele serve como comparativo (ponto de partida) para garantir que nossas mudanças futuras realmente tragam impacto positivo.

## Frontend (Produção)
**Data da Medição Inicial:** 06/10/2026

### 1. Tamanho do Pacote (Bundle Size)
Abaixo, o tamanho dos arquivos gerados pelo comando `vite build`. Atualmente, todo o código da aplicação e bibliotecas está centralizado em um único arquivo (sem code-splitting por rota).

- **CSS (`index.css`):** 48.03 kB (8.01 kB gzipped)
- **JavaScript Principal (`index.js`):** 778.34 kB (227.40 kB gzipped)

⚠️ *O Vite já alertou no console de build:* "Some chunks are larger than 500 kB after minification. Consider using dynamic import() to code-split". Esse será nosso alvo número um na Fase 4, adotando `React.lazy` para as rotas.

### 2. Métricas do Lighthouse (Navegador)
*Para preencher: Rode o app em produção localmente (`npm run build` seguido de `npm run preview` no frontend, abra na janela anônima e rode a aba Lighthouse no modo Desktop ou Mobile).*

- **Performance Score:** [ ] / 100
- **First Contentful Paint (FCP):** [ ] s
- **Speed Index:** [ ] s
- **Largest Contentful Paint (LCP):** [ ] s

---

## Backend (Tempo de Resposta da API)

*Para preencher: Acompanhe na aba Network do navegador ou faça chamadas pelo Insomnia/cURL no modo de desenvolvimento.*

### 1. Listagem de Alimentos (`GET /api/foods`)
- **Tempo médio atual:** [ ] ms
- *Ponto de atenção:* Atualmente, a busca é rápida porque não há milhares de alimentos. Na Fase 3 (inserção massiva da TACO), o tempo tenderá a piorar, e então aplicaremos os índices do Postgres (`pg_trgm`) para voltar aos patamares anotados aqui.

### 2. Listagem de Refeições Diárias (`GET /api/meals/today`)
- **Tempo médio atual:** [ ] ms
- *Ponto de atenção:* Ao implementarmos a rota de estatísticas mensais (Fase 2), anotaremos o tempo de agregação via SQL e usaremos o comando `EXPLAIN ANALYZE` do Postgres se o tempo ultrapassar ~150ms.

### 3. Agregação Temporal de Estatísticas (`GET /api/meals/stats`) — Medição PC-23
- **Data da Medição:** 16/10/2026 (Sublote B / Fase 4)
- **Base de Dados Volumétrica:** Banco isolado `contador_calorias_perf`
- **Volume Inserido via Seed:** 10.000 `meal_items`, 2.500 `meals` (distribuídas ao longo de 365 dias) e histórico de `user_goals` com vigências distintas.
- **Resultados de `EXPLAIN (ANALYZE, BUFFERS)` por Período:**

| Janela Temporal | Registros Agregados | Planning Time | Execution Time | Shared Buffer Hits | Status vs Teto (150ms) |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **7 dias (Semanal)** | 7 dias | 0.28 ms | **1.05 ms** | 486 | ✅ **Abaixo do teto (0.7% do limite)** |
| **30 dias (Mensal/Padrão)** | 30 dias | 0.287 ms | **3.968 ms** | 768 | ✅ **Abaixo do teto (2.6% do limite)** |
| **90 dias (Trimestral)** | 90 dias | 0.310 ms | **8.086 ms** | 2.168 | ✅ **Abaixo do teto (5.4% do limite)** |
| **365 dias (Anual / 10k itens)** | 358 dias | 0.260 ms | **20.740 ms** | 8.373 | ✅ **Abaixo do teto (13.8% do limite)** |

- **Diagnóstico do Plano de Execução do PostgreSQL:**
  1. **Filtro Temporal de Refeições:** O PostgreSQL utiliza `Bitmap Index Scan on idx_meals_user_id_meal_time` para identificar as refeições do usuário no intervalo desejado.
  2. **Junção de Itens da Refeição:** A junção com `meal_items` é resolvida via `Bitmap Index Scan on idx_meal_items_meal_id`, acelerando as agregações de macros (`SUM(calories)`, `SUM(proteins)`, etc.).
  3. **Resolução de Metas Vigentes (`LATERAL JOIN`):** O `Index Scan Backward using unique_user_goal_per_day on user_goals` resolve a meta vigente de cada data agregada com apenas 1 a 2 buffer hits por iteração (`Limit 1`).
  4. **Conclusão:** Mesmo no pior cenário (agregação de 1 ano completo sobre 10.000 registros), o tempo total de execução permaneceu em **20.74ms**, provando que o esquema de índices atual (`idx_meals_user_id_meal_time`, `idx_meal_items_meal_id`, `unique_user_goal_per_day`) garante altíssima performance sem necessidade de desnormalizações prematuras.

