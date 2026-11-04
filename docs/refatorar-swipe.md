# Refatorar o swipe entre telas (mobile)

> Status: **proposta.** Levantado em 04/11/2026 após testes num iPhone 13 Pro.
> Ponto de partida: a branch `fix/mobile-header-swipe`, com pré-carregamento do código das telas e entrada animada só depois da troca de rota.

## 1. O problema

Ao trocar de tela com o swipe (Diário ↔ Histórico ↔ Conta), aparece por um instante uma tela vazia com o rodapé subindo, e só depois o conteúdo. Parece que o app carrega uma tela errada antes da certa.

Comparação com apps de referência:
- **Instagram:** as telas principais parecem estar sempre prontas. O dedo arrasta a **tela vizinha real**, que já existe e mantém rolagem e estado.
- **YouTube:** quando o conteúdo não está pronto, mostra um indicador de carregamento estável (spinner ou skeleton do tamanho da tela), e a tela aparece de uma vez. Nada pisca nem pula.

## 2. Diagnóstico (causas no código)

| # | Causa | Onde | Efeito visto |
|---|-------|------|--------------|
| C1 | O destino Histórico é `/app/historico`, cujo índice é `<Navigate to="alimentacao">`. A primeira renderização da rota não tem conteúdo; o redirecionamento só acontece no ciclo seguinte. | `router.tsx` (rota `historico`, `index: true`); `nav-items.ts` (`to: '/app/historico'`) | O painel entra animado **vazio** e o conteúdo aparece depois. |
| C2 | A entrada animada dispara na primeira troca de `pathname`, seja ela qual for (inclusive o redirecionamento de C1). | `useSwipeNav.ts` (efeito em `[pathname]`) | Mesmo efeito de C1. |
| C3 | O rodapé (`Footer`) fica no fluxo logo depois do `<main>`. Com a tela nova em carregamento (skeleton curto ou vazio), o `<main>` encolhe e o rodapé sobe para a área visível. | `RootLayout.tsx` (`<Footer />` sempre renderizado) | "Aparece o footer", e a impressão é de outra tela. |
| C4 | Cada troca desmonta a tela anterior e monta a nova do zero, com estado, rolagem e consultas novas. Com o `staleTime` de 5 min (`main.tsx`), a primeira visita sempre busca na rede. | Arquitetura atual (`<Outlet>` renderiza só a rota ativa) | O conteúdo chega em etapas: casca, depois números, depois gráfico. |
| C5 | O gráfico do Histórico é carregado sob demanda por um `lazy()` interno, com seu próprio `Suspense`. | `StatsPage.tsx:7`, `MeasurementsPage.tsx:23` | Um carregamento a mais dentro da tela já aberta. |
| C6 | O swipe move **o mesmo painel**: a tela atual sai, e a nova entra só depois de a rota trocar. O dedo nunca arrasta a tela vizinha de verdade. | `useSwipeNav.ts` | Sensação de "sai, some e volta", em vez de "a outra tela já estava ali". |

## 3. O padrão de referência hoje

Pesquisado em 04/11/2026:

