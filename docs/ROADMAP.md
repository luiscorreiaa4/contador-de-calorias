# Roadmap de Desenvolvimento (ROADMAP.md)

Este documento registra o planejamento estratégico e a evolução do **CalorieSync**, organizando as fases concluídas e os próximos ciclos de desenvolvimento.

> Os IDs `CA-xx`, `PC-xx`, `BL-xx` e as decisões `D-xx` referenciam o backlog consolidado em [docs/BACKLOG.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/BACKLOG.md), derivado de `docs/reviews/*.md` (13/10/2026).

---

## 1. Método de Trabalho e Ciclo de Tarefas

1. **Uma Tarefa por Vez:** Cada incremento é estruturado através do modelo [docs/TASK_TEMPLATE.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/TASK_TEMPLATE.md).
2. **Proposta e Validação:** Em cada sessão, a IA propõe o plano de ação detalhado (arquivos envolvidos, riscos e testes a criar) e aguarda aprovação do desenvolvedor antes de editar código.
3. **Verificação Obrigatória:** Nenhuma alteração é finalizada sem que `npm run test`, `npm run lint` e `npm run build` sejam validados.
4. **Fechamento e Registro:** Conclusão da tarefa gera commit semântico atômico e atualização do status no [docs/SPEC.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/SPEC.md) e na lista de débitos [docs/TECH_DEBT.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/TECH_DEBT.md).

---

## 2. Fases Concluídas [CONFIRMADO]

### ✅ Fase 0: Fundação, Segurança e Qualidade
- [x] **0.1 Rotação e Proteção de Segredos:** Remoção de credenciais ativas do código, criação de `backend/.env.example` e validação de inicialização com Zod.
- [x] **0.2 Banco de Testes Isolado:** Criação de `contador_calorias_test` e implementação da trava em código (`pool.ts`) abortando execuções de teste fora do sufixo `_test`.
- [x] **0.3 Padronização de Linter:** Configuração do ESLint com `typescript-eslint` em todo o monorepo.
- [x] **0.4 Proteção de Rede Básica:** Adição de `helmet`, CORS restritivo e `express-rate-limit` nas rotas de autenticação.
- [x] **0.5 Migrações Determinísticas:** Padronização com `node-pg-migrate` na pasta `backend/migrations/`.
- [x] **0.6 Integração Contínua (CI):** Configuração do pipeline GitHub Actions (`.github/workflows/ci.yml`).
- [x] **0.7 Suíte de Testes:** 37 testes cobrindo regras de negócio e rotas de integração no backend (`node:test`) e testes de componentes com Vitest + RTL + MSW.
- [x] **0.8 Linha de Base de Performance:** Registro das métricas de bundle size em [docs/PERFORMANCE_BASELINE.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/PERFORMANCE_BASELINE.md).
- [x] **0.9 Unificação da Marca (CalorieSync):** Padronização do nome em todo o código, documentação e interfaces.

---

### ✅ Fase 1: Cálculo Técnico e Metas Editáveis (RF-002, RF-003)
- [x] **1.0 Padronização de Fuso Horário:** Configuração de `cross-env TZ=America/Sao_Paulo` nos scripts e uso de `TIMESTAMPTZ` no PostgreSQL.
- [x] **1.1 Migração de Histórico:** Criação das tabelas `body_measurements` e `user_goals` com vigência de metas por data (`effective_from`).
- [x] **1.2 Motor de Cálculo Nutricional:** Implementação de `nutrition.service.ts` com cálculo de TMB (Mifflin-St Jeor / Katch-McArdle), TDEE, pisos calóricos e macros.
- [x] **1.3 Endpoints de Metas:** Rotas `/api/users/goals` e `/api/users/goals/preview` para simulação e persistência de metas automáticas ou manuais.
- [x] **1.4 Interface de Metas:** Componente `GoalSettingsCard.tsx` integrado ao perfil do usuário.

---

### ✅ Fase 2: Dashboard Enxuto e Página de Estatísticas (RF-005, RF-006)
- [x] **2.1 Dashboard do Dia:** Visão focada no dia corrente comparando o consumo real contra a meta ativa do dia.
- [x] **2.2 Página de Estatísticas:** Telas com visualização gráfica de histórico (7 e 30 dias) e distribuição de macronutrientes via Recharts. *(Correção 13/10/2026: não existe rota `/estatisticas`; a navegação usa estado `currentView` em `App.tsx` — ver PC-21 / D-16.)*
- [x] **2.3 Agregações Analíticas com `LATERAL JOIN`:** Endpoint `/api/meals/stats` utilizando CTE e `LEFT JOIN LATERAL` para correlacionar a meta histórica de cada dia consumido em uma única consulta SQL.
- [x] **2.4 Médias Justas:** Cálculo das médias considerando unicamente os dias em que houve registros alimentares.

