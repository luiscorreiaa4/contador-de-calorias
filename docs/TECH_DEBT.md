# Dívida Técnica (TECH_DEBT.md)

Este documento registra débitos técnicos, pontos de atenção de segurança e itens de melhoria identificados no **CalorieSync**.

---

## 1. Segredos no Histórico Antigo do Git [CONFIRMADO]
- **Severidade:** Crítica
- **Onde está:** Histórico antigo de commits do repositório. Commits legados contêm referências a `DB_PASSWORD=1234` e `JWT_SECRET=super_secret_jwt_key_contador_calorias_2026`.
- **Por que importa:** Se o repositório for tornado público ou compartilhado, chaves antigas presentes no histórico do Git podem ser mineradas por ferramentas automatizadas (ex: Gitleaks).
- **Ação Necessária:** Executar a limpeza definitiva do histórico usando `git filter-repo` ou BFG Repo-Cleaner, rotacionar qualquer credencial que ainda esteja ativa e ativar *push protection* no GitHub.

---

## 2. Senha Hardcoded no Script de Teste do Backend [CONFIRMADO]
- **Severidade:** Alta
- **Onde está:** `backend/package.json` no script `"db:reset:test"`.
- **Conteúdo:** O comando contém uma connection string com senha explícita: `postgresql://postgres:vN7qL2xR9mK4zP8wT6aB3@localhost:5432/contador_calorias_test`.
- **Por que importa:** Viola a regra do projeto expressa em `backend-rules.md` ("nenhum segredo hardcoded — sempre variável de ambiente").
- **Ação Necessária:** Ajustar o script para utilizar variáveis de ambiente dinâmicas (`DATABASE_URL` ou ler do `.env`).

---

## 3. Erro de Compilação no Build do Frontend (`npm run build`) [CONFIRMADO]
- **Severidade:** Alta
- **Onde está:** `frontend/src/components/meals/NewMealModal.tsx` nas linhas 455 e 461.
- **Conteúdo:** Incompatibilidade de tipos TypeScript com a biblioteca `react-select` (`SingleValue` vs `MultiValue` e `MenuListProps`).
- **Impacto:** O comando `npm run build` (`tsc -b && vite build`) falha com código 1, impedindo a geração do bundle estático de produção.
- **Ação Necessária:** Ajustar a tipagem do callback e do componente customizado de menu do `react-select`.

---

## 4. Regressão nos Testes de Componentes do Frontend (Vitest) [CONFIRMADO]
- **Severidade:** Média/Alta
- **Onde está:** `frontend/src/components/meals/NewMealModal.test.tsx` e `frontend/src/pages/private/__tests__/StatsPage.test.tsx`.
- **Conteúdo:** 9 testes falhando de um total de 13:
  1. `NewMealModal.test.tsx` procura por botão `/salvar/i`, enquanto a interface brutalista utiliza o texto `"CRIAR REFEIÇÃO"`.
  2. `StatsPage.test.tsx` aciona rotas não interceptadas pelo MSW disparando `Unhandled Rejection: [MSW] Cannot bypass a request`.
- **Impacto:** O comando `npm --prefix frontend test` encerra com código 1 no CI.
- **Ação Necessária:** Sincronizar os testes com os textos reais dos botões e mockar todas as rotas no MSW.

---

## 5. Pendências no Linter (`npm run lint`) [CONFIRMADO]
- **Severidade:** Média
- **Onde está:** `frontend/src/components/meals/NewMealModal.tsx`.
- **Conteúdo:**
  - Linha 298:9: Erro `prefer-const` na variável `timeToUse`.
  - Linha 181:9: Warning `unused eslint-disable directive`.
- **Ação Necessária:** Alterar para `const` e remover a diretiva não utilizada para manter o linter 100% verde.

---

## 6. Sessão e Refresh Token [CONFIRMADO]
- **Severidade:** Média/Alta
- **Onde está:** `backend/src/routes/user.routes.ts` e `frontend/src/services/api.ts`.
- **Por que importa:** O token JWT possui validade estática de 7 dias (`JWT_EXPIRES_IN=7d`) e fica armazenado no `localStorage` do navegador. Isso o torna vulnerável a ataques de XSS e não permite renovação silenciosa de sessão.
- **Sugestão:** Implementar fluxo com Access Token de curta duração (ex: 15 minutos) e Refresh Token rotacionado armazenado em cookie seguro `HTTP-Only` com flags `SameSite=Strict` e `Secure`.

---

## 7. Auditoria de Subdependências (`npm audit`) [A VERIFICAR]
- **Severidade:** Baixa/Média
- **Onde está:** Pacote `brace-expansion` identificado nas dependências da raiz.
- **Por que importa:** Potencial vulnerabilidade de exaustão de CPU (DoS) em regex.
- **Sugestão:** Executar `npm audit fix` para atualizar as subdependências afetadas na raiz do monorepo.

---

## Histórico de Débitos Resolvidos [CONFIRMADO]

- ✅ **Headers de Segurança e Rate Limiting (Fase 0.4):**
  - `helmet` integrado em `backend/src/app.ts`.
  - `express-rate-limit` adicionado nas rotas de login e cadastro.
  - CORS configurado restritivamente via variável de ambiente `CORS_ORIGIN`.
- ✅ **Isolamento do Banco de Testes (Fase 0.2):**
  - Trava de segurança no `backend/src/database/pool.ts` abortando execução se os testes não apontarem para um banco terminado em `_test`.
- ✅ **Migrações Versionadas (Fase 0.5):**
  - Todas as tabelas, funções e índices consolidados em 4 migrações sob `node-pg-migrate`.
