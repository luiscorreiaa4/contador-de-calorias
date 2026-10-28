import type { ReactNode } from 'react';
import { useSwipeNav } from './useSwipeNav';

interface SwipeMainProps {
  /** Só com a barra inferior presente (logado e com onboarding concluído). */
  enabled: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * `<main>` da aplicação: recebe os toques do swipe entre destinos da barra inferior e move o painel interno.
 * O painel replica o centramento do `<main>` (flex) para não alterar o layout das telas.
 */
export function SwipeMain({ enabled, className, children }: SwipeMainProps) {
  const { areaRef, panelRef } = useSwipeNav<HTMLElement, HTMLDivElement>(enabled);
  return (
    <main ref={areaRef} className={className}>
      <div ref={panelRef} className="w-full flex items-center justify-center">
        {children}
      </div>
    </main>
  );
}
