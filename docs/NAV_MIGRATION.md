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

PROGRESSO em dois níveis: SegmentedNav `[EVOLUÇÃO|METAS]` + SegmentedNav das sub-abas. **Swipe (revisado, ver "Revisão N5")**: entre Diário ↔ Progresso ↔ Conta, com arrasto animado; sem swipe entre abas irmãs.

## Decisões do agente

- Árvore suja inicial (só o arquivo do prompt) foi commitada em `feat/admin-catalogo` (`c3744d0`) por decisão do usuário.
- Evolução e Metas já têm sub-abas; adotado layout de dois níveis (decisão do usuário).
- Catálogo (admin) passa a aparecer em `/conta`, pois o dropdown some no mobile.
- Barra inferior: `border-t border-border/40` fina é exceção consciente ao `border-2` do app.
- PROGRESSO abre `/evolucao` (a "última aba visitada" exigiria estado novo).

## Áreas sem swipe

| Caminho | O que é | Proteção | Telas | Status |
| --- | --- | --- | --- | --- |
| `pages/private/StatsPage.tsx` | gráfico Recharts | `data-no-swipe` | Evolução › Alimentação | [x] |
| `pages/private/MeasurementsPage.tsx` | gráfico Recharts | `data-no-swipe` | Evolução › Corpo | [x] |
| `pages/private/MeasurementsPage.tsx:489` | tabela `overflow-x-auto` | detecção automática + `data-no-swipe` | Evolução › Corpo | [x] |
| `components/common/DatePickerInput.tsx` | date picker próprio | `data-no-swipe` | Evolução › Corpo | [x] |
| `components/meals/FoodSearchSelect.tsx` | react-select (no modal) | `data-no-swipe` + `[role=dialog]` | modal global | [x] |
| `pages/admin/AdminCatalogPage.tsx:294` | tabela `overflow-x-auto` | fora das seções (só registro) | `/admin/alimentos` | [x] (fora das seções) |

Sem uso atual de Radix Slider/Dialog/Popover, carrossel, `touch-action`, `onTouch*`/`onPointer*` ou `draggable`.

## Exceções de grep ("dashboard")

Zero "dashboard" em `frontend/` e docs vivos. Exceções: `docs/archive/**` (histórico), `docs/AGENT_LOG.md` e este arquivo (registro), e "antigo Dashboard" em `docs/UX_NAVIGATION.md` (nota de rename). Nenhuma biblioteca com o termo.

## CHECKLIST

| Caminho | Ação | Status |
| --- | --- | --- |
| `frontend/src/pages/private/DashboardPage.tsx` (+ teste) | `git mv` → `DiaryPage` e rename de textos | [x] |
| `frontend/src/router.tsx` | import `DiaryPage`, rota `conta`, abas do módulo | [x] |
| `frontend/src/components/layout/AppHeader.tsx` | rename, consumir módulo, gatilho `hidden md:block` no mobile | [x] |
| `frontend/src/components/auth/LoginForm.tsx` (+ teste), `VerifyEmailPage.test.tsx`, `StatsPage.tsx` | textos "Diário" | [x] |
| docs vivos, `.agents/`, `.claude/`, README, AGENTS.md, CLAUDE.md | rename | [x] |
| `frontend/src/navigation/nav-items.ts`, `icons.tsx` (+ testes) | criar | [x] |
| `frontend/src/components/layout/SegmentedNav.tsx`, `SectionLayout.tsx` | criar/evoluir | [x] |
| `frontend/src/navigation/swipe.ts`, `useSwipeTabs.ts`, `SwipeTabsArea.tsx` (+ testes e guarda fs) | criar | [x] |
| `frontend/src/navigation/useHideOnScroll.ts`, `components/layout/BottomNav.tsx` | criar | [x] |
| `frontend/src/context/NewMealModalContext.tsx`, `ThemeContext.tsx`, `ThemeToggle.tsx` | criar/mover | [x] |
| `frontend/src/pages/private/AccountPage.tsx` | criar | [x] |
| `frontend/index.html`, `RootLayout.tsx` | `viewport-fit=cover`, padding inferior | [x] |
| docs: SPEC, ARCHITECTURE, UX_NAVIGATION, CORES, ROADMAP, rules (`.agents` e `.claude`) | atualizar | [x] |

