import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render } from '../../tests/setup/test-utils';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('deve renderizar os campos corretamente', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acessar dashboard/i })).toBeInTheDocument();
  });

  it('deve exibir erro se enviar vazio', async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: /acessar dashboard/i }));
    
    expect(await screen.findByText(/o email é obrigatório/i)).toBeInTheDocument();
    expect(await screen.findByText(/a senha é obrigatória/i)).toBeInTheDocument();
  });

  it('deve exibir erro da API para credenciais inválidas', async () => {
    render(<LoginForm />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input' }), '123456');
    await userEvent.click(screen.getByRole('button', { name: /acessar dashboard/i }));

    expect(await screen.findByText(/credenciais inválidas/i)).toBeInTheDocument();
  });

  it('deve chamar onSuccess e fazer login com sucesso', async () => {
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i, { selector: 'input' }), '123456');
    await userEvent.click(screen.getByRole('button', { name: /acessar dashboard/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
