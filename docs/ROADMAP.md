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
- [ ] **CA-16** Macros para IMC alto (soma P+G > meta; carboidrato zerado) *(D-15)*.

---

## 4. Fases Planejadas

### ⏳ Fase 4: Performance, Robustez e Rede de Testes
*Objetivo: Medir com precisão e otimizar gargalos reais no frontend e backend, fechar lacunas de robustez do backend e criar a rede de testes necessária para as refatorações da Fase 5. Pré-requisito: Fase 3.5 concluída.*

**Escopo original (mantido)**
- [ ] **Frontend — code-splitting por rota** com `React.lazy()` + `manualChunks` de vendor → **PC-20** *(depende de D-16: adotar roteador antes — PC-21)*.
- [ ] **Backend — `EXPLAIN ANALYZE`** em `/api/meals/stats` sob volume, usando o seed de `docs/reviews/performance.md` §4 → **PC-23**.
- [ ] **Cache — `staleTime`/`gcTime`** + invalidação cruzada de `mealStats`, `todayMeals` e `active-goal` → **PC-05**.

**Performance (integrado do backlog)**
- [ ] **PC-02** Compressão HTTP (`compression`).
- [ ] **PC-03** Cache do catálogo de alimentos *(D-07)*.
- [ ] **PC-09** SQL: remover subqueries do dashboard, `count(*) OVER()`, projeção explícita em `foods` *(D-08)*.
- [ ] **PC-10** Índices `foods(name) WHERE active` e `meal_items(food_id)` (nova migração).
- [ ] **PC-12** Lazy `NewMealModal`, `useMemo` no `AuthContext`, `AbortSignal` no autocomplete.
- [ ] **PC-21** Roteamento SPA real (URL, Voltar, F5) *(D-16)*.
- [ ] **PC-22** Inserção multi-row de `meal_items`.

**Robustez e hardening**
- [ ] **PC-04** Remover registro duplicado de rotas em `server.ts`.
- [ ] **PC-06** `apiFetch`: respostas não-JSON e 401 sincronizado com `AuthContext`.
- [ ] **PC-07** Bloquear reexecução do onboarding.
- [ ] **PC-08** Política de senha + `bcrypt.compare` dummy no login.
- [ ] **PC-11** `statement_timeout`, `/health` com probe de banco, graceful shutdown.
- [ ] **PC-13** CI com `npm audit` + Gitleaks; `@vitest/coverage-v8`.
- [ ] **PC-15** Edição de refeição preservando macros base do alimento.
- [ ] **PC-17** Transações atômicas em onboarding/perfil/metas + teste de rollback.
- [ ] **PC-19** Remover perfil biométrico do `localStorage`.

**Rede de testes**
- [ ] **PC-01** Substituir testes tautológicos/no-op.
- [ ] **PC-14** Limpeza do banco de testes *(D-11 — exige consentimento)*.
- [ ] **PC-18** Testes de autorização multiusuário (IDOR).
- [ ] **PC-24** Cobertura de perfil, onboarding, metas com vigência, PUT/DELETE de refeições e stats.

**Documentação**
- [ ] **PC-16** Sincronizar `AGENTS.md` (versões), `TESTING.md`, `README.md`, `ARCHITECTURE.md`, `SPEC.md` e skills com o código *(D-18)*.

---

### ⏳ Fase 5: Redesign, Design Tokens e Conformidade do Frontend
*Objetivo: Elevar a consistência visual e a acessibilidade e alinhar o frontend às regras de `react-rules.md` e `style-rules.md`, sem alterar comportamentos de negócio. Pré-requisito: PC-34 (testes de telas) antes das refatorações estruturais.*

**Escopo original (mantido)**
- [ ] **Centralização de Tokens:** variáveis CSS completas para cores, espaçamentos e contornos brutalistas em `frontend/src/styles/index.css` → **PC-32**.
- [ ] **Componentes Primitivos:** botões, inputs, cards e selects como componentes base reutilizáveis → **PC-32**.
- [ ] **Revisão de Acessibilidade:** contraste WCAG AA e navegação completa por teclado → **PC-32** + **PC-26**.

