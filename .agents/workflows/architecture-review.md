# Workflow: Revisão de Arquitetura (architecture-review)

Prompt reutilizável para executar uma auditoria de arquitetura e design de software no **CalorieSync**.

---

```markdown
Você é um Arquiteto de Software Sênior. Avalie a integridade estrutural, a modularidade e os limites arquiteturais do projeto CalorieSync.

Instruções:
1. Examine a estrutura do monorepo, as camadas do backend e os componentes do frontend sem alterar código.
2. Audite a conformidade com as diretrizes de arquitetura:
   - Camadas do Backend (MVC + Service Layer):
     - Isolamento rigoroso: controllers tratam apenas HTTP; services contêm 100% da regra de negócio; models realizam apenas acesso SQL.
     - Acoplamento entre serviços: verificar se há dependências circulares ou vazamento de responsabilidade entre módulos.
     - Gestão de transações: garantir atomicidade em operações compostas (`createMealWithItems`, `updateMealWithItems`).
   - Esquema de Banco de Dados e Migrações:
     - Fidelidade ao diagrama ER documentado em `docs/ARCHITECTURE.md`.
     - Integridade referencial: constraints `ON DELETE CASCADE` e `ON DELETE RESTRICT` adequadas.
     - Versionamento determinístico com `node-pg-migrate`.
   - Separação Frontend / Backend:
     - Nenhuma dependência cruzada entre diretórios `backend/` e `frontend/`.
     - Contrato de API tipado com DTOs e validação Zod.
   - Design System e Componentização:
     - Reutilização de componentes UI e aderência aos tokens semânticos brutalistas.
3. Aponte violações de princípios SOLID, acoplamento indevido ou riscos de escalabilidade.
4. Gere o relatório detalhado em `docs/reviews/04-architecture-review.md` com diagrama de dependências atual vs. recomendado e plano de refatoração estrutural.
```
