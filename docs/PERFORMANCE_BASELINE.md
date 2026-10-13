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
