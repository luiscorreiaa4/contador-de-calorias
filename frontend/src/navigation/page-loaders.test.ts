import { describe, expect, it, vi } from 'vitest';

const loaded = vi.hoisted(() => [] as string[]);
vi.mock('../components/charts/CaloriesBarChart', () => {
  loaded.push('calorias');
  return { default: () => null };
});
vi.mock('../components/charts/MeasurementLineChart', () => {
  loaded.push('medidas');
  return { default: () => null };
});

describe('preloadBottomNavPages', () => {
  it('inclui os chunks dos gráficos do Histórico', async () => {
    const { preloadBottomNavPages } = await import('./page-loaders');
    preloadBottomNavPages();
    await vi.waitFor(() => expect(loaded).toEqual(expect.arrayContaining(['calorias', 'medidas'])));
  });
});