**Integrado do backlog (ordem sugerida)**
- [ ] **PC-31** Excluir código morto e dependências órfãs — executar primeiro *(D-06)*.
- [ ] **PC-25** Tokens e geometria: cores fixas/`dark:`/hex, `rounded-*`, sombras suaves.
- [ ] **PC-26** Acessibilidade: label de `food-amount`, `aria-label` no `react-select`, `DatePickerInput` com Esc + ARIA.
- [ ] **PC-27** Estados `isError` e vazio no Dashboard e na Stats.
- [ ] **PC-33** Fontes self-hosted e `Montserrat` efetivamente carregada.
- [ ] **PC-34** Testes de telas: Dashboard, Onboarding, EditProfile, AuthContext.
- [ ] **PC-28** `useQuery`/`useMutation` no lugar de `useEffect` + chamadas manuais.
- [ ] **PC-29** `react-hook-form` + Zod nos formulários complexos.
- [ ] **PC-30** Decompor `EditProfilePage` e `NewMealModal`.

---

### ⏳ Fase 6: Profissionalização e Segurança
*Objetivo: Recursos para produção segura e proteção contra abusos.*
- **Confirmação de E-mail:** Verificação em 2 etapas com código OTP ou link de validação.
- **Login Social (OAuth2):** Autenticação rápida com Google e Apple.
- **Recuperação de Senha:** Fluxo de "Esqueci minha senha" com token assinado e expiração de 30 minutos.
- **Proteção Antispam:** Integração de Cloudflare Turnstile nas rotas públicas de autenticação.
- *Itens do backlog vinculados:* BL-05 (recuperação de senha), BL-06 (login social), BL-12 (verificação de e-mail + registro sem enumeração). *Prioridade em disputa: D-03.*

---

### ⏳ Fase 7: Adequação à LGPD e Privacidade
*Objetivo: Conformidade com leis de dados pessoais de saúde.*
- **Páginas Institucionais:** Termos de Uso e Política de Privacidade.
- **Consentimento Explícito:** Checkbox no cadastro com registro de auditoria (`terms_accepted_at`).
- **Portabilidade de Dados:** Endpoint para download do histórico completo em formato `.json` ou `.csv`.
- **Auditoria de Exclusão:** Garantir que o processo de exclusão de conta respeite integralmente o Direito ao Esquecimento.
- *Itens do backlog vinculados:* BL-10 (exportação — D-04), BL-11 (consentimento e páginas legais), BL-16 (retenção de contas inativas). Exclusão já verificada como conforme (SEC-022).

---

### ⏳ Fase 8: Observabilidade, Sessão Segura e Deploy Contínuo
*Objetivo: Disponibilizar a aplicação em produção com monitoramento em tempo real.*
- **Sessão Segura:** Migrar o token JWT do `localStorage` para cookies seguros `HTTP-Only` com Refresh Tokens rotacionados.
- **Rastreamento de Erros:** Integração do **Sentry** no frontend e backend para alerta imediato de exceções em produção.
- **Deploy Automatizado:** Configurar pipeline de deploy contínuo via GitHub Actions para plataformas em nuvem (ex: Render/Railway para backend e Vercel para frontend).
- *Itens do backlog vinculados:* BL-04 (sessão/refresh — D-02), BL-01 (`trust proxy` — D-19), BL-07 (CSP), BL-08 (logging estruturado).

---

## 5. Fora das Fases (Aguardando Decisão)

Itens de alto valor sem fase definida. Ver [BACKLOG §3 e §5](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/BACKLOG.md).
- **BL-02** Navegação por data + registro retroativo (Crítica) — *D-20: criar fase de produto ou promover para a Fase 4*.
- **BL-03** Tipos e cálculo compartilhados — *D-17*.
- **BL-18 a BL-24** Features de retenção (copiar refeição, recentes/favoritos, combos, evolução de peso, alimentos personalizados, água, código de barras).
- **BL-25** App mobile (Expo) — *D-05*.
