# Auditoria do CalorieSync

Auditoria de leitura (nenhum arquivo de código foi alterado) contra os conceitos de `docs/guia-tech/03-seguranca-web.md`, `05-engenharia-qualidade-devops.md`, `07-seo-geo-presenca-online.md` e `08-legal-lgpd-acessibilidade.md`.

- **Método:** contexto do código montado com a skill `audit-context-building` (três análises por função: autenticação/sessão, propriedade dos dados/SQL, borda/infra), mais leitura direta dos arquivos citados e dois comandos (`npm audit`).
- **Legenda:** ✅ feito · 🟡 parcial · ❌ falta · ➖ não se aplica.
- **Não verificado (importante):** nada foi executado em runtime (sem testes, sem navegador, sem requisições reais). Não há deploy nem Dockerfile da aplicação no repositório, então tudo o que depende de hospedagem (HTTPS, HSTS, headers do front, `TRUST_PROXY`, valor real de `CORS_ORIGIN`) está marcado como não verificável. Caminhos são relativos à raiz; `backend/src/...` aparece abreviado como `be/...` e `frontend/src/...` como `fe/...`.
- **Comandos rodados:** `npm audit --json` em `backend/`, `frontend/` e na raiz.

---

## 1. Segredos

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Variáveis de ambiente e secrets fora do código | ✅ | `be/config/env.ts` valida na subida e faz `process.exit(1)` (l.106-111); `JWT_SECRET` ≥ 32 (l.24); pepper ≥ 32 e ≠ JWT (l.73-79). `.gitignore:33-34` ignora `.env`; só `backend/.env.example` é versionado (`git ls-files`) | Os valores de teste do CI (`JWT_SECRET`, `AUTH_TOKEN_PEPPER`) estão em `.github/workflows/ci.yml`; são valores de teste, mas ficam no repositório | baixo |
| Scanner de segredos | ✅ | `.gitleaks.toml`, `.gitleaksignore`, `ci.yml:56` (`gitleaks-action@v2`) | Revisar o conteúdo do `.gitleaksignore` (o que está sendo ignorado) | baixo |
| Variáveis expostas ao front (`VITE_`) | ✅ | Só `VITE_API_URL` (`fe/services/api.ts:1`, `fe/mocks/handlers.ts:3`); é URL pública, não segredo | Nada | baixo |
| Source maps em produção | 🟡 | Nenhuma opção `sourcemap` em `frontend/vite.config.ts` nem nos `tsconfig*.json`; o padrão do Vite é não gerar | Declarar `build.sourcemap: false` explicitamente e confirmar o artefato com `npm run build` | baixo |
| Rotas de debug/seed/teste expostas | 🟡 | Nenhuma montada em `be/app.ts:62-71`; `db:reset` recusa rodar fora de `NODE_ENV=test` + banco `_test` (`backend/scripts/reset-db.js:5`). Porém `app.ts:104` deixa passar `/test-compression-payload` (rota de teste) | Remover essa exceção do código de produção; tratar `/test-compression-payload` como 404 | baixo |
| Chave VAPID padrão | 🟡 | `be/services/push.service.ts:15,24` serve uma chave pública VAPID fixa se faltar a variável e `NODE_ENV` ≠ production | Exigir `VAPID_*` em `env.ts` quando o push for ligado; `VAPID_PRIVATE_KEY` é lida e não usada | baixo |

