import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from '../pages/public/LoginPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';

const queryClient = new QueryClient();

describe('LoginPage', () => {
  it('renderiza o cabeçalho e os botões de tab de login', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </QueryClientProvider>
    );

    // Usa consulta RTL baseada em acessibilidade
    const heading = screen.getByRole('heading', { level: 1, name: /bem-vindo de volta/i });
    expect(heading).toBeInTheDocument();

    const loginTab = screen.getByRole('tab', { name: /entrar/i });
    expect(loginTab).toBeInTheDocument();
  });
});
