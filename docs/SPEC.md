# Especificação (SPEC.md)

## Objetivo e Público
Aplicação web para usuários que desejam registrar refeições diárias e acompanhar a ingestão de calorias e macronutrientes, mantendo controle sobre dieta e saúde.

## Requisitos Funcionais

- **RF-001 - Autenticação e Gestão de Usuário**
  - **Status:** [CONFIRMADO] Parcial.
  - **O que está implementado:** Rotas e telas de cadastro (RegisterForm) e login (LoginForm), validação de token JWT, exclusão da conta (DeleteAccountModal) e edição básica.
  - **O que falta:** [DÚVIDA] Funcionalidade de recuperação de senha (apenas link visualizado, sem rota back-end correspondente).
  - **Critérios de Aceite:** Login via email/senha, proteção de rotas privadas, edição de perfil.

- **RF-002 - Cadastro e Busca de Alimentos**
  - **Status:** [CONFIRMADO] Implementado (Visto `food.model.ts` e `food.routes.ts`).
  - **Critérios de Aceite:** Criar, listar e buscar alimentos do banco com tabela nutricional (calorias, proteínas, carboidratos, gorduras).

- **RF-003 - Registro de Refeições**
  - **Status:** [CONFIRMADO] Implementado (Visto `meal.model.ts`, testes e `NewMealModal.tsx`).
  - **Critérios de Aceite:** Adicionar alimentos em uma refeição especificando quantidade (g, ml, un), cálculo automático de macros baseado na porção base.

- **RF-004 - Dashboard e Resumo Diário**
  - **Status:** [CONFIRMADO] Parcial.
  - **O que está implementado:** Tela `DashboardPage.tsx` chamando `/meals/stats` via React Query e listagem das refeições do dia corrente.
  - **O que falta:** [DÚVIDA] Comparação visual clara entre o consumido real e a meta calórica estipulada pelo TMB real/calculado.
  - **Critérios de Aceite:** Visualizar total de calorias e macros consumidos no dia em comparação à meta.

- **RF-005 - Onboarding e Perfil Físico**
  - **Status:** [CONFIRMADO] Parcial (Visto campos físicos e `onboarding_completed` em `user.model.ts`).
  - **Critérios de Aceite:** Durante o cadastro ou primeiro acesso, o usuário preenche dados corporais (peso, altura, objetivo, nível de atividade) para permitir futuramente o cálculo automático de TMB e metas.

## Requisitos Não Funcionais
- **RNF-001 - Desempenho:** [CONFIRMADO] Cache no frontend utilizando React Query v5.
- **RNF-002 - Segurança:** [CONFIRMADO] Hash de senhas (bcrypt), tokens JWT e sanitização/validação com Zod.
- **RNF-003 - Acessibilidade (a11y):** [CONFIRMADO] Uso de Radix UI para modais e componentes acessíveis, e Dark Mode nativo.

## Fluxos Principais do Usuário
1. [CONFIRMADO] Usuário faz cadastro e passa pelo **Onboarding**, inserindo suas informações (peso, altura, objetivo) para que o sistema possua a base de cálculo calórico.
2. [CONFIRMADO] Usuário faz login (`LoginPage`).
3. [CONFIRMADO] É redirecionado ao `DashboardPage` (se o onboarding já estiver completo).
4. [CONFIRMADO] Clica em registrar nova refeição (`NewMealModal`).
5. Busca alimento, define quantidade, salva.
6. Dashboard atualiza os totais via revalidação do React Query.

## Fora do Escopo
- [INFERIDO] Geração automática de dietas baseada em IA.
- [INFERIDO] Integração com relógios e smartwatches (Apple Health, Google Fit).
