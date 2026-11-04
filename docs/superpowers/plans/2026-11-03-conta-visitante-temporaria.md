# Conta de Visitante Temporária — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development ou superpowers:executing-plans para executar tarefa por tarefa. Passos usam checkbox (`- [ ]`).

**Objetivo:** Trocar a conta demo compartilhada (`DEMO_USER_EMAIL`) por uma conta de visitante nova a cada clique em "Ver demonstração", já com perfil, metas e 7 dias de refeições, apagada automaticamente depois de 24 h.

**Arquitetura:** `POST /api/auth/demo` passa a criar um usuário `is_guest = true` (e-mail `.invalid`, senha aleatória inutilizável, e-mail já verificado), roda o onboarding com dados fixos via `UserService.completeOnboarding`, cria refeições via `MealService.createMeal` e devolve a sessão como no login. A limpeza das contas vencidas roda no início de cada criação, sem cron. O bloqueio de senha/e-mail/MFA/exclusão passa a olhar `users.is_guest` em vez do e-mail configurado.

**Stack:** Express + `pg` (SQL puro), `node-pg-migrate`, `node:test` + supertest, React + TanStack Query.

**Spec:** conversa de 2026-11-03 (sem documento separado). Decisão assumida, confirmar na revisão: **o visitante entra direto com dados prontos** (não passa pelo wizard de onboarding).

## Restrições Globais

- Nada foi commitado da versão compartilhada; desfazer = editar o working tree, sem `git revert`.
- Contrato `{ success, data?, message?, code? }`; códigos novos precisam estar em `ALLOWED_BUSINESS_CODES` (`backend/src/middlewares/errorHandler.ts`).
- SQL só em `backend/src/models/`, parametrizado; escrita múltipla relacionada em transação `BEGIN/COMMIT/ROLLBACK` com `client.release()` em `finally`.
- A limpeza apaga **apenas** linhas com `is_guest = true`; nunca outro filtro. (Exclusão autorizada pelo usuário ao aprovar este plano.)
- Testes: `closeTestPool()` registrado antes dos `it`; e-mails de teste com prefixo `tester-` não se aplicam a visitantes, então a suíte limpa com `DELETE FROM users WHERE is_guest` dentro de `closeTestPool` (banco `_test` garantido pelo pool).
- Rodar testes só com `npm run test:file -- <arquivo>`, `npm run test:strict`, `npm --prefix frontend test`.
- Visitante nunca vira admin; nenhum segredo/senha em log.

## Foco de Revisão

1. **Visitante cria alimento próprio e usa numa refeição** → a limpeza ainda apaga a conta (`meal_items.food_id` é `ON DELETE RESTRICT`, `foods.user_id` é `CASCADE`). Teste na Tarefa 2.
2. **Catálogo de produção sem os nomes do seed** (curadoria renomeou/desativou) → a conta é criada mesmo assim, com menos refeições ou nenhuma, sem 500. Teste na Tarefa 2.
3. **Falha no meio do seed** → não fica conta pela metade: o usuário é apagado e o erro sobe. Coberto pelo `try/catch` da Tarefa 2 (revisar no código).
4. **Muitos cliques de IPs diferentes** → teto global `GUEST_MAX_ACTIVE = 500` responde 503 `DEMO_UNAVAILABLE`. Teste na Tarefa 2.
5. **Admin lista usuários** e vê visitantes misturados → aceito por ora; se incomodar, filtrar `is_guest` em `admin-user.service.ts` depois (fora do escopo).

---

### Tarefa 1: Migração `is_guest` e desfazer a conta compartilhada

**Arquivos:**
- Criar: `backend/migrations/1793600000000_add-guest-users.js`
- Modificar: `backend/src/config/env.ts` (remover `DEMO_USER_EMAIL`)
- Modificar: `backend/.env.example` (remover as 2 linhas de `DEMO_USER_EMAIL` no fim)
- Modificar: `backend/src/services/auth.service.ts` (remover `demoLogin` e `isDemoUser` atuais; **manter** `toAuthResponse`)
- Modificar: `backend/src/middlewares/demo.ts` → renomear para `backend/src/middlewares/guest.ts`, exportando `blockGuestUser`
- Modificar: `backend/src/routes/user.routes.ts` (trocar `blockDemoUser` por `blockGuestUser` nas 5 rotas)
- Criar: `backend/src/models/guest.model.ts`
- Teste: `backend/tests/integration/auth_demo.test.ts` (reescrito na Tarefa 2; nesta tarefa, apagar os 2 primeiros `it` que dependem de `DEMO_USER_EMAIL`)