1. **Telas principais mantidas montadas (keep-alive).** É o modelo dos apps nativos (Instagram, e as abas do iOS/Android): cada aba guarda sua árvore, estado e rolagem. No React, isso existe oficialmente desde o 19.2 com `<Activity>` ([docs](https://react.dev/reference/react/Activity)):
   - `mode="hidden"` esconde com `display: none`, **preserva estado e DOM** e desmonta os efeitos.
   - Uma tela escondida desde o início ainda é **pré-renderizada em baixa prioridade**, sem atrasar a tela visível.
   - Ressalva: só dados lidos via Suspense (`use`, `useSuspenseQuery`) são buscados durante a pré-renderização. `useQuery` assina a consulta num efeito, então **não busca enquanto escondido**. Por isso keep-alive precisa andar junto com prefetch de dados (item 2).
   - O projeto usa React 19.2.8, então `<Activity>` já está disponível sem canary.
2. **Prefetch de dados antes da navegação.** O padrão do TanStack Query é chamar `queryClient.prefetchQuery` quando a navegação fica provável (hover, foco ou início de gesto), com `staleTime` compatível, para a tela abrir com cache quente ([exemplo](https://coreui.io/answers/how-to-prefetch-queries-in-react-query/), [integração com rotas](https://smithery.ai/skills/MadAppGang/router-query-integration)).
3. **Pager com a tela vizinha real.** Durante o arrasto, a tela atual e a vizinha ficam lado a lado numa "trilha", e as duas acompanham o dedo (`transform` no compositor, sem layout). Ao soltar, a trilha termina o movimento e a URL é atualizada.
4. **Carregamento estável quando não há cache.** É o modelo do YouTube: um skeleton com a **altura da tela** ou um spinner centralizado, nunca uma área vazia que deixa o layout pular.
5. **View Transitions (para toques, não para o arrasto).** O React tem `<ViewTransition>` e `addTransitionType` ([docs](https://react.dev/reference/react/ViewTransition), [addTransitionType](https://react.dev/reference/react/addTransitionType)), que anima trocas feitas com `startTransition`. Há um protótipo de swipe com `startGestureTransition` ([PR #32792](https://github.com/facebook/react/pull/32792/files)), mas ainda é **Canary/experimental**. O Safari suporta View Transitions no mesmo documento desde a versão 18 ([Chrome docs, tabela de suporte](https://developer.chrome.com/docs/web-platform/view-transitions?hl=es-419)). Serve para animar o toque na barra inferior. Para um arrasto que acompanha o dedo, ainda não é estável.

## 4. Solução recomendada

São três fases. Cada uma pode virar um PR e entrega valor sozinha.

### Fase 1: acabar com o efeito feio (pequena, baixo risco)

1. **Destino final sem redirecionamento (C1, C2).** O swipe (e o toque na barra inferior) vai direto para a última aba vista da seção, ou para a primeira (`HISTORICO_TABS[0].to`). Implementação: um campo `swipeTo`/`landingTo` em `nav-items.ts`, ou `to: '/app/historico/alimentacao'` mantendo os `patterns`. Assim não sobra nenhuma renderização vazia.
2. **A entrada espera conteúdo de verdade (C2).** Além da troca de `pathname`, só animar quando o destino estiver ativo (`isDestinationActive`) e não houver `Suspense` pendente. O teto de 1,5 s continua.
3. **O rodapé não aparece no app mobile (C3).** Com a barra inferior presente (`showBottomNav`), esconder o `Footer` abaixo de `md`, como no Instagram, que não tem rodapé. Os links de Termos, Privacidade e Segurança passam para a tela **Conta** (hoje ela não tem esses links). Também dar ao `<main>` do app uma altura mínima de tela útil (`min-h-[calc(100dvh-…)]`), para que nenhum estado de carregamento encolha a página.
4. **Carregamento com altura estável (C3, C4).** Os skeletons do Diário e do Histórico passam a ocupar a altura da tela final (cards e lista nas posições reais), no estilo do YouTube. O fallback global do `Suspense` em `RootLayout` passa a usar a mesma altura mínima.
5. **Prefetch de dados no gesto (C4).** Quando o arrasto passa de `pending` para `dragging`, o destino já é conhecido. Nesse momento, chamar `queryClient.prefetchQuery` com as consultas principais do destino, usando as funções de `src/services/` como manda `react-rules.md`. Fazer o mesmo no `touchstart` dos links da barra inferior. Exemplo para o Diário: `['todayMeals', hoje]` e `['active-goal', hoje]`. As chaves ficam centralizadas num mapa `prefetchFor(destino)` ao lado de `nav-items.ts`, para não se espalharem.
6. **Gráfico sem segundo carregamento (C5).** Incluir os chunks dos gráficos em `preloadBottomNavPages()`.

**Critério de aceite:** com a rede em "Fast 3G" no DevTools e o cache vazio, o swipe nunca mostra área vazia nem o rodapé. Mostra o skeleton com a altura da tela e depois o conteúdo.

### Fase 2: padrão ouro, telas vivas (média)

1. **Shell de abas com `<Activity>` (C4, C6).** Um componente `BottomNavTabs` substitui o `<Outlet>` nas rotas dos três destinos. Ele renderiza os três sempre, cada um em `<Activity mode={ativo ? 'visible' : 'hidden'}>`, e cada aba guarda a última sub-rota vista (ex.: `/app/historico/corpo`), renderizada com `<Routes location={ultimaLocalizacaoDaAba}>`. As URLs continuam iguais, então favoritos, voltar e PWA funcionam como hoje.
2. **Rolagem por aba.** O `<Activity>` preserva o DOM, mas a rolagem é da janela. Guardar `window.scrollY` por aba ao sair e restaurar ao entrar, antes de pintar (`useLayoutEffect`).
3. **Pager com a vizinha real (C6).** No início do arrasto, a tela vizinha sai de `hidden` para visível, posicionada ao lado (`position: absolute`, `translateX(±100%)`), e a trilha inteira acompanha o dedo. Ao soltar, a trilha termina o movimento, a URL troca (`navigate(to, { replace: false })`) e as abas voltam a `hidden`/`visible`. Sem fade e sem tela vazia: a vizinha já está pronta.
4. **Dados das abas escondidas.** Como `useQuery` não busca com a aba escondida, manter o prefetch da Fase 1 (no início do app e no gesto). Ao voltar a ficar visível, o `useQuery` reassina e revalida se o dado estiver velho. Migrar para `useSuspenseQuery` é opcional e só vale se quisermos que a pré-renderização também busque dados.
5. **Cuidados:**
   - Efeitos das abas escondidas são desmontados. O que for visual e precisar parar ao esconder (timers, animações) deve limpar em `useLayoutEffect`, como recomendam as docs do `<Activity>`.
   - A barra que some e o cabeçalho (`useHideOnScroll`) leem a rolagem da janela. Ao trocar de aba, restaurar a rolagem **antes** de reexibir as barras, para elas não piscarem.
   - Memória: três telas montadas é pouco. Não estender o keep-alive para Metas, Configurações etc.
   - Acessibilidade: `display: none` já tira as abas escondidas da árvore de acessibilidade. Mover o foco para o `<h1>` da aba ao trocar.

**Critério de aceite:** voltar para uma aba já visitada mostra o conteúdo instantaneamente, na mesma posição de rolagem. Durante o arrasto, a tela vizinha aparece com conteúdo, acompanhando o dedo.

### Fase 3, opcional: View Transitions no toque

Quando `<ViewTransition>` estiver estável na versão do React do projeto, usar a API no **toque** da barra inferior (deslizar para a esquerda ou direita conforme a posição do destino, com `addTransitionType('nav-forward' | 'nav-back')`), respeitando `prefers-reduced-motion`. Não usar para o arrasto até `startGestureTransition` sair do Canary.

## 5. Alternativas descartadas

- **Pager por CSS (`scroll-snap` horizontal com três telas):** dá inércia nativa, mas obriga cada tela a ter rolagem vertical própria (deixa de ser a janela). Isso quebra `useHideOnScroll`, o "tocar na hora para subir" do iOS e o swipe sobre gráficos, que passaria a mover a trilha.
- **Bibliotecas de carrossel (Swiper, Embla etc.):** acrescentam dependência e trazem o mesmo problema de rolagem por tela. O projeto já tem o gesto e as proteções (`swipe.ts`), e falta só a trilha.
- **Esconder o problema com fade mais longo:** mascara C1 a C4 sem resolver e deixa o swipe mais lento.
- **Esperar os dados antes de navegar (`ensureQueryData` bloqueante):** sem cache, o dedo solta e nada acontece até a rede responder. É pior do que um skeleton estável.

## 6. Arquivos afetados (previsão)

| Fase | Arquivos |
|------|----------|
| 1 | `navigation/nav-items.ts`, `navigation/useSwipeNav.ts`, `navigation/page-loaders.ts`, novo `navigation/prefetch.ts`, `components/layout/RootLayout.tsx`, `components/layout/BottomNav.tsx`, `pages/private/AccountPage.tsx` (links legais), skeletons do Diário e do Histórico |
| 2 | novo `navigation/BottomNavTabs.tsx`, `router.tsx` (rotas dos três destinos sob o shell), `navigation/useSwipeNav.ts` (trilha com a vizinha), `navigation/SwipeMain.tsx` |
| 3 | `BottomNav.tsx`, CSS das transições em `styles/index.css` |

Regras a respeitar em todas as fases: `react-rules.md` seção 7 (sem `onTouch*` do React, sem `preventDefault`, `data-no-swipe` nos gráficos, `transform` só durante o gesto, `prefers-reduced-motion`), e prefetch só por funções de `src/services/`.

## 7. Como validar

- **Testes (Vitest/RTL):**
  - O swipe para Histórico chega direto em `/app/historico/alimentacao`, sem renderizar o `<Navigate>`.
  - O rodapé não aparece com a barra inferior abaixo de `md`.
  - O prefetch é chamado ao entrar em `dragging`.
  - Fase 2: o estado de um campo do Diário sobrevive à ida e à volta pelo Histórico, e a rolagem de cada aba é restaurada.
- **Manual (iPhone, PWA e Safari):** rede lenta e cache vazio; swipe rápido repetido entre as três telas; voltar pelo gesto do sistema; temas claro e escuro.

## Prompt (Fase 1)

```
Implemente a Fase 1 de docs/refatorar-swipe.md, sobre a branch fix/mobile-header-swipe:
1. Swipe e barra inferior vão direto ao destino final (sem <Navigate> intermediário em /app/historico).
2. A entrada animada só ocorre com o destino ativo e o conteúdo renderizado (manter o teto de 1,5 s).
3. Com a barra inferior, esconder o Footer abaixo de md e levar os links legais para a tela Conta; <main> com altura mínima da tela útil.
4. Skeletons do Diário e do Histórico com a altura da tela final; fallback do Suspense com a mesma altura.
5. Prefetch das consultas principais do destino ao entrar em "dragging" e no touchstart da barra inferior, via src/services.
6. Incluir os chunks dos gráficos no preloadBottomNavPages.
Testes Vitest/RTL para cada item; rode lint e npm run test:full.
```