## 2. Navegador

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Onde fica o JWT | ❌ | `localStorage` (`auth_token`) ou `sessionStorage` conforme "lembrar-me" (`fe/context/AuthContext.tsx:79-87`); enviado como `Bearer` (`fe/services/api.ts:53-57`). Nenhum cookie no backend | Migrar para cookie `HttpOnly; Secure; SameSite` (o guia 03 §2 desaconselha token em `localStorage`). Qualquer XSS rouba a sessão de 7 dias | alto |
| `apiFetch` lê só `localStorage` | 🟡 | `fe/services/api.ts:53` e `:100` usam `localStorage.getItem('auth_token')`, enquanto o `AuthContext` grava no `sessionStorage` quando "lembrar-me" está desmarcado | **Não testado em runtime.** Se não houver outro caminho, a sessão sem "lembrar-me" não envia o header e cai em 401/logout. Verificar e unificar a leitura do token | médio |
| XSS / HTML injetado | ✅ | Nenhum `dangerouslySetInnerHTML`/`innerHTML` em `frontend/src` (grep) | Nada | baixo |
| Sanitização de HTML | ➖ | Não há entrada de HTML rico; React escapa por padrão | — | baixo |
| CSP no front | ❌ | O CSP do helmet (`app.ts:29-42`) vale só para a API (`default-src 'none'`). `frontend/index.html` não tem CSP; headers do host do front não existem no repo | Definir CSP, HSTS, `X-Content-Type-Options`, `frame-ancestors` no host do front | médio |
| Service worker | ✅ | `frontend/public/sw.js:38` não faz cache de `/api` | Nada | baixo |

## 3. Autenticação

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Hash de senha | ✅ | bcrypt custo 10, custo 1 só em teste (`be/services/auth.service.ts:55-57`); senha 8-72 com letra e número (`shared/src/schemas/user.schema.ts:3-7`); `DUMMY_HASH` equaliza tempo de login (l.189) | Confirmar que `DUMMY_HASH` (l.66) é um hash bcrypt válido; avaliar exigir senha mais longa | baixo |
| Expiração de sessão | 🟡 | JWT HS256, `7d` por padrão (`env.ts:25`, `be/utils/jwt.ts:10-11`); sem refresh token | Sessão longa sem rotação. Reduzir TTL e/ou criar refresh token com rotação | médio |
| Revogação de sessão | ✅ | `tv` do JWT comparado ao `users.token_version` a cada requisição (`be/middlewares/auth.ts:92`); reset de senha incrementa a versão (`auth.service.ts:331-342`) | `email_verified_at` não é revalidado por requisição; verificar e-mail não incrementa `token_version` | baixo |
| Tentativas de login / bloqueio de conta | ❌ | Falha de login não grava nada no banco (`auth.service.ts:187-196`). Só `express-rate-limit`: IP 30/15min e IP+e-mail 10/15min (`auth.routes.ts:29-40`) | Contador por conta com atraso progressivo ou bloqueio temporário e aviso por e-mail | alto |
| Captcha | ❌ | Nada encontrado; só comentário de trabalho futuro em `authRateLimit.ts:11` | Turnstile/hCaptcha em `register`, `login`, `forgot-password` | médio |
| MFA | ❌ | Nada encontrado | TOTP ao menos para administradores | médio |
| Rate limit: store | ❌ | Sem `store` em `authRateLimit.ts:31-38`, logo `MemoryStore` por processo; zera no restart e não é compartilhado entre instâncias. Redis: nada encontrado | Store compartilhado (Redis/Postgres) antes de escalar | alto |
| Rate limit: chave e proxy | 🟡 | Chave por IP ou `ip:email`, rodando antes do `validate()` (`auth.routes.ts:68-73`). `trust proxy` só se `TRUST_PROXY` for inteiro positivo (`app.ts:22-25`); padrão `false` | Atrás de proxy/CDN todos compartilham um balde de IP (um atacante esgota o login de todos). Definir `TRUST_PROXY` no deploy. Falta limiter por e-mail isolado e limiter geral na API | alto |
| Cadastro sobre e-mail não verificado | ❌ | `register` em e-mail existente e não verificado sobrescreve `name` e `password_hash` (`auth.service.ts:166`, `be/models/auth.model.ts:247-262`); `verifyEmail` emite sessão para essa linha | Quem se cadastra por último define a senha da conta não verificada. Não sobrescrever credenciais de linha pré-existente (ou rotacionar o código e exigir que o dono confirme) | médio |
| Código de verificação / reset | ✅ | Código de 6 dígitos com `randomInt`, guardado como HMAC com pepper, TTL 15min, 5 tentativas, comparação em tempo constante (`be/utils/authTokens.ts`, `auth.model.ts:58-81`); token de reset 32 bytes guardado como SHA-256, TTL 30min | Contagens de cooldown lidas fora da transação (`auth.service.ts:91-97, 293-295`); reset consome só o token usado, não os outros pendentes | baixo |
| Enumeração de contas | ✅ | `register`, `resend-code`, `forgot-password` respondem 202 genérico; login devolve o mesmo 401 (`auth.controller.ts:13,39,47`, `auth.service.ts:190,195`) | Diferenças de tempo em `verify-email`/`resend-code` para e-mail inexistente (`auth.service.ts:226-228, 281`) | baixo |
| `Cache-Control: no-store` em `/api/auth` | ✅ | `auth.routes.ts:17-20` | Nada | baixo |

