import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { createTestRouter } from '../router';
import { AuthProvider } from '../context/AuthContext';

const pages = [
  ['/app/historico/alimentacao', 'ALIMENTAÇÃO'],
  ['/app/historico/corpo', 'PESO E MEDIDAS'],
  ['/app/metas/rotina', 'OBJETIVO E ROTINA'],
  ['/app/metas/diarias', 'METAS DIÁRIAS'],
  ['/app/perfil', 'PERFIL'],
  ['/app/configuracoes/notificacoes', 'NOTIFICAÇÕES'],
  ['/app/configuracoes/seguranca', 'SEGURANÇA'],
  ['/app/configuracoes/privacidade', 'PRIVACIDADE E DADOS'],
] as const;

function renderRoute(path: string) {
  const router = createTestRouter([path]);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return router;
}

describe('Navegação por finalidade', () => {
  beforeEach(() => {
    localStorage.setItem('auth_session', 'test-token');
    localStorage.setItem(
      'user_session',
      JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        onboarding_completed: true,
      }),
    );
  });

  it.each(pages)('abre diretamente %s', async (path, title) => {
    const router = renderRoute(path);
    expect(
      await screen.findByRole('heading', { name: title }, { timeout: 15000 }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(path);
  });

  it('o header do desktop tem só Diário e Histórico e destaca Histórico', async () => {
    renderRoute('/app/historico/corpo');
    await screen.findByRole('heading', { name: 'PESO E MEDIDAS' });
    const navigation = screen.getByRole('navigation', { name: 'Navegação principal' });
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Diário', 'Histórico']);
    expect(within(navigation).getByRole('link', { name: 'Histórico' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('Metas tem título próprio e não mostra as abas de Histórico', async () => {
    renderRoute('/app/metas/rotina');
    expect(await screen.findByRole('heading', { level: 1, name: 'Metas' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Metas' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Histórico' })).not.toBeInTheDocument();
  });

  it.each(pages)('protege %s sem sessão', async (path) => {
    localStorage.clear();
    const router = renderRoute(path);
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('"Sair da conta" leva à landing, não ao login', async () => {
    const router = renderRoute('/app/conta');
    await userEvent.click(await screen.findByRole('button', { name: /sair da conta/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(localStorage.getItem('auth_session')).toBeNull();
  });

  it('sem sessão, o logo no login leva à landing', async () => {
    localStorage.clear();
    const router = renderRoute('/login');
    await userEvent.click(await screen.findByRole('button', { name: 'CalorieSync — Início' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it.each([
    ['/estatisticas', '/app/historico/alimentacao'],
    ['/medidas', '/app/historico/corpo'],
    ['/evolucao', '/app/historico/alimentacao'],
    ['/evolucao/alimentacao', '/app/historico/alimentacao'],
    ['/evolucao/corpo', '/app/historico/corpo'],
    ['/app/historico', '/app/historico/alimentacao'],
    ['/app/metas', '/app/metas/rotina'],
    ['/app/configuracoes', '/app/configuracoes/notificacoes'],
    // URLs de antes do prefixo /app.
    ['/historico/corpo', '/app/historico/corpo'],
    ['/metas/diarias', '/app/metas/diarias'],
    ['/perfil', '/app/perfil'],
    ['/diario/2026-10-01', '/app/diario/2026-10-01'],
  ])('redireciona %s para %s', async (oldPath, newPath) => {
    const router = renderRoute(oldPath);
    await waitFor(() => expect(router.state.location.pathname).toBe(newPath));
  });

  it('navega entre alimentação e corpo, com voltar e avançar do navegador', async () => {
    const router = renderRoute('/app/historico/alimentacao');
    const navigation = await screen.findByRole('navigation', { name: 'Histórico' });
    await userEvent.click(within(navigation).getByRole('link', { name: /peso e medidas/i }));
    expect(await screen.findByRole('heading', { name: 'PESO E MEDIDAS' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/altura/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nova medição/i })).toBeInTheDocument();
    await router.navigate(-1);
    expect(await screen.findByRole('heading', { name: 'ALIMENTAÇÃO' })).toBeInTheDocument();
    await router.navigate(1);
    expect(await screen.findByRole('heading', { name: 'PESO E MEDIDAS' })).toBeInTheDocument();
  });

  it('o menu da conta espelha /conta, com Metas, e fecha com Escape', async () => {
    renderRoute('/app/perfil');
    await screen.findByRole('heading', { name: 'PERFIL' });
    expect(await screen.findByLabelText(/altura/i)).toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Menu da conta' });
    await userEvent.click(trigger);
    const menu = screen.getByRole('navigation', { name: 'Menu da conta' });
    expect(within(menu).getByRole('link', { name: 'Metas' })).toHaveAttribute('href', '/app/metas');
    expect(within(menu).getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/app/perfil');
    expect(within(menu).getByRole('link', { name: 'Configurações' })).toHaveAttribute(
      'href',
      '/app/configuracoes',
    );
    await userEvent.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await userEvent.click(
      within(screen.getByRole('navigation', { name: 'Menu da conta' })).getByRole('link', {
        name: 'Metas',
      }),
    );
    expect(await screen.findByRole('heading', { name: 'OBJETIVO E ROTINA' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu da conta' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
