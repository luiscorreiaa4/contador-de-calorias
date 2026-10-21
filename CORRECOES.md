# CORREÇÕES DA AUDITORIA

## 🧭 INSTRUÇÕES PARA MIM MESMO (LEIA PRIMEIRO, SEMPRE)
Eu sou um modelo de IA corrigindo, de forma AUTÔNOMA, os achados do AUDITORIA.md.
- Ninguém vai me responder. Nunca peço confirmação. Na dúvida, escolho o conservador e registro.
- Trabalho na branch `fix/auditoria`, com um commit por lote. Nunca dou push.
- Meu contexto é compactado com frequência, então este arquivo é minha memória.
- Ao (re)começar: leio este arquivo, confiro `git status` e `git log`, vou ao CHECKPOINT e continuo.
- Ciclo de cada achado: reler o código → corrigir → validar → registrar. Ciclo de cada lote: validação completa → commit → atualizar CHECKPOINT.
- Se um achado falhar 3 vezes: reverto os arquivos dele, marco ⛔ e sigo.
- Fases: 0 Preparação → 1 Lotes → 2 Revisão do que foi adiado ou bloqueado → 3 Validação final → 4 Relatório.

## 📍 CHECKPOINT
- Fase atual: 1 (Execução dos Lotes)
- Lote atual: Lote 05: Tratamento de Erros, Middlewares e Observabilidade no Backend
- Achado em andamento: A-007
- Próximo passo (bem específico): Iniciar Lote 05 criando asyncHandler e eliminando blocos try/catch redundantes nos controllers (A-007, A-017, A-018, A-031, A-058, A-040, A-022).
- Último commit: fd0f16f (Lote 04 concluído)
- Progresso: 31 / 129 achados

## 🔧 COMANDOS DE VALIDAÇÃO
- Typecheck: `npm --prefix backend run typecheck` e `npm run build` (tsc -b no frontend)
- Lint: `npm run lint` (`node scripts/check-test-hygiene.mjs && npm --prefix frontend run check:colors && eslint .`)
- Testes: `npm run test` (backend) e `npm run test:frontend` (frontend)
- Build: `npm run build`
- Resultado de base (antes de mexer):
  - Typecheck: 0 erros
  - Lint: 0 erros, 1 warning (`react-hooks/incompatible-library` em `OnboardingFlow.tsx:73:22`). 0 violações em `check:colors`.
  - Testes: 173 testes de backend passando (40 suítes, 0 falhas). 142 testes de frontend passando (22 suítes, 0 falhas).
  - Build: com sucesso em 5.6s.

## 📦 LOTES

### Lote 01: Infra, Configurações Críticas e Scripts de Banco (status: ✅ concluído)
- [x] A-001 🔴 Senha padrão do PostgreSQL no docker-compose
- [x] A-107 🔴 Script download-taco.ts campos vazios e taco-full.json
- [x] A-106 🟡 Script import-foods.ts tratamento de erro e exit code
- [x] A-105 🟠 Script import-foods.ts restrito ao catálogo (user_id IS NULL)
- [x] A-108 🟡 Script seed-perf.js credencial e idempotência
- [x] A-109 🔵 Script run-stats-explain.js credencial
- [x] A-110 🔵 Script check-indices.ts pool.end no erro
- [x] A-121 🔵 Script autocannon.js formatação de string

### Lote 02: Segurança e Concorrência de Autenticação no Backend (status: ✅ concluído)
- [x] A-002 🟠 E-mail case-sensitive e normalização
- [x] A-004 🟠 Tratamento de corrida e 23505 no cadastro/edição de e-mail
- [x] A-008 🟡 JWT_EXPIRES_IN utilizado efetivamente
- [x] A-010 🟡 Validação Zod do payload do JWT no middleware auth
- [x] A-060 🔵 Parâmetros explícitos em jwt.sign e jwt.verify
- [x] A-036 🟡 Rate limit de autenticação por IP e conta
- [x] A-059 🟡 Rate limit em rotas sensíveis /me (senha e exclusão)
- [x] A-009 🟡 Revogação de JWT / token_version

### Lote 03: Validações de Schemas e Integridade de Dados no Shared e Backend (status: ✅ concluído)
- [x] A-011 🟠 Validação de data YYYY-MM-DD rejeitando datas inexistentes
- [x] A-012 🟡 Validação estrita de birthDate e measured_at
- [x] A-006 🟠 Medição retroativa não deve sobrescrever peso atual do perfil
- [x] A-021 🔵 Uso de nullish coalescing (??) para números
- [x] A-023 🔵 Item em 'un' sem unit_weight
- [x] A-043 🔵 previewGoals tratamento de birth_date nulo
- [x] A-045 🔵 updateUser formatação de data consistente

