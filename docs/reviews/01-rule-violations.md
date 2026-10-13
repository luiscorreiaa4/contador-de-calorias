# Relatório de Violações de Regras (01-rule-violations.md)

Este documento lista todas as violações das regras do projeto identificadas no código-fonte atual (`backend/` e `frontend/`), com base nas diretrizes consolidadas em `AGENTS.md` e `.agents/rules/`.

> **Status:** Auditoria realizada em 13/10/2026. Nenhuma alteração de código-fonte foi executada nesta etapa, conforme solicitado.

---

## Sumário das Violações

| Categoria | Regra Auditada | Qtd. Arquivos Afetados | Severidade |
| :--- | :--- | :---: | :---: |
| **Frontend / Data Fetching** | `apiFetch` fora de `useQuery` / `useEffect` com chamadas manuais | 3 | Alta |
| **Frontend / Formulários** | Formulários complexos sem `react-hook-form` + `zod` | 3 | Média |
| **Backend / Validação** | Ausência de `validate(schema)` na rota antes do controller | 3 | Alta |
| **UI / Estilo Brutalista** | Uso de classes de bordas arredondadas (`rounded-*`) | 3 | Média |
| **UI / Design Tokens** | Uso de cores fixas do Tailwind (`zinc-*`, `white`, hexadecimais) | 5 | Alta |
| **UI / Sombras** | Uso de sombras suaves (`shadow-sm`, `shadow-md`) | 2 | Baixa |
| **Acessibilidade (WCAG)** | Input sem `<label htmlFor>` correspondente | 1 | Média |
| **Segurança / Config** | Senha hardcoded em script do `package.json` | 1 | Alta |

---

## 1. Violações de Data Fetching e TanStack Query (Frontend)
*Regra:* [.agents/rules/react-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/react-rules.md) — *Toda busca deve usar `useQuery`; toda mutação deve usar `useMutation`. Proibido `useEffect` com chamadas de API.*

