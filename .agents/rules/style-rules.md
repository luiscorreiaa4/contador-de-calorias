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
  - **Destaque Primário:** `bg-primary`, `text-primary-foreground`, `border-primary` (para botões de ação e indicadores de destaque).
  - **Bordas:** `border-border`.
  - **Ações Destrutivas / Erros:** `bg-destructive`, `text-destructive-foreground`, `border-destructive`.
- **Proibição de `dark:` Redundante:** Não adicione classes com prefixo `dark:` para cores que já possuem tokens semânticos mapeados nas CSS Variables (ex: não usar `bg-background dark:bg-zinc-900` ou `bg-white dark:bg-[#0a0a0a]`). O Tailwind alterna automaticamente os tokens quando a classe `.dark` está ativa na raiz.

## 3. Sombras e Profundidade
- **Sem Sombras Suaves:** É proibido o uso de sombras desfocadas tradicionais (`shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`).
- **Profundidade Brutalista:** Utilizar blocos sólidos de sombra dura:
  - `shadow-hard` ou sombras de deslocamento rígido: `shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]`.

## 4. Tipografia
- **Caixa Alta Obrigatória:** Todos os títulos de páginas, cabeçalhos de seção, botões de ação e labels de formulário DEVEM utilizar a classe `uppercase`.
- **Títulos e Ênfases:** Utilizar `font-heading`, `font-black` (peso 900) e espaçamento estreito (`tracking-tighter`) ou espaçamento expandido para legendas (`tracking-widest`).

## 5. Acessibilidade (WCAG AA) e Interações
- **Associação de Labels:** Todo elemento `<input>`, `<select>` ou `<textarea>` DEVE possuir um `<label>` correspondente com o atributo `htmlFor` associado ao `id` do campo, ou atributo `aria-label` descritivo quando o label visual for oculto.
- **Foco por Teclado:** Elementos interativos devem demarcar claramente o foco para navegação por teclado (`focus:outline-none focus:border-primary` ou anel com contraste visível).
- **Proibição de Diálogos Nativos:** É **terminantemente proibido** utilizar `window.alert()` ou `window.confirm()`. Todas as confirmações e alertas devem utilizar modais acessíveis construídos com Radix UI (com foco preso, tecla `Escape` para fechar e atributo `aria-modal="true"`).