---

### ✅ Fase 3: Base de Alimentos em Escala (RF-004)
- [x] **3.1 Migração de Escala:** Adição de `source`, `external_id`, extensões PostgreSQL `pg_trgm` e `unaccent`, e índice GIN de expressão com wrapper imutável `f_unaccent`.
- [x] **3.2 Busca Tolerante:** Endpoint `GET /api/foods` com busca rápida por similaridade trigram, insensível a acentuação e caixa.
- [x] **3.3 Catálogo Somente-Leitura:** Bloqueio de alterações ou criação de alimentos por usuários comuns para garantir a integridade dos dados nutricionais.
- [x] **3.4 Script de Carga:** Utilitário `backend/scripts/import-foods.ts` para carga em lote de bases alimentares (ex: tabela TACO).

---

## 3. Fase 3.5: Estabilização — Corrigir Agora [CONFIRMADO]

*Objetivo: Eliminar falhas de segurança e bugs críticos e devolver o CI ao verde antes de qualquer otimização. Substitui a antiga lista "Débitos Técnicos Imediatos (Pré-Fase 4)".*

Ordem sugerida (score severidade × esforço; detalhes em [BACKLOG §1](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/BACKLOG.md)):

**CI verde (pré-requisito de todo o resto)**
- [x] **CA-02** Build: generics do `react-select` em `NewMealModal.tsx:455,461`.
- [x] **CA-08** Lint: `prefer-const` em `NewMealModal.tsx:298` e diretiva órfã na `:181`.
- [x] **CA-03** Suíte do frontend: 9/13 testes falhando em `LoginForm`, `RegisterForm` e `NewMealModal` + erro MSW em `StatsPage` (contrato `/foods` e handler `/meals/stats`).

**Segurança**
- [x] **CA-01** Remover fallback `'fallback_jwt_secret'` (`auth.ts:19`, `user.service.ts:235`).
- [ ] **CA-06** Rotacionar segredos do commit `24d1ce65` *(expurgo do histórico depende de D-12)*.
- [x] **CA-07** Remover senha hardcoded do `db:reset:test`.
- [x] **CA-05** SSL estrito no pool de produção *(D-19)*.
- [x] **CA-10** Mascarar mensagens do PostgreSQL em respostas 500 *(D-10)*.
- [x] **CA-11** Tetos Zod/payload (itens, nomes, quantidade, busca + escape `ILIKE`, senha ≤ 72, `express.json` limit).
- [x] **CA-12** Trava de ambiente em `scripts/reset-db.js`.
- [x] **CA-13** Atualizar dependências vulneráveis (`proxy-addr`, `tar`, `shell-quote`, `brace-expansion`).
- [x] **CA-15** `validate()` para `query`/`params` + schemas de UUID, data, período e busca *(D-09)*.

**Bugs de cálculo e data**
- [x] **CA-04** Vigência de metas gravada no dia seguinte após 21h BRT *(D-01)*.
- [x] **CA-09** `calculateAge` com parse UTC.
- [x] **CA-14** Janela diária e agrupamento de estatísticas independentes do TZ do processo + `?date=` no frontend + testes com `TZ=UTC` *(D-01)*.
- [x] **CA-16** Macros para IMC alto (soma P+G > meta; carboidrato zerado) *(D-15)*.

---

## 4. Fases Planejadas

### ⏳ Fase 4: Performance, Robustez e Rede de Testes
*Objetivo: Medir com precisão e otimizar gargalos reais no frontend e backend, fechar lacunas de robustez do backend e criar a rede de testes necessária para as refatorações da Fase 5. Pré-requisito: Fase 3.5 concluída.*

**Roteamento e Performance (D-16: PC-21 antes de PC-20)**
- [ ] **PC-21** Roteamento SPA real com `react-router` v7 (`createBrowserRouter`), URLs declarativas, histórico, botão Voltar e F5 funcionando *(D-16)*.
- [ ] **PC-20** Code-splitting por rota com `lazy` nativo do roteador + `manualChunks` de vendor no Vite *(D-16)*.
- [ ] **PC-02** Compressão HTTP (`compression`).
- [ ] **PC-03** Cache do catálogo de alimentos com `Cache-Control: private, max-age=300` + ETag + `Vary: Authorization` *(D-07)*.
- [ ] **PC-09** SQL: remover subqueries do dashboard, `count(*) OVER()`, e projeção explícita de `foods` com `source`, sem `external_id` nem `active` *(D-08, D-14)*.
- [ ] **PC-10** Índices `foods(name) WHERE active` e `meal_items(food_id)` via nova migração imutável *(D-13, D-14)*.
- [ ] **PC-05** Cache do React Query: `staleTime`/`gcTime` + invalidação cruzada de `mealStats`, `todayMeals` e `active-goal`.
- [ ] **PC-12** Otimizações frontend: import dinâmico de `NewMealModal`, `useMemo` no `AuthContext`, `AbortSignal` no autocomplete.
- [ ] **PC-22** Inserção multi-row em lote para `meal_items` *(D-14)*.
- [ ] **PC-23** `EXPLAIN ANALYZE` em `/api/meals/stats` sob volume (seed de 10k itens).

