import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { render } from '../../tests/setup/test-utils';
import { RegisterForm } from './RegisterForm';

const renderForm = (props: { onSuccess?: () => void } = {}) =>
  render(
    <MemoryRouter>
      <RegisterForm {...props} />
    </MemoryRouter>
  );

describe('RegisterForm', () => {
  it('deve exibir erros de validação local se dados inválidos', async () => {
    renderForm();

    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/o nome é obrigatório/i)).toBeInTheDocument();
    expect(await screen.findByText(/o email é obrigatório/i)).toBeInTheDocument();
    expect(await screen.findByText(/a senha é obrigatória/i)).toBeInTheDocument();
    expect(await screen.findByText(/confirme sua senha/i)).toBeInTheDocument();
  });

  it('deve exigir o aceite dos termos de uso (BL-11 / LGPD)', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText(/nome/i), 'Test');
    await userEvent.type(screen.getByLabelText(/email/i), 'novo@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input#register-password' }), 'senhaSegura123');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'senhaSegura123');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/aceite os termos de uso/i)).toBeInTheDocument();
  });

  it('deve exibir erro se a senha for fraca (menos de 8 caracteres ou sem letra/número)', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input#register-password' }), 'fraca');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/mínimo 8 caracteres com letra e número/i)).toBeInTheDocument();
  });

  it('deve exibir erro se senhas não coincidem', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input#register-password' }), 'senhaSegura123');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'outraSenha123');
    await userEvent.click(screen.getByRole('checkbox', { name: /aceito os termos/i }));
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/as senhas não coincidem/i)).toBeInTheDocument();
  });

  it('deve falhar se email já existir (mockado pelo MSW)', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText(/nome/i), 'Test');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input#register-password' }), 'senhaSegura123');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'senhaSegura123');
    await userEvent.click(screen.getByRole('checkbox', { name: /aceito os termos/i }));
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/email já em uso/i)).toBeInTheDocument();
  });

  it('deve cadastrar com sucesso na API', async () => {
    const onSuccess = vi.fn();
    renderForm({ onSuccess });

    await userEvent.type(screen.getByLabelText(/nome/i), 'Novo Usuário');
    await userEvent.type(screen.getByLabelText(/email/i), 'novo@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input#register-password' }), 'senhaSegura123');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'senhaSegura123');
    await userEvent.click(screen.getByRole('checkbox', { name: /aceito os termos/i }));
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
