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
    expect(isDestinationActive('/app', byId('diario'))).toBe(true);
    expect(isDestinationActive('/app/diario/2026-10-01', byId('diario'))).toBe(true);
    expect(isDestinationActive('/app/historico/corpo', byId('diario'))).toBe(false);
  });

  it('Histórico fica ativo só nas próprias rotas', () => {
    const historico = byId('historico');
    expect(isDestinationActive('/app/historico', historico)).toBe(true);
    expect(isDestinationActive('/app/historico/corpo', historico)).toBe(true);
    expect(isDestinationActive('/app/metas/diarias', historico)).toBe(false);
    expect(isDestinationActive('/app/perfil', historico)).toBe(false);
  });

  it('Conta fica ativa em /conta, /metas, /perfil e /configuracoes e subrotas', () => {
    const conta = byId('conta');
    expect(isDestinationActive('/app/conta', conta)).toBe(true);
    expect(isDestinationActive('/app/metas/diarias', conta)).toBe(true);
    expect(isDestinationActive('/app/perfil', conta)).toBe(true);
    expect(isDestinationActive('/app/configuracoes', conta)).toBe(true);
    expect(isDestinationActive('/app/configuracoes/seguranca', conta)).toBe(true);
    expect(isDestinationActive('/app', conta)).toBe(false);
  });

  it('cada destino tem ícone de contorno e ícone preenchido', () => {
    [...BOTTOM_NAV_ITEMS, ...DESKTOP_NAV_ITEMS].forEach((item) => {
      expect(item.icon).toBeTruthy();
      expect(item.activeIcon).toBeTruthy();
    });
    BOTTOM_NAV_ITEMS.forEach((item) => expect(item.activeIcon).not.toBe(item.icon));
  });

  it('Catálogo só aparece para admin', () => {
    expect(visibleItems(ACCOUNT_LINK_ITEMS, true).map((i) => i.id)).toContain('catalogo');
    expect(visibleItems(ACCOUNT_LINK_ITEMS, false).map((i) => i.id)).toEqual([
      'metas',
      'perfil',
      'configuracoes',
    ]);
  });
});