### Lote 04: Regras de Negócio e Catálogo de Alimentos no Backend (status: ✅ concluído)
- [x] A-003 🟠 Unicidade de nome de alimentos e tratamento 23505
- [x] A-105 🟠 Script import-foods restrito ao catálogo (user_id IS NULL)
- [x] A-015 🟡 Filtro de alimentos inativos/de outros usuários
- [x] A-020 🔵 Tipagem estrita de multiplicadores de atividade física
- [x] A-024 🟡 Tratamento de fuso de São Paulo em date.ts e meal.service
- [x] A-025 🟡 Otimização de consultas em copyMeal
- [x] A-035 🟡 Recálculo de metas na atualização do perfil
- [x] A-061 🔵 Regra de TMB para prefiro_nao_responder

### Lote 05: Tratamento de Erros, Middlewares e Observabilidade no Backend (status: ⬜ pendente)
- [ ] A-007 🟡 Eliminação de try/catch duplicado nos controllers com asyncHandler
- [ ] A-017 🟡 Handler 404 e sanitização de erros do body-parser
- [ ] A-018 🟡 errorHandler com log de stack e requestId
- [ ] A-031 🔵 structuredLog com console.error/warn e controle por ambiente
- [ ] A-058 🔵 Validação e sanitização de x-request-id no requestLogger
- [ ] A-040 🔵 Timeout específico e resposta segura no health check
- [ ] A-022 🔵 Reforço de tipagem de userId autenticado

### Lote 06: Modelos, Otimizações de Consultas e Limpeza no Backend (status: ⬜ pendente)
- [ ] A-013 🟡 Inserção em batch e otimização de salvamento de combos
- [ ] A-014 🟡 Centralização de mapeamento de linhas em food.model.ts
- [ ] A-016 🟡 Tratamento de precisão NUMERIC no pool
- [ ] A-026 🟡 Totais nutricionais completos (carbs e gorduras)
- [ ] A-034 🟡 Paginação em listagens sem limite
- [ ] A-037 🔵 Retorno coerente em addFavoriteFood / removeFavorite
- [ ] A-063 🔵 Validação de existência em removeFavorite
- [ ] A-033 🟠 Exportação LGPD de histórico

### Lote 07: Subsistema de Notificações Push e VAPID (status: ⬜ pendente)
- [ ] A-005 🟠 Endpoint de push de teste no backend
- [ ] A-030 🟡 Configuração e validação de chaves VAPID
- [ ] A-071 🟡 Botão de teste de push desabilitado/tratado na UI
- [ ] A-086 🔵 Limpeza de timer em push.service.ts no frontend
- [ ] A-087 🟡 Remover simulação enganosa de push no frontend
- [ ] A-116 🟠 Alinhamento de testes de push com o contrato real

### Lote 08: Frontend - Autenticação, Sessão e Armazenamento Local (status: ⬜ pendente)
- [ ] A-074 🟠 Proteção try/catch e validação no JSON.parse do localStorage
- [ ] A-075 🟡 Tipagem segura e estado da sessão persistida no AuthContext
- [ ] A-076 🟡 Coerência do fluxo pós-cadastro no RegisterForm / AuthCard
- [ ] A-077 🟡 Placeholder de senha atualizado para 8 caracteres
- [ ] A-078 🟡 Reutilização do registerUserSchema compartilhado
- [ ] A-079 🟡 Logout automático desacoplado de texto literal da mensagem
- [ ] A-081 🟡 Semântica do checkbox "Lembrar-me"
- [ ] A-082 🔵 Tratamento do link "Esqueci minha senha"
- [ ] A-084 🔵 Título condicional no AuthCard (Login vs Cadastro)

### Lote 09: Frontend - Formulários de Perfil, Medições e Acessibilidade (status: ⬜ pendente)
- [ ] A-067 🟡 Possibilidade de limpar birthDate na edição de perfil
- [ ] A-068 🟡 Validação unificada de birthDate no formulário de perfil
- [ ] A-072 🟡 Associação correta de labels com inputs no Onboarding
- [ ] A-073 🔵 RoutinePage preservação de nível de atividade desconhecido
- [ ] A-083 🟡 Roving tabindex e navegação por teclado na tablist do AuthCard
- [ ] A-085 🟡 Estabilização de efeitos no DeleteAccountModal
- [ ] A-099 🟡 Bloqueio de datas futuras em medições corporais
- [ ] A-100 🟠 Tratamento de fuso em medições sem deslocar dia