## 4. Autorização

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Toda rota autenticada | ✅ | `meal`, `food`, `saved_meal` com `router.use(authenticate)`; `user` e `push` com `authenticate` por rota; `admin` com `authenticate, requireAdmin` no roteador (`be/routes/*.routes.ts`). Públicas: 6 POST em `/api/auth`, `GET /api/push/public-key`, `GET /health` | Nada | baixo |
| RBAC | ✅ | `role` lido do banco por PK a cada requisição (`auth.ts:85`, `auth.model.ts:226-236`); `requireAdmin` falha fechado com 403 (`auth.ts:32-42`); nenhum papel vem do JWT | Nada | baixo |
| Dono em toda consulta (IDOR/BOLA) | ✅ | Todos os SQL de `meals`, `saved_meals`, `user_favorite_foods`, `user_goals`, `body_measurements`, `push_subscriptions` e `users` filtram pelo `userId` autenticado (ex.: `meal.model:141,166,176,279`; `saved_meal.model:16,307`; `push.model:35`) | `SavedMealModel.findById` (`saved_meal.model:126-139`) e `FoodModel.findById/findByIds` (`food.model:110-131`) têm caminho sem filtro de dono. Hoje nenhum chamador o usa assim; adicionar `userId` obrigatório para não regredir | baixo |
| RLS no Postgres | ❌ | Nenhuma política em `backend/migrations/` | O isolamento depende só do `WHERE` na aplicação; RLS seria segunda camada | médio |
| Menor privilégio do usuário do banco | ❌ | `docker-compose.yml` e CI usam o superusuário `postgres`; nenhuma role restrita é criada (`be/database/pool.ts`, `.github/workflows/ci.yml`) | Criar role de aplicação sem `CREATE`/`DROP`/`SUPERUSER`, e role separada para migrações | alto |
| Rotas administrativas | ✅ | `admin.routes.ts:9` guarda o roteador inteiro; auditoria na mesma transação (`admin-food.service`, `admin_audit_log`); sem `DELETE` de alimento | Nada | baixo |

