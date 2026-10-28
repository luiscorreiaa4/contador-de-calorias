import { matchPath } from 'react-router';
import { Database, Settings, Target, TrendingUp, UserCog } from 'lucide-react';
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
  id: 'diario' | 'progresso' | 'conta' | 'evolucao' | 'metas' | 'catalogo' | 'perfil' | 'configuracoes';
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

const DIARIO: NavDestination = {
  id: 'diario',
  label: 'Diário',
  shortLabel: 'Diário',
  to: '/',
  icon: DiaryIcon,
  activeIcon: DiaryIconFilled,
  patterns: ['/', '/diario/:date'],
};

const PROGRESSO: NavDestination = {
  id: 'progresso',
  label: 'Progresso',
  shortLabel: 'Progresso',
  to: '/evolucao',
  icon: ProgressIcon,
  activeIcon: ProgressIconFilled,
  patterns: ['/evolucao/*', '/metas/*'],
};

const CONTA: NavDestination = {
  id: 'conta',
  label: 'Conta',
  shortLabel: 'Conta',
  to: '/conta',
  icon: AccountIcon,
  activeIcon: AccountIconFilled,
  patterns: ['/conta', '/perfil', '/configuracoes/*'],
};

const EVOLUCAO: NavDestination = {
  id: 'evolucao',
  label: 'Evolução',
  shortLabel: 'Evolução',
  to: '/evolucao',
  icon: TrendingUp,
  activeIcon: TrendingUp,
  patterns: ['/evolucao/*'],
};

const METAS: NavDestination = {
  id: 'metas',
  label: 'Metas',
  shortLabel: 'Metas',
  to: '/metas',
  icon: Target,
  activeIcon: Target,
  patterns: ['/metas/*'],
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
  to: '/perfil',
  icon: UserCog,
  activeIcon: UserCog,
  patterns: ['/perfil'],
};

const CONFIGURACOES: NavDestination = {
  id: 'configuracoes',
  label: 'Configurações',
  shortLabel: 'Config.',
  to: '/configuracoes',
  icon: Settings,
  activeIcon: Settings,
  patterns: ['/configuracoes/*'],
};

/** Slots da barra inferior; o "+" central não é destino e é inserido pelo BottomNav. */
export const BOTTOM_NAV_ITEMS: NavDestination[] = [DIARIO, PROGRESSO, CONTA];

/** Abas do menu do desktop (header). */
export const DESKTOP_NAV_ITEMS: NavDestination[] = [DIARIO, EVOLUCAO, METAS, CATALOGO, PERFIL, CONFIGURACOES];

/** Linhas da tela /conta. */
export const ACCOUNT_LINK_ITEMS: NavDestination[] = [PERFIL, CONFIGURACOES, CATALOGO];

export const EVOLUCAO_TABS: NavTab[] = [
  { to: '/evolucao/alimentacao', label: 'Alimentação' },
  { to: '/evolucao/corpo', label: 'Peso e medidas', shortLabel: 'Peso/medidas' },
];

export const METAS_TABS: NavTab[] = [
  { to: '/metas/rotina', label: 'Objetivo e rotina', shortLabel: 'Rotina' },
  { to: '/metas/diarias', label: 'Metas diárias', shortLabel: 'Diárias' },
];

/** Nível superior de Progresso; cada aba abre a sub-aba padrão da seção. */
export const PROGRESSO_TABS: NavTab[] = [
  { to: '/evolucao/alimentacao', label: 'Evolução', patterns: ['/evolucao/*'] },
  { to: '/metas/rotina', label: 'Metas', patterns: ['/metas/*'] },
];

/** Abas-folha de Progresso na ordem visual (usada pelo swipe). */
export const PROGRESSO_LEAF_TABS: NavTab[] = [...EVOLUCAO_TABS, ...METAS_TABS];

export const CONFIG_TABS: NavTab[] = [
  { to: '/configuracoes/notificacoes', label: 'Notificações', shortLabel: 'Notific.' },
  { to: '/configuracoes/seguranca', label: 'Segurança' },
  { to: '/configuracoes/privacidade', label: 'Privacidade e dados', shortLabel: 'Privacidade' },
];

export function isPathActive(pathname: string, patterns: string[]): boolean {
  return patterns.some((path) => matchPath({ path, end: !path.endsWith('/*') }, pathname) !== null);
}

export function isDestinationActive(pathname: string, destination: NavDestination): boolean {
  return isPathActive(pathname, destination.patterns);
}

export function visibleItems(items: NavDestination[], isAdmin: boolean): NavDestination[] {
  return items.filter((item) => !item.adminOnly || isAdmin);
}
