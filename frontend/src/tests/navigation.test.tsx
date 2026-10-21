import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { createTestRouter } from '../router';
import { AuthProvider } from '../context/AuthContext';

const pages = [
  ['/evolucao/alimentacao', 'ALIMENTAÇÃO', 'Evolução'],
  ['/evolucao/corpo', 'PESO E MEDIDAS', 'Evolução'],
  ['/metas/rotina', 'OBJETIVO E ROTINA', 'Metas'],
  ['/metas/diarias', 'METAS DIÁRIAS', 'Metas'],
  ['/perfil', 'PERFIL', 'Perfil'],
  ['/configuracoes/notificacoes', 'NOTIFICAÇÕES', 'Configurações'],
  ['/configuracoes/seguranca', 'SEGURANÇA', 'Configurações'],
  ['/configuracoes/privacidade', 'PRIVACIDADE E DADOS', 'Configurações'],
] as const;

function renderRoute(path: string) {
  const router = createTestRouter([path]);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><AuthProvider><RouterProvider router={router} /></AuthProvider></QueryClientProvider>);
  return router;
}

describe('Navegação por finalidade', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_session', JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com', onboarding_completed: true }));
  });

  it.each(pages)('abre diretamente %s e destaca a área correta no header', async (path, title, section) => {
    const router = renderRoute(path);
    expect(await screen.findByRole('heading', { name: title }, { timeout: 10000 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(path);
    const navigation = screen.getByRole('navigation', { name: 'Navegação principal' });
    expect(within(navigation).getByRole('link', { name: section })).toHaveAttribute('aria-current', 'page');
  });

  it.each(pages)('protege %s sem sessão', async path => {
    localStorage.clear();
    const router = renderRoute(path);
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it.each([
    ['/estatisticas', '/evolucao/alimentacao'], ['/medidas', '/evolucao/corpo'],
    ['/evolucao', '/evolucao/alimentacao'], ['/metas', '/metas/rotina'],
    ['/configuracoes', '/configuracoes/notificacoes'],
  ])('redireciona %s para %s', async (oldPath, newPath) => {
    const router = renderRoute(oldPath);
    await waitFor(() => expect(router.state.location.pathname).toBe(newPath));
  });

  it('navega entre alimentação e corpo, com voltar e avançar do navegador', async () => {
    const router = renderRoute('/evolucao/alimentacao');
    const navigation = await screen.findByRole('navigation', { name: 'Evolução' });
    await userEvent.click(within(navigation).getByRole('link', { name: /peso e medidas/i }));
    expect(await screen.findByRole('heading', { name: 'PESO E MEDIDAS' })).toBeInTheDocument();
    expect(await screen.findByLabelText(/altura/i)).toBeInTheDocument();
    await router.navigate(-1);
    expect(await screen.findByRole('heading', { name: 'ALIMENTAÇÃO' })).toBeInTheDocument();
    await router.navigate(1);
    expect(await screen.findByRole('heading', { name: 'PESO E MEDIDAS' })).toBeInTheDocument();
  });

  it('oferece configurações específicas no menu da conta e fecha com Escape', async () => {
    renderRoute('/perfil');
    await screen.findByRole('heading', { name: 'PERFIL' });
    const trigger = screen.getByRole('button', { name: 'Menu da conta' });
    await userEvent.click(trigger);
    const menu = screen.getByRole('navigation', { name: 'Menu da conta' });
    expect(within(menu).getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/perfil');
    expect(within(menu).getByRole('link', { name: 'Configurações' })).toHaveAttribute('href', '/configuracoes');
    await userEvent.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Menu da conta' })).getByRole('link', { name: 'Segurança' }));
    expect(await screen.findByRole('heading', { name: 'SEGURANÇA' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu da conta' })).toHaveAttribute('aria-expanded', 'false');
  });
});