**Interfaces:**
- Produz: coluna `users.is_guest BOOLEAN NOT NULL DEFAULT false` + índice parcial `users_guest_created_at_idx ON users (created_at) WHERE is_guest`.
- Produz (`guest.model.ts`): `isGuestUser(userId: string): Promise<boolean>`.
- Produz (`guest.ts`): `blockGuestUser(req, res, next)` — 403 `{ code: 'DEMO_READ_ONLY', message: 'Esta ação está desativada na conta de demonstração.' }` quando `isGuestUser(req.userId)`.

- [ ] **Passo 1:** Escrever a migração no estilo de `1793500000000_add-revoked-sessions.js` (`pgm.sql` com `IF NOT EXISTS`; `down` faz `DROP INDEX IF EXISTS` + `ALTER TABLE users DROP COLUMN IF EXISTS is_guest`).
- [ ] **Passo 2:** Rodar `npm run setup` e depois `npm run test:file -- tests/integration/database_indexes.test.ts`. Esperado: migração aplicada, teste passa.
- [ ] **Passo 3:** Aplicar as remoções e a troca `blockDemoUser` → `blockGuestUser` listadas acima. `isGuestUser`: `SELECT is_guest FROM users WHERE id = $1`, `false` se não houver linha.
- [ ] **Passo 4:** `npm --prefix backend exec tsc -- --noEmit -p backend` sem erros em `backend/src`; `npm run lint` sem erros.
- [ ] **Passo 5:** Commit `refactor(demo): troca conta compartilhada por flag is_guest`.

### Tarefa 2: Criação, seed e limpeza do visitante

**Arquivos:**
- Modificar: `backend/src/models/guest.model.ts`
- Criar: `backend/src/services/guest.service.ts`
- Modificar: `backend/src/controllers/auth.controller.ts` (`demoLogin` chama `GuestService.createGuestSession()`)
- Teste: `backend/tests/integration/auth_demo.test.ts`

**Interfaces:**
- Consome: `toAuthResponse(user: User, persistent: boolean): AuthResponse` (exportar de `auth.service.ts`), `UserService.completeOnboarding(userId, dto)`, `MealService.createMeal(userId, { name, mealTime, items })`, `UserModel.deleteUser(id)`.
- Produz (`guest.model.ts`):
  - `createGuestUser(email: string, passwordHash: string): Promise<User>` — `INSERT ... (name 'Visitante', email, password_hash, terms_accepted_at now(), email_verified_at now(), is_guest true) RETURNING *`.
  - `deleteExpiredGuests(maxAgeHours: number, limit: number): Promise<number>` — `DELETE FROM users WHERE id IN (SELECT id FROM users WHERE is_guest AND created_at < now() - make_interval(hours => $1) LIMIT $2)`. Se o item 1 do Foco de Revisão falhar por `RESTRICT`, apagar antes `meals` dos mesmos ids na mesma transação.
  - `countActiveGuests(): Promise<number>`.
  - `findGlobalFoodIdsByNames(names: string[]): Promise<Map<string, string>>` — `WHERE user_id IS NULL AND active AND name = ANY($1)`.
- Produz (`guest.service.ts`): `createGuestSession(): Promise<AuthResponse>`; constantes `GUEST_TTL_HOURS = 24`, `GUEST_MAX_ACTIVE = 500`, `CLEANUP_BATCH = 50`.

Valores fixos do seed:
- E-mail: `demo-${randomUUID()}@visitante.invalid`; senha: `bcrypt.hash(randomBytes(32).toString('hex'), bcryptCost())` (mesmo custo do `register`; `bcryptCost` vem de `backend/src/utils/authTokens.ts`).
- Onboarding: `{ sex: 'masculino', birthDate: '1995-06-15', goal: 'perder_peso', weight: 80, height: 178, body_fat: null, activity_level: 'moderadamente_ativo' }`.
- Refeições: hoje e os 6 dias anteriores (datas de `getSaoPauloDateString`, horário montado como `${data}T07:30:00-03:00`; São Paulo não tem horário de verão desde 2019), três por dia:
  - `Café da manhã` 07:30 — Pão Francês 50, Ovo Cozido 100, Leite Integral 200
  - `Almoço` 12:30 — Arroz Branco Cozido 150, Feijão Carioca Cozido 100, Frango Grelhado 120
  - `Jantar` 19:30 — Aveia em Flocos 40, Banana Prata 100, Maçã 150
  - Itens cujo alimento não existe são ignorados; refeição sem itens não é criada.