**Robustez e Hardening**
- [x] **PC-04** Remover registro duplicado de rotas em `server.ts` *(D-14)*.
- [ ] **PC-06** `apiFetch`: tratamento de respostas não-JSON (ex: 502) e 401 que limpa `localStorage` sincronizado com `AuthContext`.
- [ ] **PC-07** Bloquear reexecução indevida de onboarding se `onboarding_completed: true`.
- [ ] **PC-08** Política de senha forte + `bcrypt.compare` dummy no login para mitigação de timing attack.
- [ ] **PC-11** Resiliência: `statement_timeout`, `/health` com probe ativo de banco, graceful shutdown.
- [ ] **PC-13** CI: integrar `npm audit --audit-level=high` + Gitleaks; `@vitest/coverage-v8`.
- [ ] **PC-15** Edição de refeição preservando valores nutricionais base do alimento.
- [ ] **PC-17** Transações atômicas (`BEGIN`/`COMMIT`/`ROLLBACK`) em onboarding/perfil/metas + teste de rollback.
- [ ] **PC-19** Remover perfil biométrico do `localStorage` (`user_session`), mantendo dados sensíveis apenas em memória *(D-02)*.

**Rede de Testes**
- [x] **PC-01** Substituir testes falso-positivos por asserções reais.
- [x] **PC-14** Limpeza determinística do banco de testes em hook `after` (`DELETE FROM users WHERE email LIKE 'tester-%'` com trava de runtime `_test`) *(D-11)*.
- [x] **PC-18** Testes de integração de autorização multiusuário (IDOR) em todas as rotas *(D-14)*.
- [x] **PC-24** Cobertura de integração: perfil, onboarding, metas com vigência, PUT/DELETE refeições e stats *(D-14)*.

**Documentação**
- [ ] **PC-16** Sincronizar documentação com o código; consolidar `docs/BACKLOG.md` como fonte única; arquivar `docs/TECH_DEBT.md` e mover arquivos `.txt` para `docs/archive/` *(D-18, D-05)*.

---

### ⏳ Fase 4.5: Diário Completo (Produto)
*Objetivo: Implementar os recursos de navegação diária histórica, registro retroativo e ferramentas de produtividade alimentar no diário antes da fase de redesign. Pré-requisito: Fase 4 concluída (especialmente fuso D-01 e roteador D-16).*

- [ ] **BL-02** Navegação por datas no Dashboard e suporte a registro retroativo de refeições com URL declarativa `/diario/:date` *(D-20, D-01, D-16)*.
- [ ] **BL-18** Copiar refeição individual ou dia inteiro anterior para o dia de hoje com um clique *(D-20)*.
- [ ] **BL-19** Seção de alimentos recentes e favoritos com acesso rápido no modal de refeição *(D-20)*.
- [ ] **BL-20** Refeições salvas e combos reutilizáveis (ex: "Café da manhã padrão") *(D-20)*.

---

### ⏳ Fase 5: Redesign, Design Tokens e Conformidade do Frontend
*Objetivo: Elevar a consistência visual, eliminar código morto e alinhar o frontend às regras brutais de `react-rules.md` e `style-rules.md` sem alterar comportamentos de negócio. Pré-requisito: Fase 4.5 concluída.*

**Limpeza Inicial Obrigatória (D-06: PC-31 executado primeiro)**
- [ ] **PC-31** Excluir código morto e dependências órfãs (`ThemeToggle`, `ui/card`, `switch`, `textarea`, `tooltip`, `App.css`, `clean-foods.ts`, `ts-node-dev`) antes de qualquer ajuste de estilo *(D-06)*.

**Tokens, Estilo e Acessibilidade**
- [ ] **PC-32** Centralização de variáveis CSS brutalistas (cores, contornos, espaçamentos) e criação de componentes primitivos base reutilizáveis.
- [ ] **PC-25** Conformidade visual: eliminar cores hex hardcoded (`#0a0a0a`), `dark:` ad-hoc, `rounded-*` e sombras suaves nos componentes ativos *(D-06)*.
- [ ] **PC-26** Acessibilidade: label associada em `food-amount`, `aria-label` no `react-select`, `DatePickerInput` com Esc e foco acessível.
- [ ] **PC-27** Tratamento visual explícito de estados `isError` e `empty` no Dashboard e Estatísticas.
- [ ] **PC-33** Fontes self-hosted com carregamento local; carregar `Montserrat` efetivamente ou remover declaração órfã.

