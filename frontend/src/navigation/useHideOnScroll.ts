import { useEffect, useState, type RefObject } from 'react';
import { useLocation } from 'react-router';

export const HIDE_ON_SCROLL = {
  topOffsetPx: 56,
  hideAfterPx: 8,
  showAfterPx: 4,
} as const;

const NON_TEXT_INPUT_TYPES = new Set(['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'file', 'image', 'color']);

function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.has(target.type);
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable;
}

/**
 * Estado "oculta" da barra inferior: some ao rolar para baixo e volta ao rolar para cima.
 * Sempre visível perto do topo, com foco dentro da barra e (para o scroll) em /configuracoes/*.
 * Campo de texto em foco oculta a barra em qualquer rota, para não subir com o teclado.
 * Os únicos listeners globais são scroll (window, passivo) e focusin/focusout (document).
 */
export function useHideOnScroll(barRef: RefObject<HTMLElement | null>): boolean {
  const { pathname } = useLocation();
  // O estado de rolagem vale só para a rota em que foi gravado: navegar reexibe a barra.
  const [scrollHidden, setScrollHidden] = useState<{ path: string; hidden: boolean }>({ path: pathname, hidden: false });
  const [fieldFocused, setFieldFocused] = useState(false);
  const [barFocused, setBarFocused] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let accumulated = 0;
    let frame = false;

    const update = () => {
      frame = false;
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;

      if (y < HIDE_ON_SCROLL.topOffsetPx) {
        accumulated = 0;
        setScrollHidden({ path: pathname, hidden: false });
        return;
      }
      if (delta === 0) return;

      if (delta > 0) {
        accumulated = accumulated > 0 ? accumulated + delta : delta;
        if (accumulated > HIDE_ON_SCROLL.hideAfterPx) setScrollHidden({ path: pathname, hidden: true });
      } else {
        accumulated = 0;
        if (-delta > HIDE_ON_SCROLL.showAfterPx) setScrollHidden({ path: pathname, hidden: false });
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      setFieldFocused(isTextField(event.target));
      setBarFocused(event.target instanceof Node && !!barRef.current?.contains(event.target));
    };
    const onFocusOut = () => {
      setFieldFocused(false);
      setBarFocused(false);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [barRef]);

  const neverHideOnScroll = pathname.startsWith('/configuracoes');
  const hiddenByScroll = scrollHidden.path === pathname && scrollHidden.hidden && !neverHideOnScroll && !barFocused;

  return hiddenByScroll || fieldFocused;
}
