# Dívida Técnica (TECH_DEBT.md)

## Auditoria de Segurança (`npm audit`)
- **Severidade:** Alta
- **Onde está:** Pacote `brace-expansion` detectado via `npm audit`.
- **Por que importa:** Vulnerabilidade conhecida que pode causar DoS (Denial of Service) via exaustão de CPU.
- **Sugestão:** Rodar `npm audit fix` para atualizar as subdependências afetadas na raiz do projeto.

## Segredos no Histórico do Git
- **Severidade:** Crítica
- **Onde está:** Histórico do `.env` (exposto nos commits via logs). Foram encontradas variáveis hardcoded como `DB_PASSWORD=1234` e `JWT_SECRET=super_secret_jwt_key_contador_calorias_2026`.
- **Por que importa:** Chaves reais vazadas permitem acesso indevido se o repositório se tornar público ou for vazado.
- **Sugestão:** Revogar os segredos imediatamente e utilizar ferramentas como `git filter-repo` ou BFG para apagar chaves do histórico, garantindo que o `.env` esteja corretamente ignorado.

## Sessão e Refresh Token
- **Severidade:** Média/Alta
- **Onde está:** `backend/src/routes/user.routes.ts` / JWT token creation.
- **Por que importa:** O JWT tem uma validade fixa (`JWT_EXPIRES_IN=7d`). Não foi identificada nenhuma lógica de Refresh Token (`refresh_token` de curta duração + token de acesso contínuo). O usuário será deslogado subitamente após 7 dias, degradando a UX.
- **Sugestão:** Implementar fluxo de Refresh Token armazenado via HTTP-only cookie.

## Tratamento de Erro e Práticas de Código (Linter)
- **Severidade:** Média
- **Onde está:** `frontend/src/components/meals/NewMealModal.tsx`, `backend/src/services/meal.service.ts` e arquivos de teste de integração.
- **Por que importa:** 
  - Erro no linter: `setErrorMessage(null)` disparado dentro de um `useEffect` no `NewMealModal` resulta em renders cascateados de forma síncrona.
  - Uso de tipos genéricos `any` no backend mascara a proteção da tipagem (`Unexpected any`).
  - Lixo no código (`MealService is defined but never used` e variáveis mock abandonadas).
- **Sugestão:** Refatorar o componente modal para tratar erro nos eventos (handlers) e não por `useEffect`. Resolver dependências ociosas.

## Segurança Web e Headers
- **Severidade:** Média
- **Onde está:** `backend/package.json` e configuração do `app`.
- **Por que importa:** Ausência notória de `Helmet` para proteção básica contra ataques web e falta de configurações como `Rate Limit` e definições restritas de `CORS` (o CORS existe no backend mas possivelmente está muito permissivo na base).
- **Sugestão:** Instalar e configurar `helmet` e `express-rate-limit` nas rotas públicas.
