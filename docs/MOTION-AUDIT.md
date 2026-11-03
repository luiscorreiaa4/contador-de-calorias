# Auditoria de Motion — Frontend CalorieSync

> Gerado com a skill `design-motion-principles` (modo audit) em 2026-11-03. **Nenhum código foi alterado.**
> Escopo: estados de carregamento, entrada/saída de modais e listas, feedback de ações (salvar e apagar refeição), transições entre páginas e `prefers-reduced-motion`.

## Contexto e pesos

- **Tipo de projeto:** PWA mobile-first de registro alimentar com estética brutalista (bordas retas, sombras duras, caixa alta). É usado **várias vezes por dia**: abrir o Diário, abrir "Nova refeição", buscar alimento, salvar. Esse é o núcleo da frequência.
- **Stack de motion:** só CSS e Tailwind. Não há framer-motion nem `tailwindcss-animate`. O swipe entre destinos usa transições inline em JS (`navigation/useSwipeNav.ts`).
- **Pesos das lentes** (segundo o critério do usuário: ação frequente = pouca animação):

| Lente | Peso | Por quê |
|---|---|---|
| **Emil Kowalski** (restrição e velocidade) | **Primária** | O fluxo de registro é diário e repetitivo. A primeira pergunta é "isto deveria animar?" |
| **Jakub Krehel** (polimento de produção) | Secundária | Onde houver motion (confirmações, swipe, feedback), ela deve ser sutil e sem defeito |
| **Jhey Tompkins** (experimentação) | Seletiva | Só em momentos raros: estado vazio, meta diária atingida, onboarding |

### Classificação de frequência das interações

| Interação | Frequência | Orçamento de motion |
|---|---|---|
| Abrir/fechar "Nova refeição", buscar alimento, salvar | **Alta** (várias/dia) | Nenhuma, ou ≤150 ms só de opacidade |
| Trocar data, navegar Diário ↔ Histórico ↔ Conta | Alta | Instantâneo; swipe só durante o gesto |
| Apagar refeição (com confirmação) | Ocasional | ≤150 ms de opacidade no diálogo; saída instantânea |
| Alternar tema, login, onboarding, 404 | Rara | Livre, dentro do estilo brutalista |

---

## Avaliação geral

O app está **perto do ideal para um uso de alta frequência, mas mais por acaso do que por intenção**. O modal de Nova Refeição abre e fecha instantaneamente, a navegação por rota não anima e o swipe é curto (180/220 ms) e respeita movimento reduzido. Isso está certo.

Há três problemas:

1. **Animações declaradas que não existem.** `.animate-in` aponta para `@keyframes fadeIn`, que o Tailwind não emite (confirmado no CSS de produção). Diálogos e cartões que "deveriam" aparecer com fade aparecem secos.
2. **Barras de progresso animam `width` por 500 ms** a cada refeição salva e a cada troca de data. É a animação mais vista do app, e está no pior formato possível.
3. **Salvar uma refeição não tem nenhum feedback próprio**, nem visual nem para leitor de tela. O modal some e a lista muda em silêncio.

---

## Onde as durações caem

| # | Animação | Duração · easing | Faixa | Frequência | Veredito |
|---|---|---|---|---|---|
| 1 | Modal Nova Refeição (abrir/fechar) | 0 ms | instantâneo | alta | ✓ correto |
| 2 | Navegação por rota (clique/BottomNav) | 0 ms | instantâneo | alta | ✓ correto |
| 3 | Swipe: saída / entrada | 180 ms `ease-in` / 220 ms `ease-out` | responsivo | alta | ✓ bom (easing pode melhorar) |
| 4 | **Barras de progresso de macros** | **500 ms `ease` (padrão), propriedade `width`** | deliberado | alta | ✗ **crítico** |
| 5 | BottomNav esconder/mostrar no scroll | 300 ms `ease-out` | limite | alta | ~ encurtar |
| 6 | ConfirmDialog (apagar) | declarado 400 ms, **real 0 ms** (keyframe inexistente) | — | ocasional | ✗ código morto |
| 7 | DatePicker popover | declarado `fade-in zoom-in-95 duration-150`, **real 0 ms** | — | alta | ✗ código morto |
| 8 | Hover em botões primários (`-translate-y-0.5` + sombra) | 150 ms `cubic-bezier(.4,0,.2,1)` | responsivo | alta | ~ ver I-2 |
| 9 | Troca de tema (body, layout, header) | 300 ms | deliberado | rara | ✓ aceitável |
| 10 | Loaders `animate-pulse` / `animate-spin` | 2 s / 1 s em loop | — | alta | ~ ver I-3 |