**Refatoração Estrutural e Arquitetura React**
- [ ] **PC-34** Criar rede de testes de componentes para telas principais: Dashboard, Onboarding, EditProfile e AuthContext (rede de proteção para PC-28/29/30).
- [ ] **PC-28** Migrar `useEffect` + fetch manual para `useQuery` e mutações para `useMutation`.
- [ ] **PC-29** Substituir formulários complexos manuais por `react-hook-form` integrado com resolvers Zod.
- [ ] **PC-30** Decompor componentes monolíticos (`EditProfilePage` e `NewMealModal`) em subcomponentes coesos.

---

### ⏳ Fase 5.5: Pacote Compartilhado de Tipos
*Objetivo: Compartilhamento determinístico de contratos DTO e schemas entre frontend e backend via npm workspaces. Pré-requisito: Fase 5 concluída e antes do início do app mobile.*

- [ ] **BL-03** Criação de pacote compartilhado `shared/` no monorepo contendo schemas Zod puros como fonte da verdade (`z.infer`) e cálculos nutricionais testados com paridade *(D-17)*.

---

### ⏳ Fase 6: Autenticação Avançada e Proteção Antispam
*Objetivo: Recursos para produção segura e proteção contra abusos. Ordem de implementação estrita conforme D-03: BL-12 → BL-05 → BL-06.*

- [ ] **BL-12** Confirmação de e-mail em duas etapas (código OTP/link) e cadastro com proteção contra enumeração de usuários *(D-03)*.
- [ ] **BL-05** Fluxo de recuperação de senha ("Esqueci minha senha") com envio de e-mail e token assinado com expiração de 30 minutos *(D-03)*.
- [ ] **BL-06** Login social (OAuth2 via Google e Apple) integrado à autenticação do backend *(D-03)*.
- [ ] **Proteção Antispam:** Integração de Cloudflare Turnstile nas rotas públicas de autenticação.

---

### ⏳ Fase 7: Adequação à LGPD e Privacidade
*Objetivo: Conformidade rigorosa com leis de dados pessoais de saúde (LGPD art. 18). Bloqueante para lançamento público.*

- [ ] **BL-10** Exportação e portabilidade completa de dados do usuário em formato JSON (principal) e CSV (opcional) *(D-04 — Severidade Média/M)*.
- [ ] **BL-11** Consentimento explícito no cadastro (`terms_accepted_at`) e links funcionais para Termos de Uso e Política de Privacidade.
- [ ] **BL-16** Rotina agendada para expurgo seguro de contas inativas há mais de 2 anos.

---

### ⏳ Fase 8: Observabilidade, Sessão Segura e Deploy Contínuo
*Objetivo: Disponibilizar a aplicação em produção com monitoramento, sessão de alta segurança e infraestrutura robusta. Bloqueante para deploy público.*

- [ ] **BL-04** Revogação de sessão: migração de JWT no localStorage para cookies seguros `HttpOnly` com Refresh Tokens rotacionados em banco *(D-02)*.
- [ ] **BL-01** Habilitação de `trust proxy` configurado por número de saltos (`TRUST_PROXY`) e rate limiting por IP + e-mail *(D-19)*.
- [ ] **BL-07** Content Security Policy (CSP) rigorosa configurada via Helmet.
- [ ] **BL-08** Logging HTTP estruturado em JSON com correlation ID e tempo de resposta.
- [ ] **Rastreamento de Erros:** Integração do Sentry no frontend e backend para monitoramento em tempo real.
- [ ] **Deploy Automatizado:** Pipeline CI/CD via GitHub Actions com fallback SPA para `index.html` *(D-16)*.

---

## 5. Backlog Futuro (Pós-Fase 8)

- **BL-25** Aplicativo mobile dedicado em Expo / React Native *(D-05 — condicionado à web estável e pacote `shared/` D-17)*.
- **BL-09** Migração idempotente para deduplicação e índice único parcial no catálogo de alimentos *(D-13)*.
- **BL-15** Padronização de migrações legadas para ESM nativo *(D-13)*.
- **BL-21** Gráfico de evolução de peso e medidas corporais (`body_measurements`).
- **BL-22** Cadastro de alimentos personalizados pelo próprio usuário *(D-07)*.
- **BL-23** Registro diário de consumo de água com meta personalizada.
- **BL-24** Leitor de código de barras via Open Food Facts.
- **BL-26** Suporte a PWA, manifesto web e modo offline.
- **BL-27** Notificações push na web para lembretes de refeições.
- **BL-28** Distribuição de metas nutricionais específicas por tipo de refeição.
- **CA-06** Expurgo definitivo de histórico do commit `24d1ce65` via `git-filter-repo` *(D-12 — execução manual após conclusão da branch)*.