## 5. Entrada de dados

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Validação Zod em todas as rotas | ✅ | Toda rota que lê body/query/params usa `validate(...)`; as sem `validate` não leem entrada (`GET /foods/recents`, `/favorites`, `/saved-meals`, `POST /push/test`, `GET /users/me`, `/me/export`, `/push/public-key`) | Nada | baixo |
| Mass assignment | ✅ | Todos os schemas são `z.object` simples (removem chaves extras); nenhum `req.body` é espalhado em INSERT/UPDATE; `role`, `token_version`, `email_verified_at` não estão em `updateUserSchema`; nutrientes de `meal_items` são calculados no servidor (`meal.service:38`) | Usar `.strict()` para rejeitar chaves desconhecidas em vez de ignorá-las | baixo |
| SQL dinâmico (`ORDER BY`, `ILIKE`, colunas) | ✅ | Nenhum texto do usuário é interpolado no SQL. `ORDER BY` vem de `SORT_COLUMN_MAP` e enum (`admin-food.model:117-121`, `shared/.../admin-food.schema.ts:30-41`); `ILIKE` parametrizado com `%`, `_`, `\` escapados (`food.model:47-56`); `SET` do `UPDATE` com colunas literais (`user.model:78-157`) | Nada | baixo |
| Limites numéricos no schema | 🟡 | Sem `max` em `weight`, `height`, metas de calorias/macros, `serving_weight`, `unit_weight` (`user.schema:140-141,164-165,181-184`, `food.schema:18,20`); `page` sem teto; `measured_at` sem limite inferior | Definir `min`/`max` coerentes com as colunas `NUMERIC` para não depender do erro do Postgres | médio |
| Tamanho do corpo | ✅ | `express.json({ limit: '50kb' })` (`app.ts:59`) | Nada | baixo |
| SSRF | ➖ | O backend não faz nenhuma requisição de saída: não há dependência `web-push`; `sendTestNotification` só conta inscrições (`push.service:35-45`). Mas o endpoint de push só é validado como `z.string().url()` (`shared/.../push.schema.ts:4`), sem esquema, host ou tamanho | Hoje inerte. Ao implementar o envio real, exigir `https:`, allowlist de hosts de push (FCM/Mozilla/Apple) e bloquear IP privado | baixo |
| Prompt injection | ➖ | Nenhum LLM no produto | — | baixo |

## 6. Infraestrutura

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Mensagens de erro e headers que revelam stack/versão | 🟡 | 500 devolve texto genérico, stack só no log (`be/middlewares/errorHandler.ts:30,40`); helmet ativo (remove `X-Powered-By` por padrão, sem `app.disable` explícito). Mas erros não-500 devolvem `err.message` bruto, e `err.code` é copiado para a resposta (`errorHandler.ts:48-50`): um erro do `pg` com SQLSTATE pode vazar | Mapear erros do `pg`, não copiar `code` desconhecido, `app.disable('x-powered-by')` explícito. Confirmar em runtime | médio |
| Headers de segurança da API | ✅ | helmet v8 com CSP mínimo (`app.ts:29-42`); HSTS e demais defaults do helmet | Confirmar HSTS no ambiente real | baixo |
| CORS | 🟡 | Allowlist vinda de `CORS_ORIGIN` (padrão `http://localhost:5173`), `credentials: true`, aceita requisições sem `Origin` (`app.ts:44-56`). `*` é aceito e refletiria qualquer origem com credenciais; `env.ts` não proíbe `*` nem `localhost` em produção. Origem rejeitada vira erro 500 genérico com stack no log | Rejeitar `*` e `localhost` em produção; responder 403 limpo | médio |
| HTTPS / HSTS | 🟡 | `APP_BASE_URL` precisa ser https em produção (`env.ts:65-71`); SSL do banco ligado só em produção (`pool.ts:23-31`) | Sem deploy no repo: HTTPS e HSTS no front não verificáveis | médio |
| Logs com dados pessoais | ✅ | `requestLogger.ts:27-33` loga `requestId`, método, URL, status e duração, sem corpo, headers, IP, e-mail ou usuário; falha de e-mail loga só `error.message` | A URL inclui a query string; `pool.ts:48` imprime o objeto de erro inteiro; não há redação central. Aceitar `x-request-id` do cliente (`requestLogger.ts:11,16`) permite injetar identificador | baixo |
| Criptografia de dados sensíveis | 🟡 | Senhas em bcrypt; códigos em HMAC; tokens em SHA-256; SSL do banco em produção. Peso, altura, sexo, data de nascimento, medidas e refeições ficam em texto no Postgres | Criptografia em repouso no disco/provedor (confirmar) e avaliar criptografia por coluna para dados de saúde | médio |
| E-mail transacional | 🟡 | `nodemailer` sem `requireTLS` nem timeouts; `MAIL_SMTP_SECURE` padrão `false`; `MemoryMailer` é aceito com `MAIL_TRANSPORT=memory` mesmo em produção (`be/.../mailer.ts:93`) | Proibir `memory` e exigir TLS em produção; senão o código de verificação e o link de reset nunca chegam, ou chegam sem TLS | médio |
| Dependências vulneráveis | ❌ | `npm audit` (rodado): **backend** 15 (3 high, 12 moderate): `nodemailer` ≤10.1.3 (injeção de comando SMTP), `body-parser` <1.20.9 (DoS), `zod` <4.6.6 (esgotamento de memória); **frontend** 17 (3 high, 14 moderate): `vite` 8.2.0-8.2.2, `undici` 7.0.0-7.30.0, `zod`; **raiz** 12 moderate, 0 high | Atualizar os 3 high de cada pacote. O CI roda `npm audit --audit-level=high` **só na raiz** (`ci.yml`), então esses highs não bloqueiam o build | alto |
| Imagens Docker e Actions | 🟡 | `mailpit:latest` sem versão fixa; Actions fixadas por tag, não por SHA; sem bloco `permissions` no workflow | Fixar versões/SHA e `permissions: contents: read` | baixo |
| Tratamento de falhas do processo | 🟡 | `server.ts` não tem `unhandledRejection`/`uncaughtException`; há `gracefulShutdown` | Registrar os handlers e encerrar de forma controlada | baixo |