---

## Achados priorizados

### 🔴 Crítico (corrigir primeiro)

#### C-1 · Barras de progresso animam `width` por 500 ms, no Diário

- **O quê:** as quatro barras (kcal, proteína, carboidrato, gordura) usam `transition-all duration-500` sobre `style={{ width }}`. Toda refeição salva ou apagada e toda troca de data dispara 4 transições de layout simultâneas de meio segundo.
- **Por que importa:** `width` força reflow a cada frame (não usa GPU). 500 ms está acima do orçamento de 300 ms para uma tela vista várias vezes ao dia. `transition-all` ainda arrasta cor e borda junto. Ao trocar de data, as barras "correm" para valores de outro dia, o que sugere uma mudança que não ocorreu.
- **Sugestão (Emil):** usar `transform: scaleX(ratio)` com `origin-left`, `transition-transform duration-200 ease-out`, ou nenhuma transição ao trocar de data, animando só quando o valor muda no mesmo dia. Nunca `transition-all`.
- **Local:** `frontend/src/pages/private/DiaryPage.tsx:280`, `:312`, `:340`, `:368`

#### C-2 · `.animate-in` não anima nada: os keyframes `fadeIn` não chegam ao CSS

- **O quê:** `index.css:161-163` define `.animate-in { animation: fadeIn 0.4s … }`, mas `@keyframes fadeIn` só existe em `tailwind.config.js:70` e o Tailwind só o emite se `animate-fade-in` for usado em algum lugar, o que não acontece. Verificado no `dist/assets/*.css`: só existem `@keyframes pulse` e `spin`. O mesmo vale para `slideUp`/`animate-slide-up` (definidos e nunca usados).
- **Por que importa:** ConfirmDialog, AuthCard, AuthPageShell, NotFound e o aviso de sucesso do AuthCard *declaram* uma entrada de 400 ms (longa demais pelo critério de Emil) e na prática aparecem secos. É motion "fantasma": quem lê o código acha que há animação, e corrigir o build de repente ativaria 400 ms em todos esses lugares.
- **Sugestão:** decidir explicitamente. **(a)** Remover `.animate-in`, `animate-fade-in`, `animate-slide-up` e os keyframes (instantâneo, coerente com o brutalismo); ou **(b)** mover `@keyframes fadeIn` para `index.css` e reduzir para `150ms ease-out`, só opacidade, e usar apenas em ConfirmDialog e nas telas de auth (raras).
- **Local:** `frontend/src/styles/index.css:161`, `frontend/tailwind.config.js:66-80`, `components/common/ConfirmDialog.tsx:108`, `components/auth/AuthCard.tsx:70,133`, `components/auth/AuthPageShell.tsx:12`, `pages/public/NotFoundPage.tsx:9`

### 🟡 Importante (deveria corrigir)

#### I-1 · Salvar refeição não dá feedback (nem para leitor de tela)

- **O quê:** em `createMealMutation.onSuccess` e `updateMealMutation.onSuccess`, o modal só fecha (`onClose()`). O Diário reaparece com um cartão a mais, sem confirmação. Apagar também tira o cartão sem aviso. O Diário já tem um slot `role="status"` (`copyFeedback`) usado só para "copiar refeição".
- **Por que importa:** é a ação mais importante do app e a única sem confirmação. Usuários de leitor de tela não recebem anúncio nenhum. Visualmente, o único sinal é a barra de progresso andando (C-1).
- **Sugestão (Emil + Jakub):** sem animação de movimento. Reaproveitar o slot `role="status"` existente para anunciar "REFEIÇÃO SALVA" / "REFEIÇÃO APAGADA", com texto estático que some depois de alguns segundos. Opcionalmente, destacar o cartão recém-criado com uma borda `border-foreground` por ~1 s, sem movimento, só troca de cor.
- **Local:** `components/meals/NewMealModal.tsx:109-113`, `:121-125`; `pages/private/DiaryPage.tsx:82-84`, `:430`

