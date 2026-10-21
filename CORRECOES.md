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
- Lote atual: Lote 02: Segurança e Concorrência de Autenticação no Backend
- Achado em andamento: A-002
- Próximo passo (bem específico): Iniciar Lote 02 analisando e tratando e-mail case-sensitive/normalização (A-002).
- Último commit: pendente de commit do Lote 01
- Progresso: 8 / 129 achados

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

### Lote 02: Segurança e Concorrência de Autenticação no Backend (status: 🔄 em andamento)
- [ ] A-002 🟠 E-mail case-sensitive e normalização
- [ ] A-004 🟠 Tratamento de corrida e 23505 no cadastro/edição de e-mail
- [ ] A-008 🟡 JWT_EXPIRES_IN utilizado efetivamente
- [ ] A-010 🟡 Validação Zod do payload do JWT no middleware auth
- [ ] A-060 🔵 Parâmetros explícitos em jwt.sign e jwt.verify
- [ ] A-036 🟡 Rate limit de autenticação por IP e conta
- [ ] A-059 🟡 Rate limit em rotas sensíveis /me (senha e exclusão)
- [ ] A-009 🟡 Revogação de JWT / token_version

### Lote 03: Validações de Schemas e Integridade de Dados no Shared e Backend (status: ⬜ pendente)
- [ ] A-011 🟠 Validação de data YYYY-MM-DD rejeitando datas inexistentes
- [ ] A-012 🟡 Validação estrita de birthDate e measured_at
- [ ] A-006 🟠 Medição retroativa não deve sobrescrever peso atual do perfil
- [ ] A-021 🔵 Uso de nullish coalescing (??) para números
- [ ] A-023 🔵 Item em 'un' sem unit_weight
- [ ] A-043 🔵 previewGoals tratamento de birth_date nulo
- [ ] A-045 🔵 updateUser formatação de data consistente

### Lote 04: Regras de Negócio e Catálogo de Alimentos no Backend (status: ⬜ pendente)
- [ ] A-003 🟠 Unicidade de nome de alimentos e tratamento 23505
- [ ] A-105 🟠 Script import-foods restrito ao catálogo (user_id IS NULL)
- [ ] A-015 🟡 Filtro de alimentos inativos/de outros usuários
- [ ] A-020 🔵 Tipagem estrita de multiplicadores de atividade física
- [ ] A-024 🟡 Tratamento de fuso de São Paulo em date.ts e meal.service
- [ ] A-025 🟡 Otimização de consultas em copyMeal
- [ ] A-035 🟡 Recálculo de metas na atualização do perfil
- [ ] A-061 🔵 Regra de TMB para prefiro_nao_responder

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
- Lote: 01 | Commit: pendente (lote 01)
- O que foi feito: Removida a senha padrão hardcoded de `docker-compose.yml`, tornando `DB_PASSWORD` obrigatória via `${DB_PASSWORD:?DB_PASSWORD é obrigatória...}`, e restrito o bind da porta PostgreSQL para `127.0.0.1:${DB_PORT:-5432}:5432`.
- Arquivos alterados: `docker-compose.yml`
- Decisões tomadas: Rotação de senha em banco de produção existente registrada para o proprietário executar (Regra nº 4).

### A-107: ✅ CORRIGIDO
- Lote: 01 | Commit: pendente (lote 01)
- O que foi feito: Atualizado `backend/scripts/download-taco.ts` para ler os macronutrientes tanto de campos aninhados (`attributes.energy.kcal`, `attributes.protein.qty`, etc.) quanto de raiz (`energy_kcal`, `protein_g`, etc.), adicionada validação estrita que aborta se nenhum alimento tiver nutrientes > 0, e regenerado `backend/data/taco-full.json` com dados nutricionais reais (597 alimentos, 591 com nutrientes > 0).
- Arquivos alterados: `backend/scripts/download-taco.ts`, `backend/data/taco-full.json`
- Decisões tomadas: Arredondamento para 2 casas decimais no parser.