- Ordem: `deleteExpiredGuests` (erro aqui só gera log, não bloqueia) → `countActiveGuests >= GUEST_MAX_ACTIVE` ⇒ `fail('Demonstração indisponível no momento.', 503, 'DEMO_UNAVAILABLE')` → criar → onboarding + refeições em `try`; no `catch`, `deleteUser` e relançar → `toAuthResponse(user, false)`.

- [ ] **Passo 1: Escrever os testes que falham** em `auth_demo.test.ts`:
  - `cria um visitante novo por clique, com metas e refeições de hoje` — dois `POST /api/auth/demo` devolvem `user.id` diferentes; `user.onboarding_completed === true`; `user.daily_calories_goal > 0`; `GET /api/meals/today?date=<hoje>` com o token devolve 3 refeições; `password_hash` e `mfa_secret_enc` ausentes na resposta.
  - `bloqueia senha, e-mail, MFA e exclusão do visitante` — `PUT /api/users/me`, `DELETE /api/users/me`, `POST /api/users/me/mfa/setup` → 403 `DEMO_READ_ONLY`; `POST /api/meals` → 201 (visitante pode registrar).
  - `apaga visitantes com mais de 24h, inclusive com alimento próprio em refeição` — criar visitante, criar alimento próprio e refeição com ele, `UPDATE users SET created_at = now() - interval '25 hours' WHERE id = $1`, novo `POST /api/auth/demo`, conferir que o id antigo sumiu de `users`.
  - `responde 503 quando o teto de visitantes é atingido` — chamar `createGuestSession` com o teto rebaixado (exportar `GUEST_MAX_ACTIVE` como parâmetro opcional `createGuestSession(maxActive = GUEST_MAX_ACTIVE)` só para isso) → `statusCode 503`, `code 'DEMO_UNAVAILABLE'`.
  - `cria a conta mesmo sem alimentos do seed no catálogo` — `findGlobalFoodIdsByNames` com nomes inexistentes devolve `Map` vazio, e o serviço com essa lista vazia devolve sessão válida (passar a lista de seed como parâmetro opcional do serviço).
- [ ] **Passo 2:** `npm run test:file -- tests/integration/auth_demo.test.ts` — esperado FALHAR (`createGuestSession` não existe).
- [ ] **Passo 3:** Implementar model, service e controller conforme as Interfaces.
- [ ] **Passo 4:** Rodar de novo — esperado PASSAR (5 testes).
- [ ] **Passo 5:** Commit `feat(demo): conta de visitante temporária com seed e limpeza`.

### Tarefa 3: Frontend, documentação e verificação final

**Arquivos:**
- Manter sem mudança: `frontend/src/components/auth/DemoLoginButton.tsx`, `frontend/src/services/auth.service.ts` (`demoLogin`), botões em `LandingPage.tsx` e `LoginPage.tsx`.
- Modificar: `frontend/src/components/auth/DemoLoginButton.tsx` — texto de apoio abaixo do botão: `Conta temporária, apagada em 24 h.` (`text-xs text-muted-foreground`).
- Modificar: `docs/DECISOES.md` (nova decisão: visitante temporário, TTL 24 h, teto 500, ações bloqueadas) e `docs/ARCHITECTURE.md` (coluna `users.is_guest`).
- Modificar: `CLAUDE.md` e `AGENTS.md` — uma linha em "Convenções": `POST /api/auth/demo` cria visitante `is_guest`; bloqueio via `blockGuestUser`.

- [ ] **Passo 1:** Ajustar o texto do botão e a documentação.
- [ ] **Passo 2:** `npm run lint` → 0 erros; `npm --prefix frontend test` → todos passam; `npm run test:strict` → todos passam, código 0.
- [ ] **Passo 3:** Commit `docs(demo): documenta conta de visitante temporária`.
