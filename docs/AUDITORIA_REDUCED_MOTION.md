# Auditoria de Movimento Reduzido (prefers-reduced-motion) — WCAG 2.3.3

**Data:** Novembro de 2026  
**Referência da Issue:** `docs/ISSUES.md` #28  
**Diretrizes:** WCAG 2.1 Critério de Sucesso 2.3.3 (Animation from Interactions - Nível AAA / Melhores Práticas AA).

---

## 1. Escopo Auditado

A auditoria cobriu 100% dos pontos de animação e transição do frontend:
1. **Folhas de Estilo Globais (`frontend/src/styles/index.css`):**
   - Transições de cores de tema (`transition-colors duration-300`).
   - Classes utilitárias `.animate-in`.
   - Autofill transitions.
2. **Keyframes e Utilitários Tailwind (`frontend/tailwind.config.js`):**
   - Animações `fade-in` (`fadeIn 0.3s ease-out`).
   - Animações `slide-up` (`slideUp 0.4s ease-out`).
3. **Componentes e Transições Estruturais:**
   - Barra de Navegação Inferior (`BottomNav.tsx`): `transition-transform duration-300`.
   - Modais (Radix UI / `Dialog`): backdrop e dialog content transitions.
   - Botões e Cards brutalistas: transições de `hover` de sombra (`shadow-hard` para `shadow-hard-hover`).
4. **Interações Complexas e Gestos Touch (`frontend/src/navigation/`):**
   - Swipe entre destinos da barra inferior (`swipe.ts`, `useSwipeNav.ts`).
   - Ocultação da barra ao rolar (`useHideOnScroll.ts`).

---

## 2. Mecanismos de Proteção Implementados

### 2.1 Guarda Global via CSS (`frontend/src/styles/index.css`)
O projeto possui um reset global obrigatório:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
**Resultado:** Todos os seletores CSS, pseudo-elementos, transições de hover, keyframes do Tailwind (`fade-in`, `slide-up`), transições de layout e transições de cor têm duração truncada para `0.01ms !important` e contagem de iteração fixada em 1. O comportamento de rolagem suave (`scroll-behavior`) é forçado para `auto`.

### 2.2 Guarda Imperativa em Gestos JS (`frontend/src/navigation/swipe.ts`)
Para transições geradas dinamicamente via `transform` inline pelo motor de gestos touch:
```ts
export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```
Quando o usuário ativa a preferência de movimento reduzido no sistema operacional:
- O arrasto com o dedo e as animações de saída/entrada são **imediatamente ignorados**.
- A navegação ocorre instantaneamente sem interpolação de frames.
- Testado e garantido em `frontend/src/navigation/useSwipeNav.test.tsx` (`"com prefers-reduced-motion navega direto, sem animar"`).

---

## 3. Conclusão da Auditoria

- ✅ **Conformidade WCAG 2.3.3:** Total. Nenhuma animação ou transição ignora a preferência do usuário.
- ✅ **Testes Automatizados:** Cobertura no motor de swipe touch e validação visual de tokens.
- ✅ **Desempenho:** Zero custo computacional com interpolações desnecessárias quando a redução está ativa.