### A-106: ✅ CORRIGIDO
- Lote: 01 | Commit: pendente (lote 01)
- O que foi feito: Em `backend/scripts/import-foods.ts`, corrigido tratamento de erros no bloco `catch` para propagar o erro (re-throw) após o rollback, e adicionado `pool.end()` tanto no encerramento de sucesso quanto no catch com `process.exit(1)`.
- Arquivos alterados: `backend/scripts/import-foods.ts`
- Decisões tomadas: Proteção com try/catch no próprio rollback caso ocorra falha de conexão.

### A-105: ✅ CORRIGIDO
- Lote: 01 | Commit: pendente (lote 01)
- O que foi feito: Em `backend/scripts/import-foods.ts`, restrita a query de desativação prévia ao catálogo global adicionando a cláusula `AND user_id IS NULL`, impedindo que alimentos personalizados de usuários sejam desativados por importações.
- Arquivos alterados: `backend/scripts/import-foods.ts`
- Decisões tomadas: Antecipado do Lote 04 para o Lote 01 por pertencer ao mesmo arquivo já editado para A-106.

### A-108: ✅ CORRIGIDO
- Lote: 01 | Commit: pendente (lote 01)
- O que foi feito: Em `backend/scripts/seed-perf.js`, removido o fallback inseguro `'postgres'`, exigindo `process.env.DB_PASSWORD`. Adicionada trava para só permitir execução em bancos terminados com `_perf` ou `_test`. Adicionada deleção prévia de `perf-user@example.com` para garantir total idempotência em execuções repetidas.
- Arquivos alterados: `backend/scripts/seed-perf.js`
- Decisões tomadas: Usar DELETE para cascatear limpeza de refeições e metas do usuário de teste.

### A-109: ✅ CORRIGIDO
- Lote: 01 | Commit: pendente (lote 01)
- O que foi feito: Em `backend/scripts/run-stats-explain.js`, removido o fallback de senha `'postgres'`, exigindo `DB_PASSWORD`. Envolvida a execução em bloco `try/finally` para assegurar que `pool.end()` sempre seja invocado.
- Arquivos alterados: `backend/scripts/run-stats-explain.js`
- Decisões tomadas: Manter compatibilidade com `process.env.DB_NAME || 'contador_calorias_perf'`.

### A-110: ✅ CORRIGIDO
- Lote: 01 | Commit: pendente (lote 01)
- O que foi feito: Em `backend/scripts/check-indices.ts`, reestruturado o script em função assíncrona com `try/catch/finally`, garantindo que `pool.end()` seja chamado mesmo quando a query falhar e setando `process.exitCode = 1` no erro.
- Arquivos alterados: `backend/scripts/check-indices.ts`
- Decisões tomadas: Fechar conexão em `finally` evita travamento do processo Node.

### A-121: ✅ CORRIGIDO
- Lote: 01 | Commit: pendente (lote 01)
- O que foi feito: Em `backend/tests/load/autocannon.js`, corrigida a impressão de `\n` literal para quebras de linha reais e configurado `process.exitCode = 1` caso `result.errors > 0 || result.non2xx > 0`.
- Arquivos alterados: `backend/tests/load/autocannon.js`
- Decisões tomadas: Tornar o script apto a falhar em automações/CI quando houver erros.

## 🧠 DECISÕES E OBSERVAÇÕES GLOBAIS
- Padrão conservador: preservar comportamento de produção e regras de negócio já validadas pelos testes.
- Toda modificação passa por validação rápida (typecheck / testes da área) e ao final do lote pela validação completa (`npm run lint`, `npm run build`, `npm run test`, `npm run test:frontend`).
- Segredos de produção ou rotação de banco exigirão ação manual do dono do projeto; não alteramos arquivos `.env` locais.

## 📊 RELATÓRIO FINAL
(Preenchido só na Fase 4)

## 📝 LOG DE SESSÕES
- Sessão 1: Fase 0 concluída. Branch `fix/auditoria` criada. Linha de base validada (173 testes de backend, 142 de frontend, 0 erros de lint, build bem-sucedido). 129 achados organizados em 14 lotes no `CORRECOES.md`. Lote 01 iniciado.
