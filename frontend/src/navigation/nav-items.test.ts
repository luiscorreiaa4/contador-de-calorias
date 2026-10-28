import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_LINK_ITEMS,
  BOTTOM_NAV_ITEMS,
  DESKTOP_NAV_ITEMS,
  isDestinationActive,
  visibleItems,
} from './nav-items';

const byId = (id: string) => BOTTOM_NAV_ITEMS.find((item) => item.id === id)!;

describe('nav-items', () => {
  it('Diário fica ativo na tela inicial e no diário por data, mas não em outras rotas', () => {
    expect(isDestinationActive('/', byId('diario'))).toBe(true);
    expect(isDestinationActive('/diario/2026-10-01', byId('diario'))).toBe(true);
    expect(isDestinationActive('/evolucao/corpo', byId('diario'))).toBe(false);
  });

  it('Progresso fica ativo em Evolução e em Metas', () => {
    const progresso = byId('progresso');
    expect(isDestinationActive('/evolucao', progresso)).toBe(true);
    expect(isDestinationActive('/evolucao/corpo', progresso)).toBe(true);
    expect(isDestinationActive('/metas/diarias', progresso)).toBe(true);
    expect(isDestinationActive('/perfil', progresso)).toBe(false);
  });

  it('Conta fica ativa em /conta, /perfil e /configuracoes e subrotas', () => {
    const conta = byId('conta');
    expect(isDestinationActive('/conta', conta)).toBe(true);
    expect(isDestinationActive('/perfil', conta)).toBe(true);
    expect(isDestinationActive('/configuracoes', conta)).toBe(true);
    expect(isDestinationActive('/configuracoes/seguranca', conta)).toBe(true);
    expect(isDestinationActive('/', conta)).toBe(false);
  });

  it('cada destino tem ícone de contorno e ícone preenchido', () => {
    [...BOTTOM_NAV_ITEMS, ...DESKTOP_NAV_ITEMS].forEach((item) => {
      expect(item.icon).toBeTruthy();
      expect(item.activeIcon).toBeTruthy();
    });
    BOTTOM_NAV_ITEMS.forEach((item) => expect(item.activeIcon).not.toBe(item.icon));
  });

  it('Catálogo só aparece para admin', () => {
    expect(visibleItems(DESKTOP_NAV_ITEMS, false).map((i) => i.id)).not.toContain('catalogo');
    expect(visibleItems(DESKTOP_NAV_ITEMS, true).map((i) => i.id)).toContain('catalogo');
    expect(visibleItems(ACCOUNT_LINK_ITEMS, false).map((i) => i.id)).toEqual(['perfil', 'configuracoes']);
  });

});
