# Revisão de segurança: padrões inseguros e análise de variantes

- **Data:** 03/11/2026
- **Branch:** `feat/audit-backlog-remediation` (base `4f437f6`)
- **Escopo:** repositório inteiro (backend, shared, frontend, Docker, CI, scripts).
- **Método:**
  1. **Insecure defaults** (Trail of Bits `insecure-defaults`): busca guiada pelas 6 categorias do corpus do plugin (segredos de fallback, credenciais padrão, chaves que falham abertas, criptografia fraca, acesso permissivo, depuração exposta). Cada candidato foi rastreado até a decisão de segurança que ele afeta.
  2. **Análise de variantes:** para cada vulnerabilidade já corrigida (`docs/ISSUES.md` #1–#23 e lotes A-xxx/PC-xx do `git log`), procurei o mesmo padrão em outros arquivos.

> **Limitação do método.** O pipeline automático do `insecure-defaults` (tool `Workflow`) não estava disponível nesta sessão, e o plugin `variant-analysis` não está instalado. As duas análises foram feitas manualmente, com o corpus de referência do plugin e `grep`/leitura de código. Não houve execução dinâmica nem testes de exploração.

## Escala de severidade

| Severidade | Critério |
|---|---|
| **Alta** | Leva a bypass de autenticação ou acesso a dados de outro usuário, mesmo dependendo de um erro plausível de deploy. |
| **Média** | Desliga um controle de segurança sem aviso ou enfraquece uma defesa importante. |
| **Baixa** | Defesa em profundidade; exige outra falha antes para ter impacto. |
| **Info** | Padrão frágil sem impacto hoje; risco de regressão futura. |

**Status:** `Corrigido` (com teste quando há lógica nova) · `Aceito` (risco residual justificado) · `Sem variantes` (padrão corrigido não se repete).

## Resumo

| ID | Achado | Severidade | Status |
|---|---|---|---|
| ID-1 | Placeholders de `JWT_SECRET`/`AUTH_TOKEN_PEPPER` no `.env.example` passam na validação | Alta | Corrigido |
| ID-2 | `NODE_ENV` cai em `development` quando ausente e desliga todas as travas de produção | Média | Corrigido |
| ID-3 | Captcha desligado em produção quando `CAPTCHA_SECRET_KEY` falta | Média | Corrigido |
| ID-4 | Chave pública VAPID fixa fora de produção | Info | Corrigido |
| V-1 | `sensitiveActionLimiter` usa store em memória (variante do #5) | Baixa | Corrigido |
| V-2 | Desativar MFA e fazer logout não revogam sessões (variante do A8) | Baixa | Corrigido |
| V-3 | "Lembrar de mim" desmarcado ainda gera cookie persistente de 1 dia (variante do #1) | Baixa | Corrigido |
| V-4 | TOTP sem proteção contra reuso do mesmo código (variante do #7) | Baixa | Corrigido |
| V-5 | Troca de e-mail revela se o endereço já tem conta (variante da regra anti-enumeração) | Baixa | Aceito |
| V-6 | Schemas sem `.strict()` e sem limites em push/refeições/admin (variante do #11) | Info | Corrigido (push); Aceito (demais) |
| V-7 | `userId` opcional em `FoodModel.findById/findByIds` (variante do #23, IDOR) | Info | Corrigido |
| V-8 | Custo do bcrypt lido de `process.env.NODE_ENV` cru | Info | Corrigido |
| SC-1 | `glob`/`minimatch` com advisories na árvore de produção do backend | Média | Corrigido |
| SC-2 | `uuid` com advisory via `autocannon` (dev) | Baixa | Corrigido |
| SC-3 | `minimatch@10` em ferramentas de dev (`archunit`, `eslint`) | Baixa | Aceito |
| — | Variantes de #12, #13, #18, PC-19, A-002 (segredos em log) e SW | — | Sem variantes |

As Partes 1 e 2 descrevem o estado encontrado na revisão; a Parte 3 registra as correções e a Parte 4, a auditoria de dependências.

---|---|---|---|
| ID-1 | Placeholders de `JWT_SECRET`/`AUTH_TOKEN_PEPPER` no `.env.example` passam na validação | Alta | Aberto |
| ID-2 | `NODE_ENV` cai em `development` quando ausente e desliga todas as travas de produção | Média | Mitigado (só no Dockerfile) |
| ID-3 | Captcha desligado em produção quando `CAPTCHA_SECRET_KEY` falta | Média | Mitigado (rate limit + bloqueio) |
| ID-4 | Chave pública VAPID fixa fora de produção | Info | Aberto |
| V-1 | `sensitiveActionLimiter` usa store em memória (variante do #5) | Baixa | Aberto |
| V-2 | Desativar MFA e fazer logout não revogam sessões (variante do A8) | Baixa | Aberto |
| V-3 | "Lembrar de mim" desmarcado ainda gera cookie persistente de 1 dia (variante do #1) | Baixa | Aberto |
| V-4 | TOTP sem proteção contra reuso do mesmo código (variante do #7) | Baixa | Aberto |
| V-5 | Troca de e-mail revela se o endereço já tem conta (variante da regra anti-enumeração) | Baixa | Aberto |
| V-6 | Schemas sem `.strict()` e sem limites em push/refeições/admin (variante do #11) | Info | Aberto |
| V-7 | `userId` opcional em `FoodModel.findById/findByIds` (variante do #23, IDOR) | Info | Aberto |
| V-8 | Custo do bcrypt lido de `process.env.NODE_ENV` cru | Info | Mitigado |
| — | Variantes de #12, #13, #18, PC-19, A-002 (segredos em log) e SW | — | Sem variantes |

---

## Parte 1: padrões inseguros

### ID-1 · Alta · Placeholders de segredo aceitos pela validação
- **Onde:** `backend/.env.example:13` e `:50`; validação em `backend/src/config/env.ts:27-32` e `:88`.
- **Problema:** `env.ts` só exige 32+ caracteres e `AUTH_TOKEN_PEPPER !== JWT_SECRET`. Os placeholders `preencha_com_32_caracteres_no_minimo_para_seguranca` (51 caracteres) e `preencha_com_32_caracteres_aleatorios_diferente_do_jwt_secret` cumprem as duas regras. Se alguém copiar o `.env.example` para produção sem trocar os valores, a API sobe normalmente com segredos públicos (estão no repositório).
- **Impacto:** com o `JWT_SECRET` conhecido, qualquer pessoa assina um JWT `{ userId, tv }` válido. Basta saber o UUID do usuário e o `token_version` (um inteiro baixo, fácil de adivinhar). O papel vem do banco (B1), então um token forjado com o `userId` de um admin passa no `requireAdmin`. O MFA só é cobrado no login e `mfaEnabled` vem do banco, então o MFA também é contornado. O pepper conhecido também expõe os segredos TOTP, cifrados com chave derivada dele (`utils/totp.ts:79`).
- **Correção sugerida:** no `superRefine` de `env.ts`, rejeitar valores que contenham `preencha`/`sua_senha` (ou comparar com uma lista dos placeholders) e, em produção, exigir entropia mínima (ex.: hex/base64 com 32+ bytes).

### ID-2 · Média · `NODE_ENV` ausente = modo desenvolvimento
- **Onde:** `backend/src/config/env.ts:19` (`.default('development')`).
- **Problema:** toda trava de produção depende de `NODE_ENV === 'production'`. Se a variável faltar, o servidor sobe e falha aberto:
  - cookie de sessão sem `Secure` (`utils/sessionCookie.ts:10`);
  - conexão com o Postgres **sem TLS** (`database/pool.ts:26`, `ssl: false`);
  - `CORS_ORIGIN` aceita `*`/`localhost`/http (`env.ts:96-116`);
  - `MAIL_TRANSPORT=memory` permitido: e-mails de verificação e reset somem (`env.ts:90`);
  - SMTP sem `requireTLS` (`mail/mailer.ts:57`);
  - `APP_BASE_URL` http aceito (`env.ts:118`);
  - chave VAPID padrão servida (ID-4).
- **Mitigação existente:** o `Dockerfile` define `ENV NODE_ENV=production`. Um deploy que não use essa imagem (ex.: runtime Node nativo do Render) fica exposto.
- **Correção sugerida:** remover o `.default` e exigir `NODE_ENV` explícito (o runner de testes e o `.env.example` já o definem).

### ID-3 · Média · Captcha falha aberto por configuração
- **Onde:** `backend/src/middlewares/captcha.ts:13` (`if (!secret) return next();`) e `env.ts:41-44`.
- **Problema:** o middleware falha fechado quando há secret, mas sem `CAPTCHA_SECRET_KEY` o captcha some em silêncio, também em produção. O `.env.example` traz a chave vazia.
- **Mitigação existente:** rate limit compartilhado (#5) e bloqueio de conta (#4) continuam valendo.
- **Correção sugerida:** no `superRefine`, exigir `CAPTCHA_SECRET_KEY` quando `NODE_ENV=production`, ou ao menos registrar um `warn` na inicialização.

### ID-4 · Info · Chave pública VAPID fixa fora de produção
- **Onde:** `backend/src/services/push.service.ts:15-26`.
- **Problema:** fora de produção, a API devolve uma chave pública VAPID embutida no código, sem a privada correspondente. Hoje o backend não envia pushes (não há `web-push`), então não há impacto. Somado ao ID-2, uma instância de produção sem `NODE_ENV` registraria inscrições com uma chave que ninguém controla.
- **Correção sugerida:** responder 503 sempre que `VAPID_PUBLIC_KEY` faltar.

### Itens verificados sem achado
- `JWT_SECRET`, `AUTH_TOKEN_PEPPER`, `DB_PASSWORD`, `APP_BASE_URL`, `MAIL_FROM`: obrigatórios, sem fallback (fail-fast com `process.exit(1)`).
- `TRUST_PROXY`: padrão `false`; `true` é rejeitado (`config/trustProxy.ts`).
- JWT: algoritmo fixado em `HS256` na assinatura e na verificação; `tv` obrigatório.
- Criptografia: códigos com HMAC-SHA256 + pepper, reset com SHA-256 de 32 bytes aleatórios, `timingSafeEqual`, AES-256-GCM com IV aleatório para o segredo TOTP, bcrypt custo 10. O SHA-1 do TOTP é o exigido pela RFC 6238 (aceitável).
- Postgres em produção usa `rejectUnauthorized: true`.
- `docker-compose.yml`: portas só em `127.0.0.1`; `DB_PASSWORD` obrigatória. O Mailpit aceita qualquer autenticação, mas só em loopback (aceitável em dev).
- CI: `permissions: contents: read`, actions fixadas por SHA.
- Front: `sourcemap: false`, CSP/HSTS em `_headers`, sem `dangerouslySetInnerHTML`/`eval`. O service worker não faz cache de `/api`.
- Scripts destrutivos (`reset-db.js`, `e2e-seed.ts`) exigem banco `_test`.

---

## Parte 2: análise de variantes das correções anteriores

### V-1 · Baixa · Limitador de ações sensíveis em memória (variante do #5)
- **Corrigido antes:** #5 moveu os limitadores de `/api/auth/*` para o `PgRateLimitStore` compartilhado.
- **Variante:** `backend/src/routes/user.routes.ts:22` cria `sensitiveActionLimiter` com `rateLimit()` sem `store`, ou seja, `MemoryStore`. Ele protege troca de senha/e-mail (que exige senha atual), exclusão de conta e `mfa/enable|disable`. Com mais de uma instância, ou após um restart, o contador zera, o que facilita força bruta da senha atual ou do código TOTP com uma sessão roubada.
- **Correção sugerida:** reutilizar `createAuthRateLimiter`, ou passar `new PgRateLimitStore('sensitiveAction')` fora de `NODE_ENV=test`.

### V-2 · Baixa · Sessões não revogadas em mudanças de segurança (variante do A8)
- **Corrigido antes:** A8 incrementa `token_version` na troca de senha, de e-mail e no reset.
- **Variante:**
  - `disableMfa`/`enableMfa` (`models/auth.model.ts:309-321`) não incrementam `token_version`. Se uma sessão roubada desativar o MFA, as outras sessões continuam válidas, e o dono legítimo não derruba o invasor ao reativar o MFA.
  - `POST /api/auth/logout` (`controllers/auth.controller.ts:40`) só apaga o cookie. O JWT continua válido até o `exp` (1 dia), e o backend ainda o devolve no corpo do login (limitação registrada no #1).
- **Correção sugerida:** incrementar `token_version` em `disableMfa` (e emitir cookie novo para a sessão atual); avaliar o mesmo no logout ("sair de todos os dispositivos").

### V-3 · Baixa · Cookie persistente ignora "lembrar de mim" (variante do #1)
- **Corrigido antes:** #1 moveu o JWT para cookie HttpOnly com TTL de 1 dia.
- **Variante:** com "lembrar de mim" desmarcado, o front guarda o marcador em `sessionStorage` (`frontend/src/context/AuthContext.tsx:72-74`), mas `setSessionCookie` sempre define `maxAge` (`utils/sessionCookie.ts:17`). O cookie sobrevive ao fechamento do navegador; em computador compartilhado, a próxima pessoa ainda tem uma sessão válida na API, mesmo com a UI deslogada.
- **Correção sugerida:** enviar `remember_me` no login e, quando falso, emitir cookie de sessão (sem `maxAge`).

### V-4 · Baixa · Reuso de código TOTP (variante do #7)
- **Corrigido antes:** #7 adicionou MFA com códigos de recuperação de uso único.
- **Variante:** `verifyTotp` (`utils/totp.ts:61`) aceita o mesmo código durante toda a janela de ±1 passo (~90 s). Não há registro do último passo usado, então um código observado (phishing em tempo real, shoulder surfing) pode ser reutilizado.
- **Correção sugerida:** guardar o último contador aceito por usuário e rejeitar contadores menores ou iguais.

### V-5 · Baixa · Enumeração de e-mail na troca de endereço (variante da regra anti-enumeração)
- **Corrigido antes:** #8 e as rotas `register`/`resend-code`/`forgot-password` respondem igual exista ou não a conta.
- **Variante:** `PUT /api/users/me` com novo e-mail responde "Este e-mail já está em uso por outra conta." (`services/user.service.ts:145-149`). Exige sessão e senha atual, e o limitador de V-1 se aplica, por isso a severidade baixa.
- **Correção sugerida:** responder com sucesso genérico e mandar o código de verificação ao novo endereço apenas se ele estiver livre (ou avisar o dono existente por e-mail).

### V-6 · Info · Schemas sem `.strict()` e sem limites (variante do #11)
- **Corrigido antes:** #11 adicionou `min/max` e `.strict()` em `user.schema.ts` e `food.schema.ts`.
- **Variante:** `meal.schema.ts`, `push.schema.ts`, `admin-food.schema.ts`, `common.schema.ts` e os schemas de auth em `user.schema.ts` (`registerUserSchema`, `loginUserSchema`, `verifyEmailSchema`, `resetPasswordSchema`…) não usam `.strict()`. O Zod descarta chaves desconhecidas por padrão, então não há mass assignment. Em `push.schema.ts`, `endpoint` aceita qualquer URL (inclusive `http://`/IP interno) e `keys.p256dh`/`keys.auth` não têm `max`. Sem envio de push no servidor não há SSRF hoje, mas o risco aparece quando o envio for implementado.
- **Correção sugerida:** `.max()` nos campos de push e `endpoint` restrito a `https://`; `.strict()` onde não houver chaves extras legítimas.

### V-7 · Info · Filtro de dono opcional nos models (variante do #23)
- **Corrigido antes:** #23 cobriu IDOR com testes por recurso.
- **Variante:** `FoodModel.findById(id, userId?)` e `findByIds(ids, userId?)` (`models/food.model.ts:109-120`) só filtram `user_id` quando o parâmetro vem. Sem ele, devolvem alimentos personalizados de qualquer usuário. Todos os chamadores atuais passam `userId` (`food.service.ts:36`, `meal.service.ts:23,74`, `saved_meal.service.ts:16`), mas um chamador novo que o esqueça abre um IDOR em silêncio. `SavedMealModel.findById` (`models/saved_meal.model.ts:126`) também não filtra por dono, embora não seja chamado de fora do model.
- **Correção sugerida:** tornar `userId` obrigatório e criar funções separadas e explícitas para os usos administrativos.

### V-8 · Info · Custo do bcrypt via `process.env` (variante de A-001)
- **Onde:** `services/auth.service.ts:57` e `services/user.service.ts:168` leem `process.env.NODE_ENV` cru (custo 1 em `test`).
- **Mitigação:** `NODE_ENV=test` em banco que não termina em `_test` aborta o processo (`database/pool.ts:13`), então isso não chega à produção. Para consistência, use `env.NODE_ENV` e uma única função `saltRounds()`.

### Padrões corrigidos sem variantes encontradas
| Correção anterior | Busca feita | Resultado |
|---|---|---|
| #12 vazamento de erro do `pg` | `err.message`/`error.message` em controllers, rotas e services | Só em logs estruturados ou na CLI de curadoria; 5xx sempre genérico. |
| #13 CORS em produção | outras checagens de origem | `authenticate` (CSRF) usa a mesma lista `CORS_ORIGIN`. |
| #18 rota de teste em produção | rotas condicionadas a `NODE_ENV`/debug | Só `/test-compression-payload`, montada apenas em `test`. |
| PC-19 dados sensíveis no `localStorage` | `localStorage`/`sessionStorage` no front | Só `user_session` sanitizado (id, nome, e-mail, onboarding, papel), marcador `auth_session` e tema. |
| A-002/A4 segredos em log | `structuredLog`/`console` com código, token ou senha | Só `error.message` de falha de envio; nenhum segredo. URLs logadas não contêm token (reset usa `#token`). |
| B11 guard admin | `router.use` nos roteadores admin | `admin.routes.ts:9` aplica `authenticate, requireAdmin` a `/foods` e `/alimentos`. |
| Cache de dados autenticados | service worker | `sw.js` ignora `/api`. |

---

## Parte 3: correções aplicadas (03/11/2026)

| ID | O que mudou | Arquivos | Teste |
|---|---|---|---|
| ID-1 | `superRefine` recusa `JWT_SECRET`/`AUTH_TOKEN_PEPPER` que contenham `preencha`, `sua_senha`, `changeme`, `placeholder`, `example`/`exemplo`. | `backend/src/config/env.ts`, `backend/.env.example` | `tests/unit/env_and_cors.test.ts` |
| ID-2 | `NODE_ENV` sem default: se faltar, a API não sobe. | `backend/src/config/env.ts` | idem |
| ID-3 | `NODE_ENV=production` exige `CAPTCHA_SECRET_KEY`. | `backend/src/config/env.ts` | idem |
| ID-4 | Chave VAPID fixa removida: sem `VAPID_PUBLIC_KEY`, `GET /api/push/public-key` responde 503 em qualquer ambiente. O runner de testes define uma chave de teste. | `backend/src/services/push.service.ts`, `scripts/run-tests.mjs` | `push_notifications.test.ts` |
| V-1 | `sensitiveActionLimiter` usa `PgRateLimitStore` fora de `NODE_ENV=test`. | `backend/src/routes/user.routes.ts` | coberto pelo teste do store (#5) |
| V-2 | Ativar/desativar MFA incrementa `token_version` e devolve cookie novo à sessão atual. `POST /api/auth/logout` valida o JWT apresentado e grava seu `jti` em `revoked_sessions` até o `exp` (migration `1793500000000`); o `authenticate` checa essa tabela na mesma consulta do usuário. "Sair" encerra só a sessão atual; `token_version` segue revogando todas (senha, e-mail, MFA). | `utils/jwt.ts`, `middlewares/auth.ts`, `models/auth.model.ts`, `services/mfa.service.ts`, `services/auth.service.ts`, `controllers/{mfa,auth}.controller.ts`, `utils/sessionCookie.ts` (`readRequestToken`) | `auth_mfa.test.ts`, `session_cookie.test.ts` |
| V-3 | `remember_me` em `login`/`verify-email` (padrão `true`). Com `false`, o JWT carrega `p: false` e vira cookie sem `Max-Age`; renovações (`PUT /users/me`, MFA) preservam o tipo. O front envia `rememberMe`. | `utils/jwt.ts`, `utils/sessionCookie.ts`, `middlewares/auth.ts`, `shared/src/schemas/user.schema.ts`, `frontend/src/services/auth.service.ts`, `VerifyEmailPage.tsx` | `session_cookie.test.ts` |
| V-4 | `matchTotpCounter` devolve o passo aceito; `claimTotpCounter` só aceita passo maior que `mfa_last_counter` (atualização atômica). O passo usado na ativação já fica registrado. Migration `1793400000000_add-mfa-last-counter`. | `utils/totp.ts`, `services/mfa.service.ts`, `models/auth.model.ts`, `backend/migrations/` | `auth_mfa.test.ts` |
| V-6 | Push: `endpoint` só `https://` e até 2048 caracteres, chaves até 256, `.strict()`. | `shared/src/schemas/push.schema.ts` | `push_notifications.test.ts` |
| V-7 | `userId` obrigatório em `FoodModel.findById/findByIds` e `FoodService.getById`; o filtro de dono entra sempre no SQL. `SavedMealModel.findById` ficou como está: não é exportado e só roda logo após o próprio dono inserir o registro. | `models/food.model.ts`, `services/food.service.ts` | `authorization.test.ts` (IDOR) |
| V-8 | `bcryptCost()` único em `utils/authTokens.ts`, lido de `env.NODE_ENV`. | `utils/authTokens.ts`, `services/{auth,user}.service.ts` | suíte existente |

**Riscos aceitos:**
- **V-5:** responder "sucesso" quando o novo e-mail já pertence a outra conta mostraria na tela um e-mail que não foi gravado (há `UNIQUE` em `users.email`). Para enumerar, o atacante precisa de sessão válida e da senha atual, e o limitador de V-1 (15 por 15 min, agora compartilhado) se aplica. Reavaliar se a troca de e-mail passar a ser feita por confirmação no endereço novo.
- **V-6 (demais schemas):** sem `.strict()`, o Zod descarta chaves desconhecidas antes do controller, então não há mass assignment. Ligar `.strict()` em auth/refeições quebraria clientes que enviam campos extras, sem ganho de segurança.

**Verificação:** backend `npm run test:strict` 329/329; frontend `npm --prefix frontend test` 320/320; `npm run lint` sem erros (6 warnings já existentes em `auth.service.ts`); `npm run build` ok; Prettier ok nos arquivos alterados. Migration aplicada só no banco `contador_calorias_test`.

**Ação manual pendente:** rodar `npm run setup` no banco de desenvolvimento (coluna `mfa_last_counter`; sem ela, o login com MFA falha) e, em produção, definir `NODE_ENV`, `CAPTCHA_SECRET_KEY` e `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`.

---

## Parte 4: cadeia de suprimentos (Trail of Bits `supply-chain-risk-auditor`)

O coletor do plugin (`collect.py` + `render.py`, só biblioteca padrão; executado com Python 3.13 porque o `uv` não está instalado) rodou contra a raiz, `backend`, `frontend` e `shared`, lendo `package.json` e `package-lock.json`. O `gh` não está instalado, então a API do GitHub limitou a taxa de chamadas. Os critérios de repositório (arquivado, atividade de manutenção, Scorecard, política de segurança) ficaram sem avaliação para a maioria das dependências, como mostra a coluna "Repositório avaliado".

### Cobertura medida (antes das correções)

| Pacote | Diretas | Transitivas verificadas | Advisories em diretas | Transitivas com advisory | Repositório avaliado |
|---|---|---|---|---|---|
| raiz | 12 | 264 | 0 | 1 (`minimatch` 10.2.6, build) | 12/12 |
| backend | 28 | 341 | 0 | 4 (`glob` 13.0.6 e `minimatch` 10.2.6/3.1.5 em produção; `uuid` 8.3.2, build) | 3/28 |
| frontend | 43 | 466 | 0 | 1 (`minimatch` 10.2.6, build) | 6/43 |
| shared | 2 | 0 | 0 | 0 | 0/2 |

Nenhuma dependência direta tem advisory conhecido, está depreciada ou executa script de instalação (`Install-time script execution`: 0 sinalizadas em todos os pacotes).

### Achados e correções

| ID | Achado | Severidade | Correção | Status |
|---|---|---|---|---|
| SC-1 | `node-pg-migrate@9.0.0 → glob@13.0.6` (GHSA-3g3m-2fjr-6pw4, faixa `>=9.0.0 <=14.0.1`) e `minimatch@10.2.6` (GHSA-g3hv-75wg-m249, `<11.0.1`); `bcrypt@5.1.1 → @mapbox/node-pre-gyp → rimraf@3 → glob@7 → minimatch@3.1.5`. Alcançam produção. | Média | `bcrypt` 5.1.1 → 6.0.0 (troca `node-pre-gyp` por `node-gyp-build` e remove a cadeia `rimraf/glob@7`; mesma API, hashes `$2b$` compatíveis). Override `node-pg-migrate → glob@^14.0.3` (traz `minimatch@11.0.4`). `npm run migrate` validado no banco de teste. | Corrigido |
| SC-2 | `autocannon → hyperid@3.3.0 → uuid@8.3.2` (GHSA-w5hq-g745-h8pq, `<11.1.1`). Só build/CI (teste de carga). | Baixa | Override `hyperid → uuid@^11.1.1` (o `hyperid` só usa `uuid.v4` como fallback de `crypto.randomUUID`). | Corrigido |
| SC-3 | `minimatch@10.2.6` em `archunit` (backend/front) e `eslint`/`typescript-eslint` (raiz/front). Só build/CI, com padrões escritos pelo próprio projeto. | Baixa | Um override global para `minimatch@11` quebrou o `archunit` (`minimatch.makeRe is not a function`) e foi revertido. Atualizar quando `archunit`/`eslint` aceitarem `minimatch@11`. | Aceito |
| SC-4 | Concentração de publicadores (um publicador humano listado no npm): produção do backend `jsonwebtoken`, `pg`, `cross-env`; produção do front `clsx`, `class-variance-authority`, `react-hook-form`, `qrcode.react`. | Info | Nenhuma ação imediata: são pacotes com dezenas de milhões de downloads semanais. As versões já estão fixadas pelo lockfile e o CI usa `npm ci`. | Aceito |
| SC-5 | `cross-env` e `tsx` estão em `dependencies` do backend e vão para a imagem de produção (o `npm start` usa `tsx`). | Info | Mantido: o `Dockerfile` executa a API com `tsx`. Compilar para JS e mover os dois para `devDependencies` reduziria a superfície. | Aceito |

**Depois das correções:** `npm audit --omit=dev` mostra 0 vulnerabilidades na raiz, no backend e no front. O `npm audit` completo mostra apenas o `minimatch` de SC-3 (dev).

**Install scripts:** nenhuma dependência direta foi sinalizada. O `bcrypt@6` compila ou baixa o binário nativo via `node-gyp-build` na instalação, então `npm ci --ignore-scripts` não é viável no backend sem um passo `npm rebuild bcrypt` depois.

Relatórios brutos do coletor (fora do repositório): `C:\Users\Luis\AppData\Local\Temp\claude\243e04b0896c7977\5a24b03b-89ce-445c-bb43-86d3abd93538\scratchpad\sc\` (`root.md`, `backend.md`, `frontend.md`, `shared.md`).