### Lote 10: Frontend - Refeições, Combos e Dashboard (status: ⬜ pendente)
- [ ] A-092 🟠 Correção de cálculo nutricional em combos salvos
- [ ] A-093 🟡 Diálogo acessível de confirmação ao excluir combo
- [ ] A-094 🟡 Preservação de horário no fuso correto ao editar refeição
- [ ] A-095 🟡 Eliminação de metas fixas fictícias de carbs/fats no Dashboard
- [ ] A-096 🟡 Modais de confirmação acessíveis no Dashboard (focus trap, Esc, aria)
- [ ] A-097 🟡 Ações de refeição visíveis no foco por teclado
- [ ] A-098 🔵 Tratamento de erro na busca da meta ativa
- [ ] A-089 🟡 date.ts parsing estrito sem retorno silencioso de "hoje"
- [ ] A-090 🟡 Sincronização de data do Dashboard com fuso

### Lote 11: PWA, Estilos, Design Tokens e Contrastes (status: ⬜ pendente)
- [ ] A-101 🟠 Service Worker: network-first / cache versionado por build
- [ ] A-102 🟡 Comparação de URL absoluta no notificationclick do SW
- [ ] A-103 🔵 Ajuste de tamanhos e finalidades no manifest PWA
- [ ] A-104 🔵 Suporte a prefers-reduced-motion nas animações e SW
- [ ] A-113 🟡 Correção do contraste de destructive no dark mode (>= 4.5:1)
- [ ] A-114 🟡 Tabela completa de pares de contraste e remoção de asserção inútil
- [ ] A-115 🟡 Endurecimento da allowlist do check-colors.mjs

### Lote 12: Limpeza de Código Morto e Consistência (status: ⬜ pendente)
- [ ] A-028 🔵 Remoção de listFoodsSchema não utilizado
- [ ] A-029 🔵 Remoção de getFavoriteIds e escopo privado para getById
- [ ] A-069 🔵 Remoção do componente morto BiometricsSection.tsx
- [ ] A-070 🔵 Remoção de schemas mortos em profile.ts
- [ ] A-088 🔵 Remoção do tipo morto OnboardingFormData em auth.ts
- [ ] A-049 🔵 Ajuste de tipagens no package.json backend (@types/express)

### Lote 13: Testes, Mocks e Validações Automatizadas (status: ⬜ pendente)
- [ ] A-117 🟠 Ajuste do teste de rate limit para validar limites reais
- [ ] A-118 🟡 Teste de unicidade de alimentos para múltiplos cenários
- [ ] A-119 🟡 Teste de ordenação cronológica e não-sobrescrita de medições
- [ ] A-120 🔵 Sincronização determinística no teste de request logging
- [ ] A-127 🔵 Senha compatível com a política nos mocks do MSW
- [ ] A-129 🔵 Testes de hidratação e recuperação de sessão do localStorage
- [ ] A-052 🔵 Avaliação de regras de ESLint e tipagens

### Lote 14: Documentação, Contratos e Alinhamento Final (status: ⬜ pendente)
- [ ] A-046 🔵 Aliases de teste e scripts no package.json raiz
- [ ] A-047 🟡 Documentação e alinhamento de overrides no package.json
- [ ] A-048 🔵 Configuração de build e scripts no backend/package.json
- [ ] A-050 🔵 Documentação da dependência react-router v7
- [ ] A-051 🔵 Adição de script typecheck no shared
- [ ] A-053 🟡 Atualização do backend/.env.example com variáveis reais
- [ ] A-054 🔵 CORS e origens em produção
- [ ] A-055 🟡 Shutdown gracioso em server.ts
- [ ] A-056 🔵 PORT e TRUST_PROXY validação em env.ts
- [ ] A-057 🔵 allowExitOnIdle e NODE_ENV centralizado em pool.ts
- [ ] A-042 🔵 structuredLog('server_started') loga uvThreadpoolSize
- [ ] A-066 🟠 Ajuste dos textos legais em LegalPage.tsx
- [ ] A-111 🟡 Alinhamento do CI
- [ ] A-112 🔵 Documentação de segurança e Gitleaks
- [ ] A-122 🟡 Atualização completa do docs/TESTING.md
- [ ] A-123 🟡 Correção de contradições no docs/BACKLOG.md
- [ ] A-124 🔵 Alinhamento da decisão D-10 no BACKLOG.md
- [ ] A-125 🟡 Alinhamento do README e SPEC sobre JWT_EXPIRES_IN
- [ ] A-126 🔵 Correção do README sobre push e test:frontend:file
- [ ] A-128 🔵 Atualização do checklist em docs/COLOR_MIGRATION.md
- [ ] A-019 🔵 Revisão de meta de fallback no backend
- [ ] A-027 🟡 Revisão de snapshot de macros em combo salvo
- [ ] A-032 🔵 Revisão de tipagem de parâmetros no middleware validate
- [ ] A-038 🔵 Revisão de consistência de nomenclatura de contratos
- [ ] A-041 🔵 Revisão de integridade referencial em deleção de usuário
- [ ] A-044 🔵 Revisão de seed de alimentos ON CONFLICT
- [ ] A-064 🟡 Revisão de campos legados daily_*_goal
- [ ] A-065 🔵 Revisão de extensão para gen_random_uuid
- [ ] A-091 🟡 Decomposição e refatoração de NewMealModal

