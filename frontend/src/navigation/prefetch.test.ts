import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { prefetchFor } from './prefetch';
import { BOTTOM_NAV_ITEMS, HISTORICO_TABS } from './nav-items';
import { routes } from '../router';
import { matchRoutes, type RouteObject } from 'react-router';
import { getLocalDateString } from '../utils/date';

vi.mock('../services/meal.service', () => ({
  getTodayMeals: vi.fn().mockResolvedValue([]),
  getMealStats: vi.fn().mockResolvedValue({ daysLogged: 0 }),
}));
vi.mock('../services/goals.service', () => ({ getActiveGoal: vi.fn().mockResolvedValue({}) }));
vi.mock('../services/measurement.service', () => ({
  getMeasurements: vi.fn().mockResolvedValue([]),
}));

const keysOf = (client: QueryClient) =>
  client
    .getQueryCache()
    .getAll()
    .map((q) => JSON.stringify(q.queryKey));

describe('prefetchFor', () => {
  const today = getLocalDateString();

  it('Diário aquece refeições e meta do dia com as chaves da tela', () => {
    const client = new QueryClient();
    prefetchFor(client, 'diario');
    expect(keysOf(client)).toEqual(
      expect.arrayContaining([
        JSON.stringify(['todayMeals', today]),
        JSON.stringify(['active-goal', today]),
      ]),
    );
  });

  it('Histórico aquece estatísticas da semana e medidas; Conta não busca nada', () => {
    const client = new QueryClient();
    prefetchFor(client, 'historico');
    expect(keysOf(client)).toEqual(
      expect.arrayContaining([
        JSON.stringify(['mealStats', 'week', today]),
        JSON.stringify(['measurements', 'all']),
      ]),
    );
    const other = new QueryClient();
    prefetchFor(other, 'conta');
    expect(keysOf(other)).toHaveLength(0);
  });
});

describe('destino do Histórico', () => {
  it('a barra inferior vai direto à primeira aba, que é uma rota folha (sem <Navigate>)', () => {
    const historico = BOTTOM_NAV_ITEMS.find((i) => i.id === 'historico')!;
    expect(historico.to).toBe(HISTORICO_TABS[0].to);
    const leaf = matchRoutes(routes as RouteObject[], historico.to)!.at(-1)!.route;
    expect(leaf.path).toBe('alimentacao');
  });
});
