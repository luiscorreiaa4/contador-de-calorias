import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BOTTOM_NAV_ITEMS, type NavDestination } from './nav-items';
import { preloadBottomNavPages } from './page-loaders';
import { PeekContext } from './peek-context';
import { prefetchFor } from './prefetch';
import { useSwipeNav } from './useSwipeNav';

interface SwipeMainProps {
  /** Só com a barra inferior presente (logado e com onboarding concluído). */
  enabled: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * `<main>` da aplicação: recebe os toques do swipe entre destinos da barra inferior e move o painel interno.
 * O painel replica o centramento do `<main>` (flex) para não alterar o layout das telas; é `relative` para
 * a tela vizinha (`data-tab`) ficar ao lado dele durante o arrasto.
 */
export function SwipeMain({ enabled, className, children }: SwipeMainProps) {
  const [peek, setPeek] = useState<NavDestination['id'] | null>(null);
  const { areaRef, panelRef } = useSwipeNav<HTMLElement, HTMLDivElement>(enabled, setPeek);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    preloadBottomNavPages();
    // As abas escondidas não buscam dados sozinhas: aquece o cache para abrirem prontas.
    BOTTOM_NAV_ITEMS.forEach((item) => prefetchFor(queryClient, item.id));
  }, [enabled, queryClient]);
  return (
    <main id="main-content" tabIndex={-1} ref={areaRef} className={className}>
      <div ref={panelRef} className="relative w-full flex items-center justify-center">
        <PeekContext.Provider value={peek}>{children}</PeekContext.Provider>
      </div>
    </main>
  );
}