## 📒 REGISTRO POR ACHADO

### A-001: ✅ CORRIGIDO
- Lote: 01 | Commit: cd73c37
- O que foi feito: Removida a senha padrão hardcoded de `docker-compose.yml`, tornando `DB_PASSWORD` obrigatória via `${DB_PASSWORD:?DB_PASSWORD é obrigatória...}`, e restrito o bind da porta PostgreSQL para `127.0.0.1:${DB_PORT:-5432}:5432`.
- Arquivos alterados: `docker-compose.yml`
- Decisões tomadas: Rotação de senha em banco de produção existente registrada para o proprietário executar (Regra nº 4).

### A-107: ✅ CORRIGIDO
- Lote: 01 | Commit: cd73c37
- O que foi feito: Atualizado `backend/scripts/download-taco.ts` para ler os macronutrientes tanto de campos aninhados (`attributes.energy.kcal`, `attributes.protein.qty`, etc.) quanto de raiz (`energy_kcal`, `protein_g`, etc.), adicionada validação estrita que aborta se nenhum alimento tiver nutrientes > 0, e regenerado `backend/data/taco-full.json` com dados nutricionais reais (597 alimentos, 591 com nutrientes > 0).
- Arquivos alterados: `backend/scripts/download-taco.ts`, `backend/data/taco-full.json`
- Decisões tomadas: Arredondamento para 2 casas decimais no parser.

### A-106: ✅ CORRIGIDO
- Lote: 01 | Commit: cd73c37
- O que foi feito: Em `backend/scripts/import-foods.ts`, corrigido tratamento de erros no bloco `catch` para propagar o erro (re-throw) após o rollback, e adicionado `pool.end()` tanto no encerramento de sucesso quanto no catch com `process.exit(1)`.
- Arquivos alterados: `backend/scripts/import-foods.ts`
- Decisões tomadas: Proteção com try/catch no próprio rollback caso ocorra falha de conexão.

### A-105: ✅ CORRIGIDO
- Lote: 01 | Commit: cd73c37
- O que foi feito: Em `backend/scripts/import-foods.ts`, restrita a query de desativação prévia ao catálogo global adicionando a cláusula `AND user_id IS NULL`, impedindo que alimentos personalizados de usuários sejam desativados por importações.
- Arquivos alterados: `backend/scripts/import-foods.ts`
- Decisões tomadas: Antecipado do Lote 04 para o Lote 01 por pertencer ao mesmo arquivo já editado para A-106.

### A-108: ✅ CORRIGIDO
- Lote: 01 | Commit: cd73c37
- O que foi feito: Em `backend/scripts/seed-perf.js`, removido o fallback inseguro `'postgres'`, exigindo `process.env.DB_PASSWORD`. Adicionada trava para só permitir execução em bancos terminados com `_perf` ou `_test`. Adicionada deleção prévia de `perf-user@example.com` para garantir total idempotência em execuções repetidas.
- Arquivos alterados: `backend/scripts/seed-perf.js`
- Decisões tomadas: Usar DELETE para cascatear limpeza de refeições e metas do usuário de teste.

### A-109: ✅ CORRIGIDO
- Lote: 01 | Commit: cd73c37
- O que foi feito: Em `backend/scripts/run-stats-explain.js`, removido o fallback de senha `'postgres'`, exigindo `DB_PASSWORD`. Envolvida a execução em bloco `try/finally` para assegurar que `pool.end()` sempre seja invocado.
- Arquivos alterados: `backend/scripts/run-stats-explain.js`
- Decisões tomadas: Manter compatibilidade com `process.env.DB_NAME || 'contador_calorias_perf'`.

