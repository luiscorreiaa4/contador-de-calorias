# Especificação de Requisitos (SPEC.md)

## Objetivo e Visão do Produto
O **CalorieSync** é uma aplicação web voltada para pessoas que desejam monitorar sua alimentação diária com precisão atlética, calcular metas calóricas cientificamente embasadas (Mifflin-St Jeor / Katch-McArdle) e acompanhar seu progresso e composição corporal ao longo do tempo.

---

## Requisitos Funcionais (RFs)

### RF-001: Autenticação e Gestão de Usuário
- **Status:** [Concluído]
- **Implementação:** Rotas `/api/users/register`, `/api/users/login`, autenticação stateless com token JWT, exclusão definitiva de conta (`DeleteAccountModal`), e atualização de perfil (`EditProfilePage`).
- **Critérios de Aceite:**
  - Login e cadastro com validação rigorosa de campos via Zod.
  - Senhas armazenadas com hash criptográfico seguro (`bcrypt`).
  - Proteção de rotas privadas no frontend através de `ProtectedRoute`.
  - Exclusão de perfil com remoção física de dados em cascata (`ON DELETE CASCADE`).

### RF-002: Catálogo e Busca de Alimentos em Escala
- **Status:** [Concluído]
- **Implementação:** Modelo `food.model.ts` e endpoint `GET /api/foods` com busca de texto tolerante a acentuação e variações de caixa via extensão `pg_trgm` + função `f_unaccent`.
- **Critérios de Aceite:**
  - O catálogo principal de alimentos é **somente-leitura** para usuários finais, garantindo a integridade dos dados nutricionais.
  - Alimentação da base ocorre através de migrações e scripts de importação idempotentes (`backend/scripts/import-foods.ts`).
  - Resposta paginada com limite de resultados e debounce no frontend.

### RF-003: Registro e Gestão de Refeições
- **Status:** [Concluído]
- **Implementação:** Modelo `meal.model.ts`, rotas `/api/meals`, e modal interativo `NewMealModal.tsx`.
- **Critérios de Aceite:**
  - Usuário pode registrar café da manhã, almoço, jantar ou lanches.
  - Seleção de múltiplos alimentos com cálculo automático proporcional de calorias e macros (proteínas, carboidratos, gorduras).
  - Usuário pode editar ou remover refeições previamente registradas.

### RF-004: Dashboard e Resumo do Dia Corrente
- **Status:** [Concluído]
- **Implementação:** `DashboardPage.tsx` consumindo `GET /api/meals/today` e `GET /api/users/goals/active`.
- **Critérios de Aceite:**
  - Visualização dos totais consumidos hoje em comparação direta com a meta ativa.
  - Barras de progresso visual de calorias e macros individuais.
  - Listagem das refeições registradas no dia, com horários e opções de edição/exclusão.

### RF-005: Onboarding, Perfil Físico e Cálculo de Metas
- **Status:** [Concluído]
- **Implementação:** `OnboardingFlow.tsx`, `GoalSettingsCard.tsx`, `nutrition.service.ts` e tabela `user_goals`.
- **Critérios de Aceite:**
  - Coleta de dados corporais: peso, altura, data de nascimento, sexo biológico, percentual de gordura (opcional), nível de atividade e objetivo.
  - Cálculo automático de TMB via Mifflin-St Jeor (ou Katch-McArdle caso informado % de gordura) e Gasto Energético Total.
  - Piso mínimo de calorias de segurança (1200 kcal para mulheres, 1500 kcal para homens).
  - Usuário pode alternar entre modo automático e manual, editando suas metas livremente a qualquer momento.
  - Metas possuem vigência por data (`effective_from`), preservando o histórico de dias passados.

### RF-006: Estatísticas e Histórico Nutricional
- **Status:** [Concluído]
- **Implementação:** `StatsPage.tsx` e endpoint `GET /api/meals/stats`.
- **Critérios de Aceite:**
  - Consulta agregada por período (últimos 7 ou 30 dias) calculada diretamente em SQL via `LATERAL JOIN`.
  - Cada dia histórico é comparado com a meta que estava vigente naquele dia exato.
  - Gráficos visuais (Recharts) de ingestão calórica diária e divisão de macronutrientes.
  - Cálculo de médias do período considerando apenas os dias com registros efetivos.

---

## Requisitos Não Funcionais (RNFs)

- **RNF-001 — Desempenho e Cache:** Todas as consultas no frontend são gerenciadas pelo TanStack Query v5 com `staleTime` configurado para evitar requisições redundantes. No backend, buscas de texto utilizam índice GIN trigram.
- **RNF-002 — Segurança da Informação:**
  - Validação estrita de entrada via Zod em todas as rotas e formulários.
  - Headers HTTP protegidos por `helmet`.
  - Rate limiting nas rotas de autenticação via `express-rate-limit`.
  - Testes rodam estritamente em banco isolado (`contador_calorias_test`) com trava em código.
- **RNF-003 — Acessibilidade e Estilo (WCAG AA):**
  - Conformidade visual brutalista (alto contraste, sem adornos, `rounded-none`).
  - Suporte nativo a temas Claro e Escuro através de CSS Variables.
  - Proibição de `alert()` e `confirm()` nativos; todos os alertas e confirmações utilizam modais semânticos com focus trap e suporte à tecla `Esc`.

---

## Fluxos Principais do Usuário

1. **Primeiro Acesso:** Cadastro (`RegisterForm`) → Onboarding obrigatório (`OnboardingFlow`) com dados físicos e cálculo inicial de TMB → Redirecionamento ao Dashboard.
2. **Uso Diário:** Login (`LoginForm`) → Dashboard com visão de consumo de hoje → Abertura do modal de refeição (`NewMealModal`) → Busca de alimento com debounce → Registro da porção → Atualização instantânea das barras de progresso via React Query.
3. **Ajuste de Metas:** Acesso ao perfil (`EditProfilePage`) → Alteração de peso ou objetivo → Visualização da prévia de recálculo → Confirmação → Criação de nova vigência em `user_goals` a partir da data de hoje.
4. **Análise de Progresso:** Acesso à aba de estatísticas (`StatsPage`) → Seleção de período (7 ou 30 dias) → Análise de conformidade e médias históricas.
