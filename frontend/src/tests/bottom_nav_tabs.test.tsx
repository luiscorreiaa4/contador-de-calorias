import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { createTestRouter } from '../router';
import { AuthProvider } from '../context/AuthContext';
import { resetTabMemory, tabTarget } from '../navigation/tab-memory';
import { BOTTOM_NAV_ITEMS } from '../navigation/nav-items';

function renderApp(path: string) {
  const router = createTestRouter([path]);
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return router;
}

describe('BottomNavTabs (telas vivas)', () => {
  beforeEach(() => {
    resetTabMemory();
    localStorage.setItem('auth_session', 'test-token');
    localStorage.setItem(
      'user_session',
      JSON.stringify({ id: '1', name: 'Test', email: 't@e.com', onboarding_completed: true }),
    );
  });

  it('a aba que sai continua montada (escondida) e volta no mesmo lugar', async () => {
    const router = renderApp('/app/historico/corpo');
    await screen.findByRole('heading', { name: 'PESO E MEDIDAS' }, { timeout: 15000 });

    await act(async () => {
      await router.navigate('/app/conta');
    });
    await screen.findByRole('heading', { name: 'Conta' });
    // Histórico segue no DOM, escondido (Activity), com a aba "Peso e medidas" que ele tinha.
    expect(
      screen.getByRole('heading', { name: 'PESO E MEDIDAS', hidden: true }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'PESO E MEDIDAS' })).not.toBeInTheDocument();

    const historico = BOTTOM_NAV_ITEMS.find((item) => item.id === 'historico')!;
    expect(tabTarget(historico, '/app/conta')).toBe('/app/historico/corpo');

    await act(async () => {
      await router.navigate(tabTarget(historico, '/app/conta'));
    });
    expect(await screen.findByRole('heading', { name: 'PESO E MEDIDAS' })).toBeInTheDocument();
  });

  it('restaura a rolagem de cada aba', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const router = renderApp('/app/conta');
    await screen.findByRole('heading', { name: 'Conta' }, { timeout: 15000 });

    Object.defineProperty(window, 'scrollY', { value: 240, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    await act(async () => {
      await router.navigate('/app/historico/alimentacao');
    });
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);

    await act(async () => {
      await router.navigate('/app/conta');
    });
    expect(scrollTo).toHaveBeenLastCalledWith(0, 240);
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    scrollTo.mockRestore();
  });
});