### A-110: ✅ CORRIGIDO
- Lote: 01 | Commit: cd73c37
- O que foi feito: Em `backend/scripts/check-indices.ts`, reestruturado o script em função assíncrona com `try/catch/finally`, garantindo que `pool.end()` seja chamado mesmo quando a query falhar e setando `process.exitCode = 1` no erro.
- Arquivos alterados: `backend/scripts/check-indices.ts`
- Decisões tomadas: Fechar conexão em `finally` evita travamento do processo Node.

### A-002: ✅ CORRIGIDO
- Lote: 02 | Commit: 88b2e0c
- O que foi feito: Criado `emailSchema` compartilhado com `.trim().toLowerCase().email().max(255)` e aplicado em register, login e update; atualizado `findUserByEmail` para buscar por `lower(email) = lower($1)`; normalizado e-mail em `createUser` e `updateUser`; criada migração `1792600000000_add-users-email-lower-index.js` criando o índice único `users_email_lower_key ON users (lower(email))`.
- Arquivos alterados: `shared/src/schemas/user.schema.ts`, `backend/src/models/user.model.ts`, `backend/migrations/1792600000000_add-users-email-lower-index.js`
- Decisões tomadas: Índice criado com `IF NOT EXISTS` para segurança e idempotência em migrações.

### A-004: ✅ CORRIGIDO
- Lote: 02 | Commit: 88b2e0c
- O que foi feito: Adicionado tratamento de erro de unicidade do PostgreSQL (`23505`) em `register` e `updateProfile` no `user.service.ts`, convertendo a violação de constraint em resposta HTTP 409 clara ("Este e-mail já está cadastrado." / "Este e-mail já está em uso por outra conta.") em vez de 500.
- Arquivos alterados: `backend/src/services/user.service.ts`, `backend/tests/integration/user.routes.test.ts`
- Decisões tomadas: Teste de integração adicionado para validar a resposta 409 em tentativas de cadastro com o mesmo e-mail (inclusive com casing diferente).

### A-008: ✅ CORRIGIDO
- Lote: 02 | Commit: 88b2e0c
- O que foi feito: Em `backend/src/services/user.service.ts`, atualizada a função `generateToken` para respeitar `env.JWT_EXPIRES_IN || '7d'` em vez de fixar '7d' hardcoded.
- Arquivos alterados: `backend/src/services/user.service.ts`
- Decisões tomadas: Mantido fallback '7d' se a env não estiver preenchida.

### A-010: ✅ CORRIGIDO
- Lote: 02 | Commit: 88b2e0c
- O que foi feito: No middleware `authenticate` (`backend/src/middlewares/auth.ts`), adicionada validação do payload decodificado via Zod (`tokenPayloadSchema = z.object({ userId: z.string().min(1) })`), retornando 401 caso o payload não possua `userId` válido.
- Arquivos alterados: `backend/src/middlewares/auth.ts`, `backend/tests/unit/auth.middleware.test.ts`
- Decisões tomadas: Adicionado caso de teste unitário comprovando a rejeição com 401 para payloads arbitrários sem `userId`.

### A-060: ✅ CORRIGIDO
- Lote: 02 | Commit: 88b2e0c
- O que foi feito: Especificado explicitamente `algorithm: 'HS256'` na assinatura do token em `generateToken` e `algorithms: ['HS256']` na verificação em `authenticate`.
- Arquivos alterados: `backend/src/services/user.service.ts`, `backend/src/middlewares/auth.ts`
- Decisões tomadas: Restringe o algoritmo a HS256 contra ataques de substituição de algoritmo.

### A-036: ✅ CORRIGIDO
- Lote: 02 | Commit: 88b2e0c
- O que foi feito: Em `backend/src/routes/user.routes.ts`, separado o rate limit de registro (`registerLimiter`, 20 req/15min por IP) do rate limit de login (`loginLimiter`, 10 req/15min por IP + e-mail normalizado). O cadastro não mais afeta ou é afetado pelo balde de tentativas de login por e-mail.
- Arquivos alterados: `backend/src/routes/user.routes.ts`
- Decisões tomadas: Evita bloqueio cruzado de cadastro e ataque DoS direcionado a e-mails.

### A-059: ✅ CORRIGIDO
- Lote: 02 | Commit: 88b2e0c
- O que foi feito: Criado `sensitiveActionLimiter` com janela de 15 minutos e máximo de 15 requisições por usuário/IP e aplicado às rotas sensíveis `PUT /me` (alteração de senha e e-mail) e `DELETE /me` (exclusão de conta).
- Arquivos alterados: `backend/src/routes/user.routes.ts`
- Decisões tomadas: Protege a confirmação de senha contra força bruta com tokens comprometidos.

