import { matchPath } from 'react-router';
import { Database, Settings, Target, UserCog } from 'lucide-react';
import {
  AccountIcon,
  AccountIconFilled,
  DiaryIcon,
  DiaryIconFilled,
  ProgressIcon,
  ProgressIconFilled,
  type NavIcon,
} from './icons';

/**
 * Fonte única dos destinos de navegação. Barra inferior, menu do desktop,
 * tela /conta e abas de seção consomem este módulo; novos destinos entram só aqui.
 */

export interface NavDestination {
  id: 'diario' | 'historico' | 'conta' | 'metas' | 'catalogo' | 'perfil' | 'configuracoes';
  label: string;
  shortLabel: string;
  to: string;
  icon: NavIcon;
  activeIcon: NavIcon;
  /** Padrões de rota (react-router) em que o destino conta como ativo. */
  patterns: string[];
  adminOnly?: boolean;
}

export interface NavTab {
  to: string;
  label: string;
  shortLabel?: string;
  /** Padrões em que a aba conta como ativa; por padrão, a rota da aba e suas subrotas. */
  patterns?: string[];
}

export const HISTORICO_TABS: NavTab[] = [
  { to: '/app/historico/alimentacao', label: 'Alimentação' },
  { to: '/app/historico/corpo', label: 'Peso e medidas', shortLabel: 'Peso/medidas' },
];

const DIARIO: NavDestination = {
  id: 'diario',
  label: 'Diário',
  shortLabel: 'Diário',
  to: '/app',
  icon: DiaryIcon,
  activeIcon: DiaryIconFilled,
  patterns: ['/app', '/app/diario/:date'],
};

const HISTORICO: NavDestination = {
  id: 'historico',
  label: 'Histórico',
  shortLabel: 'Histórico',
  // Direto na primeira aba: o índice /app/historico só redireciona e renderizaria vazio.
  to: HISTORICO_TABS[0].to,
  icon: ProgressIcon,
  activeIcon: ProgressIconFilled,
  patterns: ['/app/historico/*'],
};

const CONTA: NavDestination = {
  id: 'conta',
  label: 'Conta',
  shortLabel: 'Conta',
  to: '/app/conta',
  icon: AccountIcon,
  activeIcon: AccountIconFilled,
  patterns: ['/app/conta', '/app/metas/*', '/app/perfil', '/app/configuracoes/*'],
};

const METAS: NavDestination = {
  id: 'metas',
  label: 'Metas',
  shortLabel: 'Metas',
  to: '/app/metas',
  icon: Target,
  activeIcon: Target,
  patterns: ['/app/metas/*'],
};

const CATALOGO: NavDestination = {
  id: 'catalogo',
  label: 'Catálogo',
  shortLabel: 'Catálogo',
  to: '/admin/alimentos',
  icon: Database,
  activeIcon: Database,
  patterns: ['/admin/alimentos'],
  adminOnly: true,
};

const PERFIL: NavDestination = {
  id: 'perfil',
  label: 'Perfil',
  shortLabel: 'Perfil',
  to: '/app/perfil',
  icon: UserCog,
  activeIcon: UserCog,
  patterns: ['/app/perfil'],
};

const CONFIGURACOES: NavDestination = {
  id: 'configuracoes',
  label: 'Configurações',
  shortLabel: 'Config.',
  to: '/app/configuracoes',
  icon: Settings,
  activeIcon: Settings,
  patterns: ['/app/configuracoes/*'],
};

/** Slots da barra inferior; o "+" central não é destino e é inserido pelo BottomNav. */
export const BOTTOM_NAV_ITEMS: NavDestination[] = [DIARIO, HISTORICO, CONTA];

/** Abas do menu do desktop (header). */
export const DESKTOP_NAV_ITEMS: NavDestination[] = [DIARIO, HISTORICO];

/** Linhas da tela /conta e do dropdown da conta no desktop. */
export const ACCOUNT_LINK_ITEMS: NavDestination[] = [METAS, PERFIL, CONFIGURACOES, CATALOGO];

export const METAS_TABS: NavTab[] = [
  { to: '/app/metas/rotina', label: 'Objetivo e rotina', shortLabel: 'Rotina' },
  { to: '/app/metas/diarias', label: 'Metas diárias', shortLabel: 'Diárias' },
];

export const CONFIG_TABS: NavTab[] = [
  { to: '/app/configuracoes/notificacoes', label: 'Notificações', shortLabel: 'Notific.' },
  { to: '/app/configuracoes/seguranca', label: 'Segurança' },
  { to: '/app/configuracoes/privacidade', label: 'Privacidade e dados', shortLabel: 'Privacidade' },
];

function isPathActive(pathname: string, patterns: string[]): boolean {
  return patterns.some((path) => matchPath({ path, end: !path.endsWith('/*') }, pathname) !== null);
}

export function isTabActive(pathname: string, tab: NavTab): boolean {
  if (tab.patterns) return isPathActive(pathname, tab.patterns);
  return pathname === tab.to || pathname.startsWith(`${tab.to}/`);
}

export function isDestinationActive(pathname: string, destination: NavDestination): boolean {
  return isPathActive(pathname, destination.patterns);
}

export function visibleItems(items: NavDestination[], isAdmin: boolean): NavDestination[] {
  return items.filter((item) => !item.adminOnly || isAdmin);
}