## 7. Qualidade

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Lint | ✅ | `npm run lint` = higiene de testes + `check:colors` + ESLint (`package.json`); roda no CI | — | baixo |
| Formatação automática | ❌ | Sem Prettier/Biome (`ls` na raiz) | Adicionar formatter e rodar no CI | baixo |
| Typecheck | ✅ | `typecheck` de `shared` e `backend` no CI; `tsc -b` no build do front | Falta typecheck do front como etapa própria | baixo |
| Commits e issues/PR | 🟡 | CI em push/PR para `main`; sem `commitlint`/Husky | Hooks de commit e template de PR | baixo |
| Código morto / mutação / testes de arquitetura | 🟡 | Há `archunit` como dependência (aparece no audit), sem `knip` nem Stryker | Avaliar `knip`; confirmar se os testes de arquitetura estão ligados | baixo |
| Migrations e rollback | 🟡 | `node-pg-migrate` com `down` nas migrações lidas (ex.: `1792800000000_auth-email-verification.js:51-56`); algumas usam `exports.up/down` e foram só listadas | Revisar que todas têm `down` utilizável e testar rollback em CI | médio |

## 8. Testes

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Backend | ✅ | 43 arquivos `*.test.ts` em `backend/tests` (`integration`, `unit`, `load`, `helpers`); `test:strict` no CI com Postgres 16 | Cobertura do backend não é medida | médio |
| Frontend | 🟡 | 38 arquivos de teste (Vitest + RTL + MSW); `test:coverage` roda no CI | `frontend/vite.config.ts:61-65` define o provider mas **nenhum limite mínimo** (`thresholds`); sem relatório/Codecov | médio |
| E2E | ❌ | Sem Playwright/Cypress | Fluxo mínimo: cadastro → verificação → refeição | médio |
| Carga | 🟡 | Existe `backend/tests/load`; `autocannon` como dependência | Não roda no CI | baixo |
| Testes de segurança | 🟡 | Há helpers de autenticação; não verifiquei se existem testes de IDOR/RBAC por rota | Teste "usuário A não acessa dados do usuário B" para cada recurso | médio |

## 9. Deploy / Observabilidade

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Deploy | ❌ | Sem Dockerfile da aplicação, sem compose de produção, sem etapa de deploy no `ci.yml` | Definir pipeline e ambientes (staging/produção) | médio |
| Observabilidade | ❌ | Nenhuma dependência de Sentry, Prometheus, OpenTelemetry, pino ou winston (`grep` nos dois `package.json`); logs estruturados próprios (`structuredLog`) | Rastreamento de erros, métricas e alertas | médio |
| Health check | ✅ | `GET /health` (`app.ts:71`) devolve só status e `database: 'connected'`, ou 503 sem texto de erro | Separar liveness e readiness | baixo |
| Backup do banco | ❌ | Nada no repositório | Política de backup e teste de restauração | médio |

## 10. UX / Motion

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Skeleton / carregamento | ✅ | Regra do projeto (`react-rules.md` §3) e uso de `lazy`/`Suspense` em `frontend/src` (26 ocorrências no grep) | Auditar telas sem estado de loading | baixo |
| Lazy loading de rotas | ✅ | Idem (`fe/router.tsx`) | Medir o bundle com `npm run build` | baixo |
| `prefers-reduced-motion` | 🟡 | A regra do swipe exige respeitá-lo (`react-rules.md` §7); há ocorrências em `frontend/src/styles/index.css` e `navigation/` | Não conferi todas as animações do app | baixo |
| Página 404 | ❌ | `fe/router.tsx:137`: `path: '*'` redireciona para `/` (`Navigate`); não existe página 404 | Criar página 404 própria (e status 404 no host) | baixo |