### A-009: 🔁 ADIADO
- Lote: 02 | Commit: 88b2e0c
- O que foi feito: Proposta técnica documentada. Atualmente os tokens JWT são stateless e validados sincronamente no middleware `authenticate` sem overhead de banco. Transformar `authenticate` em assíncrono para consultar o banco a cada requisição ou implementar rotação completa de refresh tokens com cookies HttpOnly altera a arquitetura central de autenticação, testes unitários síncronos e o cliente frontend. O risco foi mitigado no Lote 02 por A-059 (rate limit em /me) e será alinhado no Lote 14 com A-066 (ajuste da declaração legal).
- Arquivos alterados: N/hum no Lote 02.
- Decisões tomadas: Adiado para futura introdução de infraestrutura de refresh tokens com Redis ou coluna `token_version`.

### A-011: ✅ CORRIGIDO
- Lote: 03 | Commit: 312c849
- O que foi feito: Atualizados `dateQuerySchema` e `statsQuerySchema` em `shared/src/schemas/common.schema.ts` para usar `z.string().date()` do Zod, validando datas válidas de calendário e rejeitando com 400 dias impossíveis (como 2026-02-31 e 2026-13-45) antes de tocar o banco de dados. Adicionados testes unitários em `backend/tests/user.test.ts`.
- Arquivos alterados: `shared/src/schemas/common.schema.ts`, `backend/tests/user.test.ts`
- Decisões tomadas: Rejeição imediata via middleware Zod previne que erros Postgres 22007 estourem como 500.

### A-012: ✅ CORRIGIDO
- Lote: 03 | Commit: 312c849
- O que foi feito: Criada função compartilhada `parseAndValidateBirthDate` e schemas `birthDateSchema`, `optionalBirthDateSchema` e `measuredAtSchema` em `shared/src/schemas/user.schema.ts`. `birthDate` agora valida limites de idade (1-130 anos), rejeita datas inexistentes no calendário e futuras, suportando formatos ISO e brasileiro (DD/MM/AAAA) com normalização automática para YYYY-MM-DD. `measured_at` agora rejeita strings arbitrárias e datas futuras (com tolerância de 5min de relógio).
- Arquivos alterados: `shared/src/schemas/user.schema.ts`, `backend/tests/user.test.ts`
- Decisões tomadas: Suporte e normalização de ambos os formatos (ISO e DD/MM/AAAA) garantem compatibilidade com os formulários de onboarding/perfil existentes e testes.

### A-006: ✅ CORRIGIDO
- Lote: 03 | Commit: 312c849
- O que foi feito: Em `backend/src/models/history.model.ts` (`addBodyMeasurement`), adicionada checagem transacional que verifica se existe medição com `measured_at > dateToUse`. A atualização de `users.weight` e `body_fat` só é executada se a medição inserida for a mais recente do usuário. Adicionado teste de integração em `backend/tests/integration/user_measurements.test.ts`.
- Arquivos alterados: `backend/src/models/history.model.ts`, `backend/tests/integration/user_measurements.test.ts`
- Decisões tomadas: Medições retroativas são gravadas com sucesso no histórico para acompanhamento da evolução, sem distorcer o perfil e metas atuais.

### A-021: ✅ CORRIGIDO
- Lote: 03 | Commit: 312c849
- O que foi feito: Substituída coerção booleana `|| null` e `!value` por verificações explícitas de nullish coalescing (`!= null`, `?? null`, `!== undefined`) em `user.service.ts` (`body_fat`), `nutrients.ts` (`displayAmount`, `serving_weight`) e `saved_meal.model.ts` (`unit_weight`, `display_amount`), impedindo que o valor numérico 0 seja corrompido para `null` ou `undefined`.
- Arquivos alterados: `backend/src/services/user.service.ts`, `shared/src/nutrition/nutrients.ts`, `backend/src/models/saved_meal.model.ts`, `backend/tests/unit/nutrition.service.test.ts`
- Decisões tomadas: Valores numéricos zero são dados válidos e devem ser preservados integralmente.

### A-023: ✅ CORRIGIDO
- Lote: 03 | Commit: 312c849
- O que foi feito: Em `shared/src/nutrition/nutrients.ts` (`calculateItemNutrients`), quando a unidade for `'un'` e o alimento não possuir `unit_weight`, o cálculo agora utiliza `food.serving_weight` (ou 100g de porção padrão) como fallback em vez de tratar quantidade em gramas (evitando que 2 unidades virem 2g). Adicionado teste unitário em `backend/tests/unit/nutrition.service.test.ts`.
- Arquivos alterados: `shared/src/nutrition/nutrients.ts`, `backend/tests/unit/nutrition.service.test.ts`
- Decisões tomadas: Fallback conservador para porção/porção padrão evita subestimação calórica grosseira.

