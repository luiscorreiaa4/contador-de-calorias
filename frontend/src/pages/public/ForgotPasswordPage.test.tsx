import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { render } from '../../tests/setup/test-utils';
import { ForgotPasswordPage } from './ForgotPasswordPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/esqueci-senha']}>
      <Routes>
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );

const GENERIC_MESSAGE =
  /se os dados estiverem corretos, enviaremos uma mensagem para o e-mail informado/i;

describe('ForgotPasswordPage (BL-05)', () => {
  it('renderiza o formulário de recuperação', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: /recuperar senha/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail da conta/i)).toBeInTheDocument();
  });

  it('valida o formato do e-mail no cliente', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText(/e-mail da conta/i), 'invalido');
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }));

    expect(await screen.findByText(/digite um e-mail válido/i)).toBeInTheDocument();
  });

  it('mostra resposta genérica idêntica para e-mail cadastrado', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText(/e-mail da conta/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }));

    expect(await screen.findByText(GENERIC_MESSAGE)).toBeInTheDocument();
  });

  it('não revela se a conta existe ao usar outro e-mail (A4)', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText(/e-mail da conta/i), 'nao-existe@example.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }));

    expect(await screen.findByText(GENERIC_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(/não encontrado|não cadastrado|inexistente/i)).not.toBeInTheDocument();
  });
});
