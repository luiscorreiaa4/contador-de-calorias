# Testes (TESTING.md)

## Estado Atual Pós-Auditoria
Foi executada a bateria de testes de CI/CD para confirmar a saúde do repositório.

- **Comando Teste Backend (`npm run test`):**
  - **Resultado Real:** PASSOU (25 suites/tests executados em ~38.5 segundos).
  - **Alerta de Segurança:** O node aponta o `DeprecationWarning: url.parse()` vindo possivelmente do `supertest` ou do Node 22, alertando sobre risco de segurança na API antiga do WHATWG.
  - **Risco Dev:** Os testes de integração conectam-se ao banco de dados e executam operações reais. Se rodados num banco local, isso **poderá apagar** ou modificar os dados inseridos manualmente pelo desenvolvedor. Não foi constatado banco isolado ou em-memória exclusivo para os testes.

- **Comando Lint (`npm run lint`):**
  - **Resultado Real:** FALHOU (Exit Code 1).
  - **Erros Identificados:** 4 erros.
    - `react-hooks/set-state-in-effect` (Cascading render em `NewMealModal.tsx`).
    - `@typescript-eslint/no-explicit-any` (Uso indevido de any em `meal.service.ts`).
    - `@typescript-eslint/no-unused-vars` (Variáveis abandonadas nos testes de rotas do meal).

- **Comando Build (`npm run build`):**
  - **Resultado Real:** PASSOU (Frontend compilado com sucesso).
  - **Alerta:** Aviso do Vite sobre _chunks_ (ex: `index.js`) maiores do que 500kB não unificados, sugerindo code-splitting e lazy loading (performance afetada no front-end em banda lenta).

## Áreas Críticas sem Teste
- **Frontend UI:** Sem testes em fluxos críticos, como o preenchimento e abertura de modais (`NewMealModal`) e o Login de Usuário.

## Plano de Testes de Caracterização
Antes de refatorarmos ou adicionarmos novas features, devemos "travar" o comportamento atual.

1. **Configuração de UI Tests (Frontend - Alta Prioridade)**
   - [DÚVIDA] O frontend não possui configuração de testes. Devemos introduzir `Vitest` + `Testing Library` imediatamente para os Testes de Caracterização antes de adicionar novas features?

2. **Isolamento de Banco para Testes E2E (Backend)**
   - Corrigir a configuração do runner no `package.json` para injetar credenciais que apontem obrigatoriamente para um banco `contador_calorias_test`, evitando deleções acidentais.
