import type { ReactNode } from 'react';
import type { NavTab } from './nav-items';
import { useSwipeTabs } from './useSwipeTabs';

interface SwipeTabsAreaProps {
  tabs: NavTab[];
  children: ReactNode;
}

/** Envolve só o conteúdo abaixo da barra segmentada; a ordem das abas vem de `tabs`. */
export function SwipeTabsArea({ tabs, children }: SwipeTabsAreaProps) {
  const ref = useSwipeTabs<HTMLDivElement>(tabs);
  return (
    <div ref={ref} className="min-h-[50vh]">
      {children}
    </div>
  );
}
