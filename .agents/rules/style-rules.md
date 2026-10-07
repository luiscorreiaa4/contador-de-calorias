---
trigger: model_decision
description: Sempre que criar, alterar ou estilizar componentes e páginas no frontend
---

# Regras de Estilo e UI (Identidade Brutalista)

## Identidade Visual Principal (Brutalismo de Alta Performance)
O projeto utiliza um design inspirado no brutalismo digital moderno, focado em alta performance atlética. O visual deve ser "agressivo", com alto contraste e sem adornos fofos.
- **Geometria:** PROIBIDO arredondamentos. Use sempre bordas retas (`rounded-none`).
- **Bordas e Linhas:** Abuso de divisórias e contornos fortes (`border-2 border-border`).
- **Sombras:** Não use sombras suaves (`shadow-sm`, `shadow-lg`). Use sempre `shadow-hard` para criar profundidade em blocos sólidos.
- **Tipografia:**
  - Títulos e Textos de Destaque: Devem usar `font-heading`, `font-black` (peso 900), `uppercase` e letter-spacing apertado (`tracking-tighter` ou largo `tracking-widest` para subtítulos menores).
  - Títulos, botões e labels devem ser sempre em MAIÚSCULAS (`uppercase`).
- **Zero Decoração:** Sem gradientes, sem glows, sem opacidades delicadas. Tudo deve ser sólido e legível.

## Uso do Tailwind CSS e Design Tokens (Modo Claro/Escuro)
O projeto suporta Light/Dark Mode **através de CSS Variables**, o que significa que o modo escuro altera as variáveis no arquivo `index.css`.
- **NUNCA USE CORES FIXAS** (como `bg-white`, `bg-zinc-900`, `text-zinc-500`, `dark:bg-black`). 
- **USE SEMPRE OS TOKENS PADRONIZADOS:**
  - Fundos: `bg-background` (fundo geral da tela) e `bg-card` (fundo de containers e cartões).
  - Textos: `text-foreground` (texto principal) e `text-muted-foreground` (texto secundário/labels).
  - Destaque/Neon: `bg-primary` (para botões primários, ícones de atenção) e `text-primary-foreground` (texto que vai em cima da cor primária).
  - Bordas: `border-border`.
  - Destrutivo: `bg-destructive` e `text-destructive-foreground`.
- **Classe `dark:`**: Evite espalhar o prefixo `dark:` pelo código HTML, pois os tokens acima se adaptam automaticamente. Use `dark:` apenas em situações onde um override de estrutura for estritamente necessário e não puder ser resolvido pelas variáveis CSS.

## Design e Responsividade Mobile-First
- **Layout Mobile-First:** Escreva as classes utilitárias pensando primeiro em telas pequenas (mobile) e adicione breakpoints (`sm:`, `md:`, `lg:`) para telas maiores.
- **Adaptação Mobile:**
  - Elementos clicáveis devem ter áreas de toque adequadas (mínimo de `44px` de altura/largura ou `p-3`).
  - Garanta que tabelas, modais e menus naveguem bem em telas móveis (use scroll horizontal responsivo ou layouts empilhados/flex-col em mobile).
  - Evite larguras fixas em `px`; prefira `w-full`, `max-w-*` e tamanhos relativos.

## Acessibilidade
- Use elementos HTML semânticos (`button`, `nav`, `header`, `label`) em vez de `div`/`span` genéricos para elementos interativos.
- Todo input de formulário deve ter um `label` associado (visível ou `sr-only`).
- Imagens devem ter `alt` descritivo; ícones puramente decorativos devem ter `aria-hidden="true"`.
- Interações visuais importantes de teclado (`focus`) devem ser demarcadas claramente (`focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background`).

## Estados de Interface
- Todo componente que exibe dados assíncronos deve ter estados visuais claros para `loading` e `error`. 
- No padrão brutalista, carregamentos e erros não são amigáveis: use bordas tracejadas, opacidade alta, mensagens diretas em uppercase ("CARREGANDO...").