#### I-2 · Hover com "levantar" (`-translate-y-0.5`) e `transition-all` em botões de uso frequente

- **O quê:** a variante primária do `Button` e 6 outros CTAs sobem 2 px e crescem a sombra no hover. Há 22 usos de `transition-all` em componentes, incluindo botões de modo do NewMealModal, FoodQuantityForm e o rodapé "Salvar".
- **Por que importa:** no celular (uso principal), o `:hover` "gruda" depois do toque, e o botão fica levantado até tocar em outro lugar. `transition-all` anima qualquer propriedade que mude (borda, padding, cor), o que é imprevisível e caro. Num app brutalista, o feedback de pressionar (`active:translate-x-px translate-y-px`, já usado no NewMealModal) é mais fiel ao estilo que o levantar.
- **Sugestão (Emil):** ativar `future: { hoverOnlyWhenSupported: true }` no `tailwind.config.js` (Tailwind 3.4), para o hover só valer em dispositivos com mouse. Trocar `transition-all` por `transition-[transform,box-shadow,background-color]` ou `transition-colors`. Manter o `active:` de afundar como feedback de toque.
- **Local:** `components/ui/button.tsx:8,13`; `components/meals/NewMealModal.tsx:673-720`; `components/meals/MealModalFooter.tsx:47`; `components/meals/FoodQuantityForm.tsx:102,116,197`; `pages/private/DiaryPage.tsx:399,492`

#### I-3 · Carregamento por pulsar infinito e spinner sem texto

- **O quê:** "CARREGANDO REFEIÇÕES..." (Diário), Estatísticas, Medidas e AdminRoute pulsam em loop (`animate-pulse`, 2 s infinito). O badge "Atualizando..." do catálogo admin pulsa **e** gira um ícone. O fallback do `Suspense` (troca de página lazy) é **só um quadrado girando**, sem texto e sem `role="status"`.
- **Por que importa:** o pulso infinito é o padrão "pulsing indicator" da lista de anti-padrões. Num texto que já diz "CARREGANDO", ele não acrescenta informação. Pior: com `prefers-reduced-motion`, a regra global corta animações para 1 iteração de 0,01 ms. O spinner do Suspense vira um quadrado estático com uma borda diferente, ou seja, **nenhum indicador de carregamento**, e o leitor de tela também não recebe nada.
- **Sugestão (Emil):** texto estático em caixa alta (o próprio estilo brutalista já comunica), sem pulso. Se o carregamento costuma durar <300 ms, mostrar o texto só depois de ~300 ms, para evitar o "pisca". No `Suspense`, usar `<p role="status">CARREGANDO...</p>` com o spinner `aria-hidden`. No admin, escolher um só sinal (spinner **ou** pulso, não os dois).
- **Local:** `components/layout/RootLayout.tsx:60-63`; `pages/private/DiaryPage.tsx:443`; `pages/private/StatsPage.tsx:128`; `pages/private/MeasurementsPage.tsx:235`; `components/AdminRoute.tsx:27`; `pages/admin/AdminCatalogPage.tsx:456`

#### I-4 · DatePicker declara animação de uma biblioteca que não está instalada

- **O quê:** o popover usa `animate-in fade-in zoom-in-95 duration-150`. `fade-in` e `zoom-in-95` são classes do `tailwindcss-animate` (não instalado), `duration-150` é `transition-duration` (não afeta `animation`), e `animate-in` cai no keyframe inexistente de C-2. Resultado real: instantâneo.
- **Por que importa:** trocar a data no Diário é frequente, então instantâneo é o comportamento **certo**. O problema é o código prometer outra coisa (e um `zoom` de 95% → 100% vindo do centro, não do gatilho, se um dia passar a funcionar).
- **Sugestão (Emil):** remover as quatro classes. Se quiser algo, só `opacity` em 100 ms com `transform-origin` no canto do gatilho.
- **Local:** `components/common/DatePickerInput.tsx:220`

### 🟢 Oportunidades (pode melhorar)