### V-01: Chamada Manual a Serviço em `useEffect`
- **Arquivo:** [`frontend/src/pages/private/EditProfilePage.tsx:86-126`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/EditProfilePage.tsx#L86-L126)
- **Código Atual:**
  ```tsx
  useEffect(() => {
    if (isFetchedRef.current) return;
    isFetchedRef.current = true;
    getCurrentUserProfile().then((freshUser) => {
      // 10 chamadas manuais de setState
    });
  }, [logout, updateUserSession]);
  ```
- **Violação:** `getCurrentUserProfile()` é executado imperativamente dentro de `useEffect` com controle manual de flags e sincronização manual em múltiplos `useState`.
- **Correção Recomendada:** Migrar para `useQuery({ queryKey: ['profile'], queryFn: getCurrentUserProfile })`.

### V-02: Mutações Manuais com `useState` em vez de `useMutation`
- **Arquivos:**
  - [`frontend/src/pages/private/EditProfilePage.tsx:356`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/EditProfilePage.tsx#L356): `updateUserProfile(payload)` chamado diretamente em função `async handleSubmit`.
  - [`frontend/src/components/onboarding/OnboardingFlow.tsx:80`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/onboarding/OnboardingFlow.tsx#L80): `completeUserOnboarding(...)` chamado diretamente em `handleSubmit` com estados locais `isLoading` e `serverError`.
  - [`frontend/src/components/auth/LoginForm.tsx:40`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/auth/LoginForm.tsx#L40) e [`RegisterForm.tsx:43`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/auth/RegisterForm.tsx#L43): `loginUser` e `registerUser` chamados com `useState` manual de loading.
- **Violação:** Mutações de servidor executadas sem o hook `useMutation`, perdendo os benefícios de ciclo de vida assíncrono (`isPending`, `error`, `onSuccess`).
- **Correção Recomendada:** Envolver todas as operações de escrita em hooks `useMutation`.

---

## 2. Violações de Formulários Complexos (Frontend)
*Regra:* [.agents/rules/react-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/react-rules.md) — *Formulários com 3 ou mais campos devem usar `react-hook-form` + `zod`.*

### V-03: Formulário de Perfil com Estado Artesanal Extenso
- **Arquivo:** [`frontend/src/pages/private/EditProfilePage.tsx:43-83`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/EditProfilePage.tsx#L43-L83)
- **Código Atual:** Mais de 12 variáveis de `useState` (`name`, `email`, `goal`, `sex`, `birthDate`, `weight`, `height`, `bodyFat`, `activityLevel`, `currentPassword`, `newPassword`, `confirmNewPassword`, `errors`) e função manual `validate()` de 35 linhas.
- **Violação:** Viola diretamente a diretriz de adoção de `react-hook-form` + Zod para formulários complexos.
- **Correção Recomendada:** Refatorar para `useForm` utilizando o schema Zod conceitual compartilhado com o backend.

### V-04: Formulário de Onboarding Manual
- **Arquivo:** [`frontend/src/components/onboarding/OnboardingFlow.tsx:13-23`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/onboarding/OnboardingFlow.tsx#L13-L23)
- **Violação:** Multi-step form com validações imperativas em `validateBirthDate` e `nextStep` gerenciadas via `useState` manual.
- **Correção Recomendada:** Utilizar `react-hook-form` com validação de esquema Zod por etapa.

---

## 3. Violações de Validação Zod na Rota (Backend)
*Regra:* [.agents/rules/backend-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/backend-rules.md) — *Toda rota com body/query/params deve aplicar `validate(schema)` na rota antes do controller.*

### V-05: Rota de Alimentos sem Middleware na Rota
- **Arquivo:** [`backend/src/routes/food.routes.ts:10`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/food.routes.ts#L10) e [`backend/src/controllers/food.controller.ts:11-19`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/food.controller.ts#L11-L19)
- **Código Atual:**
  `router.get('/', FoodController.list);` — a rota não possui middleware `validate`. Dentro do controller existe um `listQuerySchema.parse(req.query)` local.
- **Violação:** Regra explícita que proíbe `.parse()` manual no controller e exige `validate(schema, 'query')` na rota.
- **Correção Recomendada:** Mover o schema para `backend/src/schemas/food.schema.ts` e aplicar `validate(foodQuerySchema, 'query')` em `food.routes.ts`.

### V-06: Rotas de Refeições e Metas sem Validação de Query/Params
- **Arquivos:**
  - [`backend/src/routes/meal.routes.ts:12`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/meal.routes.ts#L12): `GET /today` recebe query `date` sem validação Zod na rota.
  - [`backend/src/routes/meal.routes.ts:13`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/meal.routes.ts#L13): `GET /stats` recebe queries `period` e `date` sem validação Zod na rota.
  - [`backend/src/routes/meal.routes.ts:14-15`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/meal.routes.ts#L14-L15): `PUT /:id` e `DELETE /:id` não validam o parâmetro `:id` (formato UUID).
  - [`backend/src/routes/user.routes.ts:25`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/user.routes.ts#L25): `GET /me/goals` recebe query `date` sem validação Zod na rota.
- **Violação:** Parâmetros de rota e query chegam diretamente aos controllers sem validação prévia de tipo ou formato por schema.
- **Correção Recomendada:** Criar schemas para `paramsSchema` (UUID) e `dateQuerySchema`, aplicando `validate()` nessas rotas.

---

## 4. Violações de Estilo Brutalista e Geometria (Frontend)
*Regra:* [.agents/rules/style-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/style-rules.md) — *Zero arredondamento (exclusivamente `rounded-none`).*

### V-07: Classes `rounded-*` em Componentes
- **Arquivos e Linhas:**
  - [`frontend/src/components/ThemeToggle.tsx:16`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ThemeToggle.tsx#L16): `className="... rounded-lg ..."`
  - [`frontend/src/components/ui/tooltip.tsx:22`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ui/tooltip.tsx#L22): `className="... rounded-md ..."`
  - [`frontend/src/App.tsx:72`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/App.tsx#L72): `className="... rounded-full ..."` no spinner de fallback.
- **Violação:** O design brutalista atlético proíbe qualquer tipo de arredondamento nos elementos de interface.
- **Correção Recomendada:** Substituir todas por `rounded-none`.

---

## 5. Violações de Design Tokens e Cores Fixas (Frontend)
*Regra:* [.agents/rules/style-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/style-rules.md) — *NUNCA usar cores fixas (zinc, white, hex) ou classes `dark:` para cores mapeadas.*

### V-08: Cores Fixas da Paleta Zinc e Classes `dark:` Manuais
- **Arquivos e Linhas:**
  - [`frontend/src/components/ThemeToggle.tsx:16`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ThemeToggle.tsx#L16): Usa `text-zinc-500`, `dark:text-zinc-400`, `hover:text-zinc-900`, `dark:hover:text-zinc-100`, `hover:bg-zinc-100`, `dark:hover:bg-zinc-800`.
  - [`frontend/src/components/ui/tooltip.tsx:22`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ui/tooltip.tsx#L22): Usa `bg-white`, `text-zinc-900`, `border-zinc-200`, `dark:border-zinc-800`, `dark:bg-zinc-900`, `dark:text-zinc-50`.
  - [`frontend/src/components/layout/AppHeader.tsx:137`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/layout/AppHeader.tsx#L137): Usa `bg-white dark:bg-[#0a0a0a]` para o menu de dropdown.
  - [`frontend/src/components/ui/input.tsx:12`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ui/input.tsx#L12): Usa `dark:bg-[#0a0a0a]` e `dark:text-white`.
  - [`frontend/src/App.tsx:72`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/App.tsx#L72): Usa `border-emerald-500`.
- **Violação:** Desrespeita a padronização das CSS Variables (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-primary`).
- **Correção Recomendada:** Substituir todas as cores literais e hexadecimais pelos tokens semânticos padrão.

---

## 6. Violações de Sombras Suaves (Frontend)
*Regra:* [.agents/rules/style-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/style-rules.md) — *Sem sombras suaves; usar apenas sombras duras (`shadow-hard` ou deslocamento de bloco).*

### V-09: Sombras com Difusão
- **Arquivos e Linhas:**
  - [`frontend/src/components/ui/tooltip.tsx:22`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ui/tooltip.tsx#L22): Usa `shadow-md`.
  - [`frontend/src/components/ui/card.tsx:9`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/ui/card.tsx#L9): Usa `shadow-sm`.
- **Violação:** O estilo brutalista proíbe gradientes e difusões de sombra.
- **Correção Recomendada:** Substituir por `shadow-hard` ou `border-2 border-border`.

---

## 7. Violações de Acessibilidade (Frontend)
*Regra:* [.agents/rules/style-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/style-rules.md) — *Todo input deve ter `<label htmlFor>` associado.*

### V-10: Input sem Label Vinculado
- **Arquivo:** [`frontend/src/components/meals/NewMealModal.tsx:575`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L575)
- **Código Atual:** `<input id="food-amount" ... />` sem `<label htmlFor="food-amount">` ou `aria-label`.
- **Violação:** Leitores de tela não conseguem identificar o propósito do campo de quantidade do alimento.
- **Correção Recomendada:** Adicionar `<label htmlFor="food-amount" className="sr-only">QUANTIDADE</label>` ou `aria-label="Quantidade do alimento"`.

---

## 8. Violações de Segredos em Configurações (Backend)
*Regra:* [.agents/rules/backend-rules.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/.agents/rules/backend-rules.md) — *Nenhum segredo hardcoded.*

### V-11: Senha em Texto Puro no Script de Teste
- **Arquivo:** [`backend/package.json:11`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/package.json#L11)
- **Código Atual:** `"db:reset:test": "node-pg-migrate --database-url-var DATABASE_URL_TEST down 0 && node-pg-migrate --database-url-var DATABASE_URL_TEST up"`, mas na versão anterior continha `postgresql://postgres:vN7qL2xR9mK4zP8wT6aB3@localhost:5432/contador_calorias_test`.
- **Violação:** Viola a regra inegociável de que qualquer credencial deve vir de variáveis de ambiente dinâmicas.
- **Correção Recomendada:** Usar variáveis lidas do arquivo `.env.test` ou do ambiente.
