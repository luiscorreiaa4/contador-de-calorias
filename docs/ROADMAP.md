# Roadmap de Desenvolvimento (ROADMAP.md)

Este documento registra o planejamento estratégico e a evolução do **CalorieSync**, organizando as fases concluídas e os próximos ciclos de desenvolvimento.

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
- [x] **2.2 Página de Estatísticas (`/estatisticas`):** Telas com visualização gráfica de histórico (7 e 30 dias) e distribuição de macronutrientes via Recharts.
- [x] **2.3 Agregações Analíticas com `LATERAL JOIN`:** Endpoint `/api/meals/stats` utilizando CTE e `LEFT JOIN LATERAL` para correlacionar a meta histórica de cada dia consumido em uma única consulta SQL.
- [x] **2.4 Médias Justas:** Cálculo das médias considerando unicamente os dias em que houve registros alimentares.

---

### ✅ Fase 3: Base de Alimentos em Escala (RF-004)
- [x] **3.1 Migração de Escala:** Adição de `source`, `external_id`, extensões PostgreSQL `pg_trgm` e `unaccent`, e índice GIN de expressão com wrapper imutável `f_unaccent`.
- [x] **3.2 Busca Tolerante:** Endpoint `GET /api/foods` com busca rápida por similaridade trigram, insensível a acentuação e caixa.
- [x] **3.3 Catálogo Somente-Leitura:** Bloqueio de alterações ou criação de alimentos por usuários comuns para garantir a integridade dos dados nutricionais.
- [x] **3.4 Script de Carga:** Utilitário `backend/scripts/import-foods.ts` para carga em lote de bases alimentares (ex: tabela TACO).

---

## 3. Débitos Técnicos Imediatos (Pré-Fase 4) [CONFIRMADO]

Antes de iniciar as melhorias da Fase 4, devem ser corrigidas as inconsistências descobertas na auditoria:
1. **Compilação TypeScript (`npm run build`):** Corrigir tipagens do componente `react-select` em `frontend/src/components/meals/NewMealModal.tsx`.
2. **Linter (`npm run lint`):** Ajustar `prefer-const` em `NewMealModal.tsx:298:9` e remover diretiva `eslint-disable` não utilizada.
3. **Suíte do Frontend (`npm --prefix frontend test`):** Atualizar o texto esperado do botão nos testes do `NewMealModal.test.tsx` (alinhar com "CRIAR REFEIÇÃO") e interceptar rotas pendentes no MSW para o `StatsPage.test.tsx`.

---

## 4. Fases Planejadas

### ⏳ Fase 4: Passe de Performance
*Objetivo: Medir com precisão e otimizar gargalos reais no frontend e backend.*
- **Frontend:** Implementar code-splitting por rota com `React.lazy()` para resolver o aviso de bundle acima de 500 kB identificado no build do Vite.
- **Backend:** Avaliar planos de execução com `EXPLAIN ANALYZE` na consulta analítica de `/api/meals/stats` sob grandes volumes de registros.
- **Cache:** Ajustar tempos de `staleTime` e `gcTime` nas consultas mais frequentes do TanStack Query.

---

### ⏳ Fase 5: Redesign e Consolidação de Design Tokens
*Objetivo: Elevar a consistência visual e acessibilidade sem alterar comportamentos de negócio.*
- **Centralização de Tokens:** Estruturar variáveis CSS completas para cores, espaçamentos e contornos brutalistas em `frontend/src/styles/index.css`.
- **Componentes Primitivos:** Refatorar botões, inputs, cards e selects para componentes base reutilizáveis.
- **Revisão de Acessibilidade:** Testar contraste WCAG AA e navegação completa por teclado em todas as telas.

---

### ⏳ Fase 6: Profissionalização e Segurança
*Objetivo: Recursos para produção segura e proteção contra abusos.*
- **Confirmação de E-mail:** Verificação em 2 etapas com código OTP ou link de validação.
- **Login Social (OAuth2):** Autenticação rápida com Google e Apple.
- **Recuperação de Senha:** Fluxo de "Esqueci minha senha" com token assinado e expiração de 30 minutos.
- **Proteção Antispam:** Integração de Cloudflare Turnstile nas rotas públicas de autenticação.

---

### ⏳ Fase 7: Adequação à LGPD e Privacidade
*Objetivo: Conformidade com leis de dados pessoais de saúde.*
- **Páginas Institucionais:** Termos de Uso e Política de Privacidade.
- **Consentimento Explícito:** Checkbox no cadastro com registro de auditoria (`terms_accepted_at`).
- **Portabilidade de Dados:** Endpoint para download do histórico completo em formato `.json` ou `.csv`.
- **Auditoria de Exclusão:** Garantir que o processo de exclusão de conta respeite integralmente o Direito ao Esquecimento.

---

### ⏳ Fase 8: Observabilidade, Sessão Segura e Deploy Contínuo
*Objetivo: Disponibilizar a aplicação em produção com monitoramento em tempo real.*
- **Sessão Segura:** Migrar o token JWT do `localStorage` para cookies seguros `HTTP-Only` com Refresh Tokens rotacionados.
- **Rastreamento de Erros:** Integração do **Sentry** no frontend e backend para alerta imediato de exceções em produção.
- **Deploy Automatizado:** Configurar pipeline de deploy contínuo via GitHub Actions para plataformas em nuvem (ex: Render/Railway para backend e Vercel para frontend).