| # | Melhoria | Onde | Impacto |
|---|---|---|---|
| O-1 | BottomNav esconde/mostra em 300 ms: encurtar para 200 ms `ease-out` (mostrar pode ser ainda mais rápido que esconder) | `components/layout/BottomNav.tsx:44` | Barra volta mais rápido ao rolar para cima |
| O-2 | Swipe: trocar `ease-in`/`ease-out` nativos por curvas próprias, ex.: saída `cubic-bezier(.4,0,1,1)` e entrada `cubic-bezier(.16,1,.3,1)` (a mesma curva já escrita em `.animate-in`) | `navigation/useSwipeNav.ts:77,93,101` | Gesto mais "colado" ao dedo |
| O-3 | Unificar a transição de tema: `body`, `RootLayout` e `AppHeader` repetem `transition-colors duration-300`; basta no `body` | `styles/index.css:134`, `RootLayout.tsx:31`, `AppHeader.tsx:78` | Menos trabalho na troca de tema |
| O-4 | **Meta diária atingida** (momento raro, ≤1×/dia): um único destaque brutalista, ex.: a barra de kcal preenche e o rótulo troca para "META BATIDA" com um "carimbo" de 200 ms, respeitando movimento reduzido | `pages/private/DiaryPage.tsx` (barras) | Único lugar onde a lente Jhey cabe |
| O-5 | Estado vazio do Diário ("NENHUMA REFEIÇÃO…"): é estático, o que está certo; uma ilustração estática com sombra dura basta, sem loop | `pages/private/DiaryPage.tsx` | Personalidade sem custo de frequência |
| O-6 | Remover os keyframes `slideUp`/`animate-slide-up`, que nunca são usados | `tailwind.config.js:66-80` | Menos código morto |

---

## Perspectivas por lente

### Emil Kowalski — Restrição e Velocidade (primária)

**Funciona bem**
- ✓ Modal Nova Refeição sem animação de entrada/saída: é a ação mais repetida do app (`NewMealModal.tsx:551`).
- ✓ Navegação entre rotas instantânea; o swipe só anima *durante* o gesto e dura 180/220 ms (`swipe.ts:22-23`).
- ✓ Apagar uma refeição tira o cartão instantaneamente. Para uma lista de uso diário isso é melhor que uma animação de saída.
- ✓ Feedback de pressionar (`active:translate-*-px`) nos botões de modo do modal, em vez de hover.
- ✓ Interações de teclado (foco, Esc) não disparam animação.

**Problemas:** C-1, C-2, I-2, I-3, I-4.

**Pela lente de Emil:** o app já faz o mais difícil, que é não animar o fluxo principal. Falta tirar as sobras: barras de 500 ms, pulsos infinitos, hover que gruda e classes de animação que não fazem nada.

### Jakub Krehel — Polimento de Produção (secundária)

**Funciona bem**
- ✓ Swipe com entrada pelo lado oposto à saída e `opacity` + `translateX` só durante o gesto, sem `transform` permanente no painel.
- ✓ ConfirmDialog e NewMealModal com `role="dialog"`, `aria-modal` e foco preso; a estrutura está pronta para uma entrada sutil, se for desejada.

**Problemas:** C-2 (intenção de polimento que nunca chegou ao build), I-1 (falta de confirmação ao salvar).

**Pela lente de Jakub:** o polimento aqui não é acrescentar movimento, é fechar o ciclo da ação, porque salvar precisa de uma confirmação perceptível e anunciada. Onde houver entrada (ConfirmDialog), ela deve ser de 150 ms, só opacidade, e a saída mais discreta ainda (instantânea).

### Jhey Tompkins — Experimentação e Prazer (seletiva)

**Funciona bem**
- ✓ Nenhum efeito decorativo em telas frequentes; a identidade vem da tipografia e das sombras duras, não do movimento.

**Oportunidades:** O-4 (meta batida), O-5 (estado vazio).

**Pela lente de Jhey:** o único lugar com licença para brincar é o momento que acontece no máximo uma vez por dia, quando a meta é atingida. Um "carimbo" brutalista seco, nunca confete.

---

## `prefers-reduced-motion`

