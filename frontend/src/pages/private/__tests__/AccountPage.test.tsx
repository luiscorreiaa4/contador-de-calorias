import { beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { render, screen, waitFor } from '../../../tests/setup/test-utils';
import { ThemeProvider } from '../../../context/ThemeProvider';
import { AccountPage } from '../AccountPage';

function renderPage(role: 'user' | 'admin' = 'user') {
  localStorage.setItem('auth_token', role === 'admin' ? 'admin-token' : 'test-token');
  localStorage.setItem(
    'user_session',
    JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com', role, onboarding_completed: true })
  );
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AccountPage />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('AccountPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mostra o cartão do usuário com iniciais, nome e e-mail', async () => {
    renderPage();
    expect(await screen.findByText('TU')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('oferece Perfil e Configurações (do módulo único) e esconde o Catálogo de usuário comum', async () => {
    renderPage();
    expect(await screen.findByRole('link', { name: /perfil/i })).toHaveAttribute('href', '/perfil');
    expect(screen.getByRole('link', { name: /configurações/i })).toHaveAttribute('href', '/configuracoes');
    expect(screen.queryByRole('link', { name: /catálogo/i })).not.toBeInTheDocument();
  });

  it('mostra o Catálogo para administrador', async () => {
    renderPage('admin');
    expect(await screen.findByRole('link', { name: /catálogo/i })).toHaveAttribute('href', '/admin/alimentos');
  });

  it('alterna o tema', async () => {
    renderPage();
    const toggle = await screen.findByRole('button', { name: /modo (claro|escuro)/i });
    const before = document.documentElement.classList.contains('dark');
    await userEvent.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(!before);
  });

  it('"Sair da conta" encerra a sessão existente', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /sair da conta/i }));
    await waitFor(() => expect(localStorage.getItem('auth_token')).toBeNull());
    expect(localStorage.getItem('user_session')).toBeNull();
  });
});
