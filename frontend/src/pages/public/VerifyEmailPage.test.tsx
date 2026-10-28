import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { render } from '../../tests/setup/test-utils';
import { VerifyEmailPage } from './VerifyEmailPage';

const renderPage = (
  state?: { email?: string; codeSent?: boolean; rememberMe?: boolean }
) =>
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/verificar-email', state }]}
    >
      <Routes>
        <Route path="/verificar-email" element={<VerifyEmailPage />} />
        <Route path="/" element={<div>Diário</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('VerifyEmailPage (BL-12)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('exibe o e-mail recebido pelo router e o campo de código acessível', () => {
    renderPage({ email: 'novo@example.com', codeSent: true });

    expect(screen.getByRole('heading', { level: 1, name: /confirme seu e-mail/i })).toBeInTheDocument();
    expect(screen.getByText('novo@example.com')).toBeInTheDocument();

    const codeInput = screen.getByLabelText(/código de 6 dígitos/i);
    expect(codeInput).toHaveAttribute('inputMode', 'numeric');
    expect(codeInput).toHaveAttribute('autocomplete', 'one-time-code');
    expect(codeInput).toHaveAttribute('maxLength', '6');
  });

  it('inicia a contagem de 60 s quando um código acabou de ser enviado', () => {
    renderPage({ email: 'novo@example.com', codeSent: true });

    const resend = screen.getByRole('button', { name: /reenviar código em 60s/i });
    expect(resend).toBeDisabled();
  });

  it('permite digitar o e-mail quando a página é recarregada sem estado', async () => {
    renderPage();

    const emailInput = screen.getByLabelText(/e-mail da conta/i);
    await userEvent.type(emailInput, 'novo@example.com');
    await userEvent.type(screen.getByLabelText(/código de 6 dígitos/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /confirmar e-mail/i }));

    expect(await screen.findByText('Diário')).toBeInTheDocument();
  });

  it('confirma o código, abre a sessão e navega para o diário', async () => {
    renderPage({ email: 'novo@example.com', codeSent: true });

    await userEvent.type(screen.getByLabelText(/código de 6 dígitos/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /confirmar e-mail/i }));

    expect(await screen.findByText('Diário')).toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBe('verified-token');
    });
  });

  it('exibe mensagem clara para código inválido ou expirado', async () => {
    renderPage({ email: 'novo@example.com', codeSent: true });

    await userEvent.type(screen.getByLabelText(/código de 6 dígitos/i), '000000');
    await userEvent.click(screen.getByRole('button', { name: /confirmar e-mail/i }));

    expect(await screen.findByText(/código inválido ou expirado/i)).toBeInTheDocument();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('reenvia o código e respeita o novo intervalo de 60 s', async () => {
    renderPage({ email: 'novo@example.com' });

    const resend = screen.getByRole('button', { name: /^reenviar código$/i });
    expect(resend).toBeEnabled();

    await userEvent.click(resend);

    expect(
      await screen.findByText(/se os dados estiverem corretos, enviaremos uma nova mensagem/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reenviar código em 60s/i })).toBeDisabled();
  });

  it('não persiste o e-mail ou o código em localStorage/sessionStorage', async () => {
    renderPage({ email: 'privado@example.com', codeSent: true });

    await userEvent.type(screen.getByLabelText(/código de 6 dígitos/i), '1234');

    expect(JSON.stringify(localStorage)).not.toContain('privado@example.com');
    expect(JSON.stringify(sessionStorage)).not.toContain('privado@example.com');
    expect(JSON.stringify(localStorage)).not.toContain('1234');
    expect(JSON.stringify(sessionStorage)).not.toContain('1234');
  });
});