| Item | Situação |
|---|---|
| Regra global em `styles/index.css:182-190` (anima e transiciona em 0,01 ms, 1 iteração, `scroll-behavior: auto`) | ✓ Cobre todo o CSS |
| Swipe (`useSwipeNav.ts:71,85` via `prefersReducedMotion()`) | ✓ Pula as animações de JS e navega direto |
| Barras de progresso, BottomNav e hover | ✓ Cobertos pela regra global |
| **Loaders que dependem só de motion** (spinner do `Suspense`, spinners isolados) | ✗ Com movimento reduzido, viram ícones estáticos sem significado. Ver I-3: todo loader precisa de texto e `role="status"` |
| Teste automatizado | ~ Não há teste que confirme a regra global; o swipe tem cobertura em `useSwipeNav.test.tsx` |

**Recomendação:** manter a regra global (é a rede de segurança certa) e garantir que **nenhuma informação dependa só de movimento**, o que hoje falha apenas nos loaders.

---

## Ordem sugerida de execução

1. **C-1** barras → `scaleX` 200 ms (ou sem transição ao trocar de data).
2. **C-2 + I-4 + O-6** decidir o destino de `.animate-in` e remover as classes mortas (uma mudança só).
3. **I-3** loaders com texto e `role="status"`, sem pulso.
4. **I-1** anúncio "REFEIÇÃO SALVA/APAGADA" no slot `role="status"` existente.
5. **I-2** `hoverOnlyWhenSupported` + trocar `transition-all`.
6. Oportunidades conforme houver tempo.

## Referência das lentes

- **Mais consultada:** Emil. A regra de frequência decidiu quase todos os achados, porque o app vive de ações repetidas.
- **Para pender a Jakub:** se o CalorieSync virar um app de consumo mais "macio", aceitar entradas de 200–250 ms em diálogos raros.
- **Para pender a Jhey:** só no onboarding e em conquistas (meta batida, sequência de dias); nunca no fluxo de registro.

---

## Reauditoria — 2026-11-03 (depois das correções)

| # | Item | Antes | Depois |
|---|---|---|---|
| C-1 | Barras de macros do Diário | `transition-all` 500 ms em `width` | `transform: scaleX` 200 ms `ease-out`, sem reflow |
| C-2 | `.animate-in` | keyframe `fadeIn` ausente do CSS: 0 ms real, 400 ms declarados | `motion-fade-in` 150 ms em `index.css` (sempre emitido); `.animate-out` 150 ms e `.animate-rise` 200 ms novos; `fade-in`/`slide-up` mortos removidos do `tailwind.config.js` |
| I-1 | Feedback ao salvar/apagar refeição | nenhum | toast `role="status"` ("REFEIÇÃO SALVA." / "REFEIÇÃO APAGADA."); erro em `role="alert"` |
| I-3 | Loaders | pulso infinito no Diário/Histórico; `Suspense` só com quadrado girando | skeletons estáticos no formato do conteúdo (números do painel, cards de refeição, linhas da busca, gráficos) com `role="status"`; `Suspense` com texto |
| I-4 | DatePicker | classes de animação inexistentes | removidas: abre instantâneo (ação frequente) |
| — | Modais (Nova refeição, ConfirmDialog) | 0 ms | entrada 150 ms, saída 150 ms (`usePresence`), só opacidade |
| — | Cards de refeição | sem entrada/saída | entrada 200 ms só no card otimista; saída 150 ms ao apagar |
| — | Gráficos (recharts) | animação padrão 1,5 s; recharts no chunk da página | 250 ms, desligada com movimento reduzido; carregado por `React.lazy` com skeleton da mesma altura |
| — | Busca de alimentos | `transition-colors` nas opções e indicador animado do react-select | sem transição nem indicador; skeleton de linhas no menu |

**Ainda em aberto (não pedidos nesta rodada):** I-2 (hover que "levanta" e 18 usos de `transition-all`), O-1 (BottomNav 300 ms), O-3 (transição de tema repetida), pulsos no admin (`AdminRoute`, badge e linhas do catálogo; tela rara).

**`prefers-reduced-motion`:** a regra global cobre todo o CSS novo; `usePresence`, o toast e a exclusão otimista desmontam sem esperar; o recharts recebe `isAnimationActive={false}`. Nenhum loader depende só de movimento: todos têm texto.

**Barra de progresso para operações longas:** não há upload nem importação no frontend (a importação de catálogo é só por CLI), então não foi criada. Botões de envio já mostram estado de carregamento e ficam desativados durante a requisição.
