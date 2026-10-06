import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render } from '../../tests/setup/test-utils';
import { RegisterForm } from './RegisterForm';

describe('RegisterForm', () => {
  it('deve exibir erros de validação local se dados inválidos', async () => {
    render(<RegisterForm />);
    
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));
    
    expect(await screen.findByText(/o nome é obrigatório/i)).toBeInTheDocument();
    expect(await screen.findByText(/o e-mail é obrigatório/i)).toBeInTheDocument();
    expect(await screen.findByText(/a senha é obrigatória/i)).toBeInTheDocument();
    expect(await screen.findByText(/confirme sua senha/i)).toBeInTheDocument();
  });

  it('deve exibir erro se senhas não coincidem', async () => {
    render(<RegisterForm />);
    
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input#register-password' }), '123456');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), '654321');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/as senhas não coincidem/i)).toBeInTheDocument();
  });

  it('deve falhar se email já existir (mockado pelo MSW)', async () => {
    render(<RegisterForm />);
    
    await userEvent.type(screen.getByLabelText(/nome/i), 'Test');
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input#register-password' }), '123456');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(await screen.findByText(/email já em uso/i)).toBeInTheDocument();
  });

  it('deve cadastrar com sucesso na API', async () => {
    const onSuccess = vi.fn();
    render(<RegisterForm onSuccess={onSuccess} />);
    
    await userEvent.type(screen.getByLabelText(/nome/i), 'Novo Usuário');
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'novo@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input#register-password' }), '123456');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
