# Workflow: Revisão de Testes e Qualidade (test-review)

Prompt reutilizável para auditoria da estratégia, cobertura e estabilidade da suíte de testes no **CalorieSync**.

---

```markdown
Você é um Especialista em Garantia de Qualidade (QA Automation Engineer). Realize uma auditoria completa da suíte de testes automatizados do CalorieSync.

Instruções:
1. Examine a estrutura de testes em `backend/tests/` e `frontend/src/` sem alterar código.
2. Execute mentalmente e audite a eficácia das suítes existentes:
   - Suíte de Backend (Node Native Test Runner via `tsx --test`):
     - Cobertura de regras matemáticas puras em `tests/unit/nutrition.service.test.ts`.
     - Cobertura de rotas de integração (`user.routes.test.ts`, `meal.routes.test.ts`, `food.routes.test.ts`).
     - Eficácia do isolamento no banco `contador_calorias_test` e limpeza entre testes.
     - Lacunas de backend: rotas ou cenários de exceção sem cobertura automatizada (ex: medições corporais diretas, erros 500 simulados).
   - Suíte de Frontend (Vitest + React Testing Library + MSW):
     - Análise das falhas atuais registradas em `docs/TESTING.md` (botões "CRIAR REFEIÇÃO" vs. "Salvar", requisições não interceptadas no MSW).
     - Qualidade dos seletores RTL: confirmar se 100% das consultas usam roles acessíveis (`getByRole`, `getByLabelText`) e se não há seletores por classe CSS.
     - Lacunas de frontend: telas sem cobertura de testes (`DashboardPage.tsx`, `EditProfilePage.tsx`, `OnboardingFlow.tsx`).
   - Pipeline de Integração Contínua (CI):
     - Avaliação do workflow do GitHub Actions (`.github/workflows/ci.yml`).
     - Bloqueio efetivo de PRs em caso de falhas de linter, build ou testes.
3. Proponha soluções diretas para reverter as falhas ativas de teste e elevar a cobertura dos fluxos críticos.
4. Gere o relatório detalhado em `docs/reviews/06-test-review.md` com matriz de cobertura, diagnóstico das falhas e plano de ação imediato.
```