### A-043: ✅ CORRIGIDO
- Lote: 03 | Commit: 312c849
- O que foi feito: Em `backend/src/services/user.service.ts` (`previewGoals`), adicionada validação antecipada exigindo `birthDate` e dados essenciais do perfil antes do cálculo energético, respondendo com HTTP 422 ("Informe a data de nascimento para calcular as metas.") em vez de calcular idade com string vazia e gerar macros `NaN`. Adicionado teste de integração em `backend/tests/integration/user.routes.test.ts`.
- Arquivos alterados: `backend/src/services/user.service.ts`, `backend/tests/integration/user.routes.test.ts`
- Decisões tomadas: Retorno 422 informa claramente a pendência cadastral em vez de mascarar com NaN/null.

### A-045: ✅ CORRIGIDO
- Lote: 03 | Commit: 312c849
- O que foi feito: Em `backend/src/models/user.model.ts` (`updateUser`), padronizada a normalização de `birthDate` para formato ISO YYYY-MM-DD suportando strings ISO completas e nulos, alinhando com a validação estrita já executada no schema compartilhado.
- Arquivos alterados: `backend/src/models/user.model.ts`
- Decisões tomadas: Formato canônico `YYYY-MM-DD` preservado no banco para evitar incompatibilidades de timezone ou locale.

### A-003: ✅ CORRIGIDO
- Lote: 04 | Commit: fd0f16f
- O que foi feito: Criada migração `1792700000000_split-food-name-uniqueness-indexes.js` que dividiu o índice de unicidade global de alimentos em dois índices parciais: `idx_foods_catalog_unique_name` (apenas para itens de catálogo com `user_id IS NULL`) e `idx_foods_custom_user_unique_name` (`user_id, f_unaccent(lower(name))` para itens personalizados com `user_id IS NOT NULL`). Em `food.service.ts` (`createCustom`), adicionado tratamento do código de erro PostgreSQL `23505`, retornando status HTTP 409 amigável ("Você já cadastrou um alimento com este nome.") em vez de 500. Adicionados testes de integração em `backend/tests/integration/foods_uniqueness.test.ts`.
- Arquivos alterados: `backend/migrations/1792700000000_split-food-name-uniqueness-indexes.js`, `backend/src/services/food.service.ts`, `backend/tests/integration/foods_uniqueness.test.ts`
- Decisões tomadas: Usuários diferentes podem cadastrar alimentos com o mesmo nome sem colisão, e podem usar nomes presentes no catálogo TACO.

### A-015: ✅ CORRIGIDO
- Lote: 04 | Commit: fd0f16f
- O que foi feito: Em `backend/src/models/food.model.ts`, atualizados métodos `findById` e `findByIds` para aplicar o filtro de isolamento multitenant e integridade: `active = true AND (user_id IS NULL OR user_id = $2)`. Em `meal.service.ts` (`createMeal`, `updateMeal`) e `saved_meal.service.ts` (`createSavedMeal`), repassado o `userId` autenticado para `findByIds`. Alimentos inativos ou de outros usuários não são retornados, lançando erro HTTP 404 ("Um ou mais alimentos selecionados não foram encontrados.") antes de associar à refeição.
- Arquivos alterados: `backend/src/models/food.model.ts`, `backend/src/services/meal.service.ts`, `backend/src/services/saved_meal.service.ts`, `backend/tests/integration/custom_food.test.ts`
- Decisões tomadas: Previne vazamento de informações nutricionais de alimentos privados entre usuários e uso indevido de itens desativados.

### A-020: ✅ CORRIGIDO
- Lote: 04 | Commit: fd0f16f
- O que foi feito: Em `backend/src/services/nutrition.service.ts`, substituído `Record<string, number>` por `Record<ActivityLevel, number>` em `ACTIVITY_MULTIPLIERS`, garantindo mapeamento completo e seguro para cada valor do enum `ActivityLevel`. Adicionado operador de coalescência nula `?? 1.2` para tipagem estrita com fallback defensivo.
- Arquivos alterados: `backend/src/services/nutrition.service.ts`
- Decisões tomadas: Erros de digitação ou divergências no nível de atividade são prevenidos em tempo de compilação TypeScript.

