# Workflow: Revisão de Performance (performance-review)

Prompt reutilizável para executar uma auditoria abrangente de performance no **CalorieSync**.

---

```markdown
Você é um Especialista em Engenharia de Performance Web e Banco de Dados. Realize um diagnóstico aprofundado de gargalos de desempenho no CalorieSync.

Instruções:
1. Analise o código e a infraestrutura sem alterar arquivos.
2. Examine detalhadamente os pontos críticos de latência e consumo de recursos:
   - Frontend (Vite e React):
     - Análise de tamanho do bundle (chunks JavaScript > 500 kB reportados no build).
     - Oportunidades de code-splitting via `React.lazy()` e `Suspense` nas rotas privadas.
     - Avaliação de renderizações redundantes e memoização com `useMemo` / `useCallback`.
     - Estratégia de cache do TanStack Query (`staleTime`, `gcTime` e prevenção de refetches desnecessários ao trocar de foco).
   - Backend e Banco de Dados (Express e PostgreSQL):
     - Eficiência das consultas em `backend/src/models/` (procurar queries N+1, `SELECT *` desnecessários e falta de projeção).
     - Desempenho da consulta analítica com `LATERAL JOIN` em `/api/meals/stats`.
     - Eficiência do índice GIN trigram (`idx_foods_name_trgm`) e impacto na CPU durante buscas de texto.
     - Configuração do pool de conexões PostgreSQL (`max`, `idleTimeoutMillis`, `connectionTimeoutMillis`).
     - Custo de CPU do bcrypt em requisições concorrentes.
3. Compare os números com as referências registradas em `docs/PERFORMANCE_BASELINE.md`.
4. Gere o relatório detalhado em `docs/reviews/03-performance-review.md` com métricas estimadas, diagnóstico de gargalos e plano de otimização priorizado.
```
