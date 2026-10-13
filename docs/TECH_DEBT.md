# Dívida Técnica (TECH_DEBT.md)

Este documento registra débitos técnicos, pontos de atenção de segurança e itens de melhoria identificados no **CalorieSync**.

---

## 1. Segredos no Histórico do Git
- **Severidade:** Crítica
- **Onde está:** Histórico antigo de commits do repositório. Commits legados contêm referências a `DB_PASSWORD=1234` e `JWT_SECRET=super_secret_jwt_key_contador_calorias_2026`.
- **Por que importa:** Se o repositório for tornado público ou compartilhado, chaves antigas presentes no histórico do Git podem ser mineradas por ferramentas automatizadas (ex: Gitleaks).
- **Ação Necessária:** Executar a limpeza definitiva do histórico usando `git filter-repo` ou BFG Repo-Cleaner, rotacionar qualquer credencial que ainda esteja ativa e ativar *push protection* no GitHub.

---

## 2. Senha Hardcoded no Script de Teste do Backend
- **Severidade:** Alta
- **Onde está:** `backend/package.json` no script `"db:reset:test"`.
- **Conteúdo:** O comando contém uma connection string com senha explícita: `postgresql://postgres:vN7qL2xR9mK4zP8wT6aB3@localhost:5432/contador_calorias_test`.
- **Por que importa:** Viola a regra do projeto expressa em `backend-rules.md` ("nenhum segredo hardcoded — sempre variável de ambiente").
- **Ação Necessária:** Ajustar o script para utilizar variáveis de ambiente dinâmicas (`DATABASE_URL` ou ler do `.env`).

---

## 3. Sessão e Refresh Token
- **Severidade:** Média/Alta
- **Onde está:** `backend/src/routes/user.routes.ts` e `frontend/src/services/api.ts`.
- **Por que importa:** O token JWT possui validade estática de 7 dias (`JWT_EXPIRES_IN=7d`) e fica armazenado no `localStorage` do navegador. Isso o torna vulnerável a ataques de XSS e não permite renovação silenciosa de sessão.
- **Sugestão:** Implementar fluxo com Access Token de curta duração (ex: 15 minutos) e Refresh Token rotacionado armazenado em cookie seguro `HTTP-Only` com flags `SameSite=Strict` e `Secure`.

---

## 4. Auditoria de Subdependências (`npm audit`)
- **Severidade:** Baixa/Média
- **Onde está:** Pacote `brace-expansion` identificado nas dependências da raiz.
- **Por que importa:** Potencial vulnerabilidade de exaustão de CPU (DoS) em regex.
- **Sugestão:** Executar `npm audit fix` para atualizar as subdependências afetadas na raiz do monorepo.

---

## Histórico de Débitos Resolvidos

- ✅ **Erros de Linter (Resolvido na Fase 0.3):**
  - Removido `setState` síncrono em `useEffect` no `NewMealModal.tsx`.
  - Tipados parâmetros e retornos no `meal.service.ts` eliminando usos indevidos de `any`.
  - Limpeza de variáveis abandonadas e imports não utilizados.
- ✅ **Headers de Segurança e Rate Limiting (Resolvido na Fase 0.4):**
  - `helmet` integrado em `backend/src/app.ts`.
  - `express-rate-limit` adicionado nas rotas de login e cadastro.
  - CORS configurado restritivamente via variável de ambiente `CORS_ORIGIN`.
- ✅ **Isolamento do Banco de Testes (Resolvido na Fase 0.2):**
  - Trava de segurança no `backend/src/database/pool.ts` abortando execução se os testes não apontarem para um banco terminado em `_test`.