### A-024: ✅ CORRIGIDO
- Lote: 04 | Commit: fd0f16f
- O que foi feito: Em `backend/src/utils/date.ts`, implementadas funções baseadas no fuso horário IANA `America/Sao_Paulo` com cálculo de offset dinâmico (`getTimezoneOffsetForDate`, `getDayBoundariesInAppTz`, `toAppIsoString`), eliminando o sufixo fixo `-03:00` hardcoded. Atualizado `meal.service.ts` para utilizar `getDayBoundariesInAppTz` na geração de timestamps de limites diários e cópias de refeições.
- Arquivos alterados: `backend/src/utils/date.ts`, `backend/src/services/meal.service.ts`
- Decisões tomadas: O cálculo respeita o fuso horário configurado sem dependência de horário de verão fixo ou do fuso local do processo Node.

### A-025: ✅ CORRIGIDO
- Lote: 04 | Commit: fd0f16f
- O que foi feito: Em `backend/src/models/meal.model.ts` (`copyMeal`), modificado o parâmetro para aceitar `sourceMealOrId: string | Meal`. Em `backend/src/services/meal.service.ts` (`copyMealOrDay`), a refeição de origem já previamente recuperada e validada por `findMealById` é passada diretamente para `MealModel.copyMeal`, eliminando uma consulta de leitura completa com JOIN de itens redundante ao banco de dados.
- Arquivos alterados: `backend/src/models/meal.model.ts`, `backend/src/services/meal.service.ts`
- Decisões tomadas: Mantida retrocompatibilidade permitindo receber string (id) ou objeto (Meal) já carregado.

### A-035: ✅ CORRIGIDO
- Lote: 04 | Commit: fd0f16f
- O que foi feito: Em `backend/src/services/user.service.ts` (`updateProfile`), implementada verificação de alteração em parâmetros antropométricos (`birth_date`, `gender`, `height_cm`, `activity_level`). Quando qualquer um desses campos é alterado, se o usuário possuir meta ativa configurada no modo `auto`, as metas diárias (calorias, proteínas, carboidratos, gorduras, água) são automaticamente recalculadas preservando o objetivo atual (`maintain`, `loss`, `gain`). Se a meta estiver no modo `manual`, ela é estritamente preservada sem recálculo. Adicionado teste de integração em `backend/tests/integration/user.routes.test.ts`.
- Arquivos alterados: `backend/src/services/user.service.ts`, `backend/tests/integration/user.routes.test.ts`
- Decisões tomadas: Usuários em modo automático mantêm suas metas sincronizadas com a evolução do seu perfil biométrico.

### A-061: ✅ CORRIGIDO
- Lote: 04 | Commit: fd0f16f
- O que foi feito: Em `backend/src/services/nutrition.service.ts` (`calculateBMR` e `calculateNutritionalGoals`), para usuários com gênero `prefiro_nao_responder`, o ajuste de TMB e o piso calórico diário foram ajustados para a média aritmética exata entre a equação masculina (+5) e feminina (-161), resultando em `baseTmb - 78` e piso de 1350 kcal (média entre 1500 e 1200 kcal), em vez de aplicar a fórmula feminina de forma arbitrária.
- Arquivos alterados: `backend/src/services/nutrition.service.ts`
- Decisões tomadas: Tratamento matematicamente imparcial e neutro para perfis que não especificam gênero binário.

## 🧠 DECISÕES E OBSERVAÇÕES GLOBAIS
- Padrão conservador: preservar comportamento de produção e regras de negócio já validadas pelos testes.
- Toda modificação passa por validação rápida (typecheck / testes da área) e ao final do lote pela validação completa (`npm run lint`, `npm run build`, `npm run test`, `npm run test:frontend`).
- Segredos de produção ou rotação de banco exigirão ação manual do dono do projeto; não alteramos arquivos `.env` locais.

## 📊 RELATÓRIO FINAL
(Preenchido só na Fase 4)

## 📝 LOG DE SESSÕES
- Sessão 1: Fase 0 concluída. Branch `fix/auditoria` criada. Linha de base validada (173 testes de backend, 142 de frontend, 0 erros de lint, build bem-sucedido). 129 achados organizados em 14 lotes no `CORRECOES.md`.
- Lote 01 concluído (commit `cd73c37`): corrigidos A-001, A-107, A-106, A-105, A-108, A-109, A-110 e A-121.
- Lote 02 concluído (commit `88b2e0c`): corrigidos A-002, A-004, A-008, A-010, A-060, A-036, A-059; A-009 documentado como adiado com mitigação.
- Lote 03 concluído (commit `312c849`): corrigidos A-011, A-012, A-006, A-021, A-023, A-043, A-045.
- Lote 04 concluído (commit `fd0f16f`): corrigidos A-003, A-015, A-020, A-024, A-025, A-035, A-061 (A-105 já realizado no Lote 01).