## Escolhas de ícones (Fase 3)

Os três slots da barra inferior (Diário, Progresso, Conta) usam SVGs próprios em `frontend/src/navigation/icons.tsx`, com contorno e versão sólida, só `currentColor`. Diário: caderno (sólido com linhas vazadas); Progresso: barras; Conta: cabeça e ombros. Os destinos só do desktop usam ícones lucide (`activeIcon` igual a `icon`).

## Auditoria final (Fase 6)

### a) Validação

- `npm --prefix frontend run check:colors`: 0 violações. `npm run lint`: 0 erros (1 aviso preexistente em `OnboardingFlow`). `npm run build`: ok. Testes do frontend: ver o resultado final no relatório de entrega. Backend (`npm run test` na Fase 0 e `npm run test:strict` ao final): nada do backend foi tocado.

### b) Greps de segunda via

- "dashboard": zero em `frontend/` e docs vivos. Exceções: `docs/archive/**`, `docs/AGENT_LOG.md`, este arquivo e a nota "antigo Dashboard" em `docs/UX_NAVIGATION.md`.
- Listas de destinos duplicadas: nenhum rótulo "Evolução/Metas/Perfil/Configurações/Progresso/Conta" fora de `navigation/nav-items.ts`, testes e `AccountPage` (que consome o módulo). `DiaryPage` mantém o rótulo "Diário" do navegador de datas (texto de tela, não destino).
- Submenus antigos: o `SectionLayout` foi reescrito sobre `SegmentedNav`; o código do submenu antigo (grid/inline-flex com `shadow-hard-fill`) não existe mais. As classes `shadow-hard-fill*` continuam em uso por botões e modais.
- Hex/rgba soltos e z-index arbitrário em `navigation/` e `components/layout/`: nenhum. A barra inferior usa `z-40` (escala: header z-50, dropdown z-[100], modais z-[200]).
- Toque/ponteiro: `touchstart/touchend/touchcancel` só em `navigation/useSwipeTabs.ts`, no contêiner (não em document/window). Nenhum `onTouch*`/`onPointer*`. Nenhum `preventDefault` em `navigation/`.

### c) Revisão por leitura (360, 390, 768 px)

Feita por leitura do código, sem abrir o navegador (regra do CLAUDE.md):

- Barra inferior: `grid-cols-4` com `min-w-0`, altura `h-14` + `env(safe-area-inset-bottom)`; sem largura fixa. Some em `md` (`md:hidden`).
- Padding do conteúdo: o contêiner raiz recebe `pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0` só quando a barra existe; cobre a barra (3.5rem = `h-14`) sem alterar com a rolagem.
- `SegmentedNav`: `grid-flow-col auto-cols-fr`, abas com `min-w-0`, `truncate` e `min-h-11`; rótulo curto abaixo de `sm`. Sem rolagem horizontal por construção.
- `/conta`: cartão com `truncate` e `min-w-0`; linhas com `flex-1 truncate`.
- Breakpoint 768 px: barra inferior oculta, gatilho do menu da conta e abas do desktop visíveis.

### d) Acessibilidade por código

- Dois landmarks `<nav>` distintos ("Navegação principal" no desktop e "Navegação inferior" no mobile), só um visível por breakpoint (`hidden md:block` / `md:hidden`).
- Foco visível nos slots (`focus-visible:ring-2 ring-ring ring-inset`); alvos de 56 px de altura (`h-14`) e colunas de ≥ 90 px em 360 px.
- Fundo sólido (`bg-background`) quando não há `backdrop-filter` (translucidez só sob `supports-[backdrop-filter]`).
- A barra oculta mantém `pointer-events-none`, mas o foco por Tab a reexibe.

### g) Auditoria do swipe

