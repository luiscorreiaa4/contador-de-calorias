# Migração de Navegação Mobile + Renomeação "Dashboard" → "Diário"

Estado vivo da tarefa (idempotente: uma nova janela retoma pelos itens não marcados). Branch: `feat/navegacao-mobile` (base `feat/admin-catalogo`, partida `c3744d0`).

## Como é hoje

- **Roteador:** `frontend/src/router.tsx`. `RootLayout` envolve tudo; `PublicRoute` (`login`, `cadastro`); `ProtectedRoute` (`onboarding`, index, `diario/:date`, `estatisticas`→`/evolucao/alimentacao`, `medidas`→`/evolucao/corpo`, `evolucao`, `metas`, `configuracoes`, `perfil`); `AdminRoute` (`admin/alimentos`); fora de wrapper: `verificar-email`, `esqueci-senha`, `redefinir-senha`, `termos`, `privacidade`, `seguranca`, `*`.
- **Tela "Dashboard":** `pages/private/DashboardPage.tsx` (index e `diario/:date`). Subtítulo "Painel de Performance"; navegador de datas com rótulo `Hoje`/`Diário`.
- **Header:** `components/layout/AppHeader.tsx`. `primaryLinks` (Dashboard, Evolução, Metas, Catálogo admin, Perfil, Configurações); barra de abas desktop (`hidden md:block`); dropdown do avatar (`z-[100]`) com tema, links e "Sair da conta" (`logout` do `AuthContext`).
- **Seções:** `components/layout/SectionLayout.tsx` (Evolução: `alimentacao`/`corpo`; Metas: `rotina`/`diarias`; Configurações: `notificacoes`/`seguranca`/`privacidade`, todas rotas aninhadas; `shortLabel` só em "Privacidade e dados").
- **Modal de refeição:** `NewMealModal` (lazy) aberto por estado local na tela; props `isOpen`, `onClose`, `mealToEdit`, `mealDate`; invalida `todayMeals`, `mealStats`, `foods`, `favoriteFoods`, `savedMeals` internamente.
- **Shell:** `RootLayout.tsx` (tema `darkMode`/`toggleTheme` em `useState` + `localStorage.theme`, banner offline, `<main>` `pb-8 sm:pb-16`, `Footer`).
- **Tema/Logout:** não há `ThemeToggle`; botões inline no header. `logout` em `context/AuthContext.tsx`.
- **Viewport:** `index.html` sem `viewport-fit=cover`.
- **z-index:** `main` z-10, header z-50, DatePicker z-50, dropdown z-[100], modais z-[200]. Breakpoints: padrão do Tailwind (md = 768px).
- **Datas:** `utils/date.ts` (`getLocalDateString`, `isValidLocalDateString`, `addDaysToDateString`).

## Como fica

| Destino | Rota | Slot da barra inferior | Ativo em |
| --- | --- | --- | --- |
| DIÁRIO | `/` | 1 | `/`, `/diario/:date` |
| PROGRESSO | `/evolucao` | 2 | `/evolucao/*`, `/metas/*` |
| + NOVA | — (abre modal) | 3 | nunca |
| CONTA | `/conta` | 4 | `/conta`, `/perfil`, `/configuracoes/*` |

PROGRESSO em dois níveis: SegmentedNav `[EVOLUÇÃO|METAS]` + SegmentedNav das sub-abas. O swipe percorre as folhas: Alimentação → Corpo → Rotina → Diárias; Configurações: Notificações → Segurança → Privacidade. Sem swipe em Diário, `/conta`, Perfil e barra inferior.

## Decisões do agente

- Árvore suja inicial (só o arquivo do prompt) foi commitada em `feat/admin-catalogo` (`c3744d0`) por decisão do usuário.
- Evolução e Metas já têm sub-abas; adotado layout de dois níveis (decisão do usuário).
- Catálogo (admin) passa a aparecer em `/conta`, pois o dropdown some no mobile.
- Barra inferior: `border-t border-border/40` fina é exceção consciente ao `border-2` do app.
- PROGRESSO abre `/evolucao` (a "última aba visitada" exigiria estado novo).

## Áreas sem swipe

| Caminho | O que é | Proteção | Telas | Status |
| --- | --- | --- | --- | --- |
| `pages/private/StatsPage.tsx` | gráfico Recharts | `data-no-swipe` | Evolução › Alimentação | [ ] |
| `pages/private/MeasurementsPage.tsx` | gráfico Recharts | `data-no-swipe` | Evolução › Corpo | [ ] |
| `pages/private/MeasurementsPage.tsx:489` | tabela `overflow-x-auto` | detecção automática + `data-no-swipe` | Evolução › Corpo | [ ] |
| `components/common/DatePickerInput.tsx` | date picker próprio | `data-no-swipe` | Evolução › Corpo | [ ] |
| `components/meals/FoodSearchSelect.tsx` | react-select (no modal) | `data-no-swipe` + `[role=dialog]` | modal global | [ ] |
| `pages/admin/AdminCatalogPage.tsx:294` | tabela `overflow-x-auto` | fora das seções (só registro) | `/admin/alimentos` | [ ] |

Sem uso atual de Radix Slider/Dialog/Popover, carrossel, `touch-action`, `onTouch*`/`onPointer*` ou `draggable`.

## Exceções de grep ("dashboard")

Zero "dashboard" em `frontend/` e docs vivos. Exceções: `docs/archive/**` (histórico), `docs/AGENT_LOG.md` e este arquivo (registro), e "antigo Dashboard" em `docs/UX_NAVIGATION.md` (nota de rename). Nenhuma biblioteca com o termo.

## CHECKLIST

| Caminho | Ação | Status |
| --- | --- | --- |
| `frontend/src/pages/private/DashboardPage.tsx` (+ teste) | `git mv` → `DiaryPage` e rename de textos | [x] |
| `frontend/src/router.tsx` | import `DiaryPage`, rota `conta`, abas do módulo | [ ] |
| `frontend/src/components/layout/AppHeader.tsx` | rename, consumir módulo, gatilho `hidden md:flex` | [ ] |
| `frontend/src/components/auth/LoginForm.tsx` (+ teste), `VerifyEmailPage.test.tsx`, `StatsPage.tsx` | textos "Diário" | [x] |
| docs vivos, `.agents/`, `.claude/`, README, AGENTS.md, CLAUDE.md | rename | [x] |
| `frontend/src/navigation/nav-items.ts`, `icons.tsx` (+ testes) | criar | [ ] |
| `frontend/src/components/layout/SegmentedNav.tsx`, `SectionLayout.tsx` | criar/evoluir | [ ] |
| `frontend/src/navigation/swipe.ts`, `useSwipeTabs.ts`, `SwipeTabsArea.tsx` (+ testes e guarda fs) | criar | [ ] |
| `frontend/src/navigation/useHideOnScroll.ts`, `components/layout/BottomNav.tsx` | criar | [ ] |
| `frontend/src/context/NewMealModalContext.tsx`, `ThemeContext.tsx`, `ThemeToggle.tsx` | criar/mover | [ ] |
| `frontend/src/pages/private/AccountPage.tsx` | criar | [ ] |
| `frontend/index.html`, `RootLayout.tsx` | `viewport-fit=cover`, padding inferior | [ ] |
| docs: SPEC, ARCHITECTURE, UX_NAVIGATION, CORES, ROADMAP, rules (`.agents` e `.claude`) | atualizar | [ ] |
