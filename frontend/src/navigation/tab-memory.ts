import { matchPath } from 'react-router';
import type { NavDestination } from './nav-items';

type TabId = 'diario' | 'historico' | 'conta';

/** Rotas que cada aba mantida montada (keep-alive) controla. Metas, Perfil e Configurações ficam de fora. */
const TAB_PATTERNS: Record<TabId, string[]> = {
  diario: ['/app', '/app/diario/:date'],
  historico: ['/app/historico/*'],
  conta: ['/app/conta'],
};

export const TAB_IDS = Object.keys(TAB_PATTERNS) as TabId[];

export function tabOwner(pathname: string): TabId | null {
  return (
    TAB_IDS.find((id) =>
      TAB_PATTERNS[id].some(
        (path) => matchPath({ path, end: !path.endsWith('/*') }, pathname) !== null,
      ),
    ) ?? null
  );
}

const lastPaths = new Map<string, string>();
const scrolls = new Map<string, number>();

export const rememberTabPath = (id: string, path: string) => lastPaths.set(id, path);
export const saveTabScroll = (id: string, y: number) => scrolls.set(id, y);
export const savedTabScroll = (id: string) => scrolls.get(id) ?? 0;
export const resetTabMemory = () => {
  lastPaths.clear();
  scrolls.clear();
};

/** Para onde a barra inferior e o swipe levam: a última sub-rota vista da aba (o Diário sempre volta a hoje). */
export function tabTarget(item: NavDestination, pathname: string): string {
  if (item.id === 'diario') return item.to;
  if (tabOwner(pathname) === item.id) return pathname;
  return lastPaths.get(item.id) ?? item.to;
}