1. Nenhum listener de toque/ponteiro global além do módulo do swipe; os globais permitidos são só `scroll` em window e `focusin/focusout` em document (`useHideOnScroll`).
2. Arquivos com `recharts` (`StatsPage`, `MeasurementsPage`) têm `data-no-swipe`; não há slider Radix. Teste de guarda `navigation/no-swipe-guard.test.ts` verde.
3. Swipe só ativo via `SectionLayout` (Progresso e Configurações); não há em Diário, `/conta`, Perfil nem na barra inferior.
4. Nenhum `preventDefault` no módulo; listeners passivos.
5. O contêiner usa `ref` + listeners nativos (sem `onTouch*` do React).
6. A `SegmentedNav` funciona sem swipe (testes de `SegmentedNav` e de navegação existentes).

## Revisão N5 (swipe entre destinos da barra inferior)

O usuário corrigiu o prompt original: o swipe deve ser **entre as telas da barra inferior** (Diário ↔ Progresso ↔ Conta), com animação semelhante à do YouTube, e **não** entre abas irmãs.

- **Removido:** `useSwipeTabs`, `SwipeTabsArea`, `PROGRESSO_LEAF_TABS` e o uso em `SectionLayout`. A SegmentedNav continua sendo o único meio de trocar de aba irmã.
- **Novo:** `swipe.ts` (regras puras), `useSwipeNav.ts` (arrasto + animação) e `SwipeMain.tsx` (o `<main>` do `RootLayout`, ativo só com a barra inferior presente e em rotas de um destino da barra).
- **Contradições conscientes com o prompt original:** (1) o gesto horizontal passa a existir no Diário (antes reservado a BL-02; a navegação por dia precisará de outro gesto); (2) há animação de arrasto (antes "sem animação"); (3) o toque agora usa também `touchmove` para arrastar, sempre passivo e sem `preventDefault`.
- **Animação:** o painel interno do `<main>` acompanha o dedo (`translateX` + opacidade), com resistência na ponta da fila; ao confirmar sai em 180 ms, navega e a nova tela entra pelo lado oposto em 220 ms; se não confirmar, volta em 220 ms. `prefers-reduced-motion`: navega direto. Nenhum `transform` permanece fora do gesto.
- **Zonas sem swipe:** continuam valendo `data-no-swipe` (gráficos de Evolução, tabela e date picker de medidas, react-select), campos, sliders, overlays e rolagem horizontal real. Em Evolução, deslizar sobre o gráfico não troca de tela.
- **Auditoria do swipe (substitui o item g):** (1) `touchstart/touchmove/touchend/touchcancel` só em `useSwipeNav.ts`, no `<main>`; (2) arquivos com `recharts` têm `data-no-swipe` (teste de guarda); (3) swipe só em rotas dos 3 destinos, nunca em `/admin` nem páginas legais; (4) nenhum `preventDefault`; (5) sem `onTouch*` do React; (6) a barra inferior funciona sem o swipe (testes do `BottomNav`).

## Revisão: redesign de Evolução e Metas

- **Problema:** quatro controles empilhados com o mesmo peso (barra `[EVOLUÇÃO|METAS]`, barra de sub-abas, cabeçalho repetido e seletor de período) pareciam uma grade 2x2 sem hierarquia.
- **Solução:** nível 2 sublinhado (`SegmentedNav variant="underline"`), filtros como chips no cabeçalho do card (`SegmentedToggle` + `SectionCard`), títulos repetidos `sr-only`, resumos em um card (Alimentação) e em faixa de 4 colunas (Peso e medidas). Metas: foco em 3 colunas e atividade em lista compacta; Metas diárias com calorias em largura total e P/C/G em 3 colunas.
- **Comportamento de Metas diárias (decisão do usuário):** AUTOMÁTICO é só visualização; MANUAL exige Aplicar metas; trocar de modo sem confirmar volta ao salvo/calculado; com meta salva manual, escolher AUTOMÁTICO exige Usar metas automáticas. Isso corrige a divergência anterior entre o código (salvava na hora) e o `docs/UX_NAVIGATION.md`.
- **Sem mudança de API.** Os `data-no-swipe` dos gráficos e da tabela foram mantidos.
- **Divergência de docs (não corrigida aqui):** os caminhos de endpoint de `docs/SPEC.md` (RF-003: `/api/users/goals/active`, `/api/users/goals/preview`, `/api/users/goals`) diferem dos usados pelo frontend (`/users/me/goals`, `/users/me/preview-goals`).
