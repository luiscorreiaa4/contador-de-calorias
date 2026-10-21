import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { render } from '../../tests/setup/test-utils';
import { LoginForm } from './LoginForm';

const renderForm = (props: {
  onSuccess?: () => void;
  onEmailNotVerified?: (email: string, rememberMe: boolean) => void;
} = {}) =>
  render(
    <MemoryRouter>
      <LoginForm {...props} />
    </MemoryRouter>
  );

describe('LoginForm', () => {
  it('deve renderizar os campos corretamente', () => {
    renderForm();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acessar dashboard/i })).toBeInTheDocument();
  });

  it('deve exibir erro se enviar vazio', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /acessar dashboard/i }));

    expect(await screen.findByText(/o email é obrigatório/i)).toBeInTheDocument();
    expect(await screen.findByText(/a senha é obrigatória/i)).toBeInTheDocument();
  });

  it('deve exibir erro da API para credenciais inválidas', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input' }), 'senha123');
    await userEvent.click(screen.getByRole('button', { name: /acessar dashboard/i }));

    expect(await screen.findByText(/e-mail ou senha incorretos/i)).toBeInTheDocument();
  });

  it('deve encaminhar conta não verificada para a tela de código (EMAIL_NOT_VERIFIED)', async () => {
    const onEmailNotVerified = vi.fn();
    renderForm({ onEmailNotVerified });

    await userEvent.type(screen.getByLabelText(/email/i), 'unverified@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input' }), 'senha123');
    await userEvent.click(screen.getByRole('button', { name: /acessar dashboard/i }));

    await waitFor(() => {
      expect(onEmailNotVerified).toHaveBeenCalledWith('unverified@example.com', false);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('deve apontar o link de recuperação para /esqueci-senha', () => {
    renderForm();
    expect(screen.getByRole('link', { name: /esqueci minha senha/i })).toHaveAttribute(
      'href',
      '/esqueci-senha'
    );
  });

  it('deve chamar onSuccess e fazer login com sucesso', async () => {
    const onSuccess = vi.fn();
    renderForm({ onSuccess });

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input' }), 'senha123');
    await userEvent.click(screen.getByRole('button', { name: /acessar dashboard/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
