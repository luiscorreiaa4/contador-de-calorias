import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../navigation/swipe';

/** Duração da saída de modais e toasts (mesma de `.animate-out` em index.css). */
export const EXIT_MS = 150;

/**
 * Mantém o elemento montado por `EXIT_MS` depois de `open` virar false, para a animação de saída.
 * Com movimento reduzido, desmonta no próximo tick.
 */
export function usePresence(open: boolean): { mounted: boolean; closing: boolean } {
  const [prevOpen, setPrevOpen] = useState(open);
  const [closing, setClosing] = useState(false);

  if (prevOpen !== open) {
    setPrevOpen(open);
    setClosing(!open);
  }

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setClosing(false), prefersReducedMotion() ? 0 : EXIT_MS);
    return () => clearTimeout(timer);
  }, [closing]);

  return { mounted: open || closing, closing };
}
