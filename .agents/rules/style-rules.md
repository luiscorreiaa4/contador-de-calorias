---
trigger: model_decision
description: Regras obrigatórias e verificáveis de UI, identidade brutalista, tokens de estilo e acessibilidade
---

# Regras de Estilo, UI e Acessibilidade (Identidade Brutalista)

## 1. Identidade Geométrica (Zero Arredondamento)
- **Proibição Estrita de Bordas Arredondadas:** É **terminantemente proibido** utilizar classes utilitárias de arredondamento como `rounded`, `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl` ou `rounded-full`.
- **Classe Única Permitida:** Todo componente, botão, input, card, modal, badge ou container DEVE utilizar explicitamente `rounded-none` ou omitir a classe de raio se o reset global já aplicar borda reta.
- **Divisórias e Bordas:** Utilizar contornos firmes e divisórias sólidas com `border-2 border-border`.

## 2. Design Tokens e Cores (Modo Claro / Escuro)
O tema claro/escuro é gerenciado **estritamente através de variáveis CSS** definidas em `src/styles/index.css`.
- **PROIBIÇÃO DE CORES FIXAS E LITERAIS:**
  - É proibido usar cores literais do Tailwind, como `bg-white`, `bg-black`, `text-black`, `text-white`, `bg-zinc-*`, `text-zinc-*`, `border-zinc-*` ou cores de outras paletas (ex: `border-emerald-500`).
  - É proibido utilizar valores hexadecimais arbitrários inline (ex: `bg-[#0a0a0a]`).
- **USO OBRIGATÓRIO DOS TOKENS SEMÂNTICOS:**
  - **Superfícies:** `bg-background` (fundo principal), `bg-card` (cartões e modais), `bg-secondary` (blocos de apoio e tags).
  - **Tipografia:** `text-foreground` (texto padrão de alto contraste), `text-muted-foreground` (textos secundários, legendas e placeholders).
  - **Preenchimento Neon (`bg-primary`):** Uso exclusivo para áreas/superfícies (botões, badges, progresso), acompanhado de `text-primary-foreground` e `border-2 border-black`.
  - **Tinta Neon / Verde (`text-primary-ink`):** Uso obrigatório para textos, ícones lineares, outlines e traços de gráficos sobre fundos (`#4D6600` no claro, `#CCFF00` no escuro). Proibido usar `text-primary` solto.
  - **Bordas e Foco:** `border-border` para estrutura; `border-ring` ou `ring-ring` para foco.
  - **Ações Destrutivas / Erros:** `bg-destructive`, `text-destructive-foreground`, `border-destructive`.
  - **Avisos e Favoritos:** `bg-warning`, `text-warning`, `text-warning-foreground`.
- **Proibição de `dark:` Redundante:** Não adicione classes com prefixo `dark:` para cores que já possuem tokens semânticos mapeados nas CSS Variables. O Tailwind alterna automaticamente os tokens quando a classe `.dark` está ativa na raiz.
- **Validação de Cores (`check:colors`):** O script `npm --prefix frontend run check:colors` (integrado a `npm run lint`) valida a ausência de literais, classes `dark:` de cor e classes proibidas. Exceções pontuais justificadas devem conter o comentário `color-guard-allow: <motivo>` na mesma linha ou na anterior.

## 3. Sombras e Profundidade
- **Sem Sombras Suaves:** É proibido o uso de sombras desfocadas tradicionais (`shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`).
- **Profundidade Brutalista:** Utilizar tokens de sombra dura:
  - `shadow-hard` e `shadow-hard-hover` para cards e superfícies padrão.
  - `shadow-hard-fill` e `shadow-hard-fill-hover` para elementos com fundo verde neon (`bg-primary`).
  - Proibido o uso de sombras arbitrárias `shadow-[...]`.

## 4. Tipografia
- **Caixa Alta Obrigatória:** Todos os títulos de páginas, cabeçalhos de seção, botões de ação e labels de formulário DEVEM utilizar a classe `uppercase`.
- **Títulos e Ênfases:** Utilizar `font-heading`, `font-black` (peso 900) e espaçamento estreito (`tracking-tighter`) ou espaçamento expandido para legendas (`tracking-widest`).

## 5. Acessibilidade (WCAG AA) e Interações
- **Associação de Labels:** Todo elemento `<input>`, `<select>` ou `<textarea>` DEVE possuir um `<label>` correspondente com o atributo `htmlFor` associado ao `id` do campo, ou atributo `aria-label` descritivo quando o label visual for oculto.
- **Foco por Teclado:** Elementos interativos devem demarcar claramente o foco para navegação por teclado (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background` ou `focus:border-ring`).
- **Proibição de Diálogos Nativos:** É **terminantemente proibido** utilizar `window.alert()` ou `window.confirm()`. Todas as confirmações e alertas devem utilizar modais acessíveis construídos com Radix UI (com foco preso, tecla `Escape` para fechar e atributo `aria-modal="true"`).