## 11. SEO

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Meta tags | 🟡 | `frontend/index.html` tem `lang="pt-BR"`, `<title>`, `description`, `theme-color`, manifest | Sem Open Graph/Twitter Card nem `canonical`; a página é uma SPA com um único `<title>` | baixo |
| `robots.txt` | ❌ | `frontend/public/` só tem `favicon.svg`, `manifest.webmanifest`, `sw.js` | Criar; bloquear áreas autenticadas e `/admin` | baixo |
| `sitemap.xml` | ❌ | Idem | Gerar com as rotas públicas (`/login`, `/cadastro`, `/termos`, `/privacidade`, `/seguranca`) | baixo |
| `noindex` em telas privadas | ❌ | Nada encontrado | `noindex` nas rotas autenticadas | baixo |
| Analytics / cookies | ➖ | Nenhum GA, gtag, Hotjar ou cookie de rastreamento (grep) | — (se adicionar analytics, exigir banner de consentimento) | baixo |
| GEO / `llms.txt` | ❌ | Não existe | Opcional, produto é um app autenticado | baixo |

## 12. LGPD

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| Política de privacidade e termos | ✅ | `fe/pages/public/LegalPage.tsx`: Termos (aviso de saúde, l.98), Política (dados, finalidade, retenção, direitos do art. 18), página de Segurança; contato do encarregado `privacidade@caloriesync.app` (l.62) | Confirmar que o e-mail existe e quem é o encarregado; revisão jurídica do texto | médio |
| Consentimento | 🟡 | Checkbox "Li e aceito" no cadastro (`RegisterForm.tsx:226`) validado no schema (`user.schema.ts:22-23`); `terms_accepted_at` gravado com a hora do servidor (`auth.service.ts:171`) | Peso, altura, sexo, data de nascimento, medidas e metas são dados de saúde (dados sensíveis, art. 11). O consentimento é um só, junto com os Termos, e a base legal citada é contrato + consentimento geral (art. 7º). Falta consentimento específico e destacado, e registro da versão do documento aceito | alto |
| Minimização | 🟡 | Coleta só o que o cálculo de metas usa; `sex`, `birth_date`, `weight`, `height`, `activity_level` | Justificar cada campo na política; tornar opcional o que não for essencial | médio |
| Exportação de dados | ✅ | `GET /api/users/me/export` devolve JSON anexo (`user.controller.ts:76-86`) | Conferir se cobre todas as tabelas (medidas, metas, favoritos, refeições salvas, assinaturas de push) | baixo |
| Exclusão de conta | 🟡 | `DELETE /api/users/me` exige senha (`user.service.ts:304-326`); FKs em cascata para `meals`, `meal_items`, `saved_meals`, `user_favorite_foods`, `push_subscriptions`, códigos e tokens (`backend/migrations/*`); `admin_audit_log.actor_user_id` vira `NULL` | Não li a FK de `foods.user_id` (alimentos personalizados) nem o `deleteUser`; backups não têm prazo de expiração definido | médio |
| Retenção e logs | 🟡 | Política diz "enquanto a conta estiver ativa"; `admin_audit_log` guarda ações administrativas | Definir prazo para logs, códigos expirados e backups | baixo |
| Cookies / tracking | ✅ | Nada de rastreio; sem cookies | — | baixo |
| Incidentes | ❌ | Nada encontrado | Plano de resposta a incidente e comunicação à ANPD | médio |

## 13. Acessibilidade

