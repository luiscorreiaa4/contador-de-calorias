import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { render } from '../../tests/setup/test-utils';
import { ResetPasswordPage } from './ResetPasswordPage';

const VALID_TOKEN = 'valid-reset-token-1234567890';
const INVALID_TOKEN = 'invalid-reset-token-1234567890';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/redefinir-senha']}>
      <Routes>
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/esqueci-senha" element={<div>Recuperar senha</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ResetPasswordPage (BL-05)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('lê o token do fragmento e o remove da URL', () => {
    window.history.replaceState(null, '', `/redefinir-senha#token=${VALID_TOKEN}`);

    renderPage();

    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar nova senha')).toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  it('mostra link inválido quando não há token no fragmento', () => {
    window.history.replaceState(null, '', '/redefinir-senha');

    renderPage();

    expect(screen.getByText(/link inválido ou expirado/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /solicitar novo link/i })).toHaveAttribute(
      'href',
      '/esqueci-senha'
    );
  });

  it('valida a confirmação da nova senha', async () => {
    window.history.replaceState(null, '', `/redefinir-senha#token=${VALID_TOKEN}`);
    renderPage();

    await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha123');
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'outraSenha123');
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(await screen.findByText(/as senhas não coincidem/i)).toBeInTheDocument();
  });

  it('exige senha forte antes de chamar a API', async () => {
    window.history.replaceState(null, '', `/redefinir-senha#token=${VALID_TOKEN}`);
    renderPage();

    await userEvent.type(screen.getByLabelText('Nova senha'), 'fraca');
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'fraca');
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(await screen.findByText(/no mínimo 8 caracteres/i)).toBeInTheDocument();
  });

  it('redefine a senha, encerra a sessão antiga e orienta o login sem abrir nova sessão', async () => {
    sessionStorage.setItem('auth_token', 'token-antigo');
    sessionStorage.setItem(
      'user_session',
      JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com' })
    );
    window.history.replaceState(null, '', `/redefinir-senha#token=${VALID_TOKEN}`);
    renderPage();

    await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha123');
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'novaSenha123');
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(
      await screen.findByRole('heading', { level: 1, name: /senha redefinida/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir para o login/i })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(sessionStorage.getItem('auth_token')).toBeNull();
    expect(sessionStorage.getItem('user_session')).toBeNull();
  });

  it('exibe mensagem clara para token inválido ou expirado', async () => {
    window.history.replaceState(null, '', `/redefinir-senha#token=${INVALID_TOKEN}`);
    renderPage();

    await userEvent.type(screen.getByLabelText('Nova senha'), 'novaSenha123');
    await userEvent.type(screen.getByLabelText('Confirmar nova senha'), 'novaSenha123');
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    expect(
      await screen.findByText(/link inválido ou expirado\. solicite uma nova redefinição/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /solicitar novo link/i })).toHaveAttribute(
      'href',
      '/esqueci-senha'
    );
  });
});
