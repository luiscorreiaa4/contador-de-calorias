import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { createTestRouter } from '../../../router';
import { AuthProvider } from '../../../context/AuthContext';

function renderApp(initialPath: string) {
  const router = createTestRouter([initialPath]);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );

  return { router, queryClient };
}

describe('Painel do Catálogo Global (Admin)', () => {
  const adminUser = {
    id: 'admin-1',
    name: 'Admin Teste',
    email: 'admin@example.com',
    role: 'admin' as const,
    onboarding_completed: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const regularUser = {
    id: 'user-1',
    name: 'Usuario Comum',
    email: 'user@example.com',
    role: 'user' as const,
    onboarding_completed: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('AdminRoute: redireciona usuário não-admin para a página inicial (/)', async () => {
    localStorage.setItem('auth_token', 'user-token');
    localStorage.setItem('user_session', JSON.stringify(regularUser));

    const { router } = renderApp('/admin/alimentos');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/');
    });
  });

  it('AdminRoute: permite acesso a usuário com papel admin', async () => {
    localStorage.setItem('auth_token', 'admin-token');
    localStorage.setItem('user_session', JSON.stringify(adminUser));

    const { router } = renderApp('/admin/alimentos');

    expect(
      await screen.findByRole('heading', { name: /CATÁLOGO GLOBAL DE ALIMENTOS/i })
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/alimentos');
  });

  it('AppHeader: não exibe o link "Catálogo" para usuário comum', async () => {
    localStorage.setItem('auth_token', 'user-token');
    localStorage.setItem('user_session', JSON.stringify(regularUser));

    renderApp('/');
    expect(await screen.findByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Catálogo/i })).not.toBeInTheDocument();
  });

  it('AppHeader: exibe o link "Catálogo" para administrador e navega para /admin/alimentos', async () => {
    localStorage.setItem('auth_token', 'admin-token');
    localStorage.setItem('user_session', JSON.stringify(adminUser));

    const { router } = renderApp('/');
    const adminNav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    const catalogLink = within(adminNav).getByRole('link', { name: /Catálogo/i });
    expect(catalogLink).toBeInTheDocument();

    await userEvent.click(catalogLink);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin/alimentos');
    });
  });

  it('Lista alimentos, permite filtrar por status e buscar por termo', async () => {
    localStorage.setItem('auth_token', 'admin-token');
    localStorage.setItem('user_session', JSON.stringify(adminUser));

    renderApp('/admin/alimentos');

    // Verifica se os itens do mock MSW aparecem (desktop table e mobile cards)
    const arrozItems = await screen.findAllByText(/ARROZ BRANCO COZIDO/i);
    expect(arrozItems.length).toBeGreaterThan(0);

    const feijaoItems = await screen.findAllByText(/FEIJÃO CARIOCA COZIDO/i);
    expect(feijaoItems.length).toBeGreaterThan(0);

    // Filtrar apenas ativos
    const activeTab = screen.getByRole('button', { name: 'ATIVOS' });
    await userEvent.click(activeTab);

    await waitFor(() => {
      expect(screen.getAllByText(/ARROZ BRANCO COZIDO/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/FEIJÃO CARIOCA COZIDO/i)).not.toBeInTheDocument();
    });

    // Busca por termo
    const searchInput = screen.getByPlaceholderText(/BUSCAR POR NOME OU CÓDIGO/i);
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'arroz');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => {
      expect(screen.getAllByText(/ARROZ BRANCO COZIDO/i).length).toBeGreaterThan(0);
    });
  });

  it('Cria novo alimento via modal exigindo fonte auditável (B9, B12)', async () => {
    localStorage.setItem('auth_token', 'admin-token');
    localStorage.setItem('user_session', JSON.stringify(adminUser));

    renderApp('/admin/alimentos');

    const newBtn = await screen.findByRole('button', { name: /\+ Novo Alimento/i });
    await userEvent.click(newBtn);

    const dialog = screen.getByRole('dialog', { name: /Novo Alimento no Catálogo/i });
    expect(dialog).toBeInTheDocument();

    // Preenche campos
    await userEvent.type(within(dialog).getByLabelText(/Nome do Alimento/i), 'Aveia em Flocos');
    await userEvent.type(within(dialog).getByLabelText(/Kcal \*/i), '393');
    await userEvent.type(within(dialog).getByLabelText(/Proteínas \(g\) \*/i), '14');
    await userEvent.type(within(dialog).getByLabelText(/Carboidratos \(g\) \*/i), '66');
    await userEvent.type(within(dialog).getByLabelText(/Gorduras \(g\) \*/i), '7');
    await userEvent.type(within(dialog).getByLabelText(/Fonte Oficial Auditável/i), 'TACO 4ª ed., código 050');

    // Submete formulário
    await userEvent.click(within(dialog).getByRole('button', { name: /Cadastrar Alimento/i }));

    // Confirma feedback de sucesso
    expect(
      await screen.findByText(/Novo alimento cadastrado com sucesso no catálogo global!/i)
    ).toBeInTheDocument();
  });

  it('Edita alimento existente e exibe modal com valores preenchidos', async () => {
    localStorage.setItem('auth_token', 'admin-token');
    localStorage.setItem('user_session', JSON.stringify(adminUser));

    renderApp('/admin/alimentos');

    await screen.findAllByText(/ARROZ BRANCO COZIDO/i);
    const editBtns = screen.getAllByRole('button', { name: /Editar Arroz Branco Cozido/i });
    await userEvent.click(editBtns[0]);

    const dialog = screen.getByRole('dialog', { name: /Editar Alimento do Catálogo/i });
    expect(dialog).toBeInTheDocument();

    const nameInput = within(dialog).getByLabelText(/Nome do Alimento/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Arroz Branco Cozido');

    await userEvent.click(within(dialog).getByRole('button', { name: /Salvar Alterações/i }));

    expect(
      await screen.findByText(/Alimento atualizado com sucesso no catálogo global!/i)
    ).toBeInTheDocument();
  });

  it('Desativa alimento com diálogo acessível de confirmação (B4)', async () => {
    localStorage.setItem('auth_token', 'admin-token');
    localStorage.setItem('user_session', JSON.stringify(adminUser));

    renderApp('/admin/alimentos');

    await screen.findAllByText(/ARROZ BRANCO COZIDO/i);
    const toggleBtns = screen.getAllByRole('button', { name: /Desativar Arroz Branco Cozido/i });
    await userEvent.click(toggleBtns[0]);

    const confirmDialog = screen.getByRole('dialog', { name: /Desativar Alimento\?/i });
    expect(confirmDialog).toBeInTheDocument();
    expect(within(confirmDialog).getByText(/deixará de aparecer em novas buscas/i)).toBeInTheDocument();

    await userEvent.click(within(confirmDialog).getByRole('button', { name: /Desativar Alimento/i }));

    expect(
      await screen.findByText(/desativado do catálogo global/i)
    ).toBeInTheDocument();
  });
});