| Conceito | Status | Evidência | O que falta | Risco |
|---|---|---|---|---|
| `alt` em imagens | ➖ | Nenhuma tag `<img>` em `frontend/src` (grep); ícones são SVG/componentes | Se entrarem imagens, exigir `alt` | baixo |
| Rótulos e ARIA | ✅ | ~113 usos de `aria-label`/`role` em `frontend/src` (grep, fora de testes); testes RTL consultam por papel/label | Rodar axe/Lighthouse nas telas principais | baixo |
| Teclado e foco | 🟡 | Modais Radix com focus trap e `Esc` (`ConfirmDialog.tsx`, `AdminFoodModal.tsx`); regra do projeto proíbe `alert/confirm` | Sem "pular para o conteúdo"; o grep não achou `<main>`. Conferir landmarks | médio |
| Contraste | 🟡 | Tokens semânticos e guarda `check:colors` (`docs/CORES.md`) | Não medi razões de contraste; validar tema claro e escuro (WCAG AA) | médio |
| Movimento reduzido | 🟡 | Ver §10 | — | baixo |
| Auditoria automatizada | ❌ | Sem `axe`/`jest-axe`/Lighthouse no CI | Adicionar ao menos para login, diário e metas | médio |

---

## 14. Os 10 itens de maior risco, em ordem

1. **Dependências com vulnerabilidade high fora do gate do CI.** Backend: `nodemailer` (injeção de comando SMTP), `body-parser` (DoS), `zod`; frontend: `vite`, `undici`, `zod`. O CI só audita a raiz, onde há 0 high. *Atualizar e rodar `npm audit --audit-level=high` em `backend/` e `frontend/`.*
2. **JWT em `localStorage`/`sessionStorage` com validade de 7 dias e sem CSP no front.** Um XSS rouba a sessão inteira; a defesa atual é só "não há `innerHTML`". *Cookie `HttpOnly` + CSP no host do front + TTL menor.*
3. **Proteção contra força bruta fraca:** sem bloqueio por conta, sem captcha, sem MFA, rate limit em memória por processo e `TRUST_PROXY` padrão `false` (atrás de proxy todos dividem um balde e um atacante trava o login de todos). *Store compartilhado, `TRUST_PROXY` correto, contador por conta.*
4. **Banco acessado como superusuário `postgres`, sem role de menor privilégio e sem RLS.** Uma injeção ou falha de lógica herda poder total. O isolamento por dono hoje só existe no `WHERE` da aplicação. *Role de aplicação restrita, role de migração separada, avaliar RLS.*
5. **Dados de saúde sem consentimento específico (LGPD art. 11).** Um único aceite de Termos cobre peso, altura, sexo, nascimento, medidas e metas. *Consentimento destacado e versionado, revisão jurídica.*
6. **`register` sobrescreve a senha de uma conta não verificada.** Quem cadastrar por último o mesmo e-mail define a senha da linha; o `verifyEmail` emite sessão para ela. *Não sobrescrever credenciais existentes.*
7. **CORS sem proteção contra `*`/`localhost` em produção, com `credentials: true`.** Um `CORS_ORIGIN` mal configurado reflete qualquer origem com credenciais. *Validar em `env.ts` e testar.*
8. **E-mail transacional pode falhar em silêncio ou sem TLS em produção.** `MAIL_TRANSPORT=memory` é aceito em produção e o SMTP não exige TLS nem tem timeouts; sem e-mail, ninguém verifica a conta nem redefine a senha. *Proibir `memory` e exigir TLS em produção.*
9. **Sem deploy definido, sem observabilidade e sem backup.** Nenhum Dockerfile, rastreio de erros, métricas ou política de backup; o vazamento de `err.code` do `pg` e o `err.message` bruto em erros não-500 ficam sem monitoramento. *Pipeline de deploy, Sentry/métricas, backup com teste de restauração e mapeamento de erros do `pg`.*
10. **`apiFetch` lê o token só do `localStorage`.** Se o "lembrar-me" desmarcado grava no `sessionStorage`, essas sessões podem não enviar o header e cair em logout. É um risco funcional, não de segurança, e **não foi testado em runtime**. *Unificar a leitura do token e cobrir com teste.*

Ficaram fora do top 10, mas merecem fila: limites numéricos ausentes nos schemas, ausência de `robots.txt`/`sitemap`/página 404, cobertura de testes sem piso mínimo, falta de E2E e de auditoria de acessibilidade automatizada.
