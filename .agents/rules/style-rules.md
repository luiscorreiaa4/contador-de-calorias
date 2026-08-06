---
trigger: model_decision
description: Sempre que criar, alterar ou estilizar componentes e páginas no frontend
---

# Regras de Estilo e UI

## Tecnologias e Frameworks
- **Tailwind CSS exclusivo:** Todo o CSS deve ser implementado via Tailwind CSS. Nunca crie arquivos `.css` customizados ou estilos inline no JSX (exceto propriedades dinâmicas atípicas).
- **Suporte a Tema Claro e Escuro (Light/Dark Mode):**
  - Todo componente DEVE suportar modo claro e escuro.
  - Utilize as classes do Tailwind com o prefixo `dark:` em cores de fundo, textos, bordas e estados de hover/focus (ex: `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100`).
  - Mantenha um contraste visual moderno, limpo e legível em ambos os modos.

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
- Garanta contraste de texto suficiente em ambos os temas (não confiar apenas em cor para transmitir estado, ex: erro/sucesso).

## Estados de Interface
- Todo componente que exibe dados assíncronos deve ter estados visuais claros para `loading` (skeleton ou spinner) e `error` (mensagem amigável), consistentes com o restante do app — não apenas texto genérico ou tela em branco.
