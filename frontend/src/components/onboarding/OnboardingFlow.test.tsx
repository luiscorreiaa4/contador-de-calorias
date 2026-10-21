import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { render } from '../../tests/setup/test-utils';
import { OnboardingFlow } from './OnboardingFlow';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('OnboardingFlow Component (PC-34 / TST-011)', () => {
  it('deve renderizar o primeiro passo com seleção de sexo e data de nascimento', () => {
    render(<OnboardingFlow />);

    expect(screen.getByText(/configurar perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/passo 1 de 5/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
  });

  it('deve exibir erros de validação ao tentar avançar sem preencher os campos do passo 1', async () => {
    render(<OnboardingFlow />);

    const continueBtn = screen.getByRole('button', { name: /continuar/i });
    await userEvent.click(continueBtn);

    expect(await screen.findByText(/selecione o sexo biológico/i)).toBeInTheDocument();
    expect(screen.getByText(/a data de nascimento é obrigatória/i)).toBeInTheDocument();
  });

  it('deve avançar para o passo 2 ao preencher dados válidos no passo 1', async () => {
    render(<OnboardingFlow />);

    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'masculino');

    const birthInput = screen.getByPlaceholderText(/dd\/mm\/aaaa/i);
    await userEvent.type(birthInput, '15/05/1995');

    const continueBtn = screen.getByRole('button', { name: /continuar/i });
    await userEvent.click(continueBtn);

    expect(await screen.findByText(/passo 2 de 5/i)).toBeInTheDocument();
    expect(screen.getByText(/qual é o seu objetivo principal/i)).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro quando a submissão final da API falha', async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    server.use(
      http.put(`${baseURL}/users/me/onboarding`, () => {
        return HttpResponse.json({ success: false, message: 'Dados inválidos no servidor' }, { status: 400 });
      })
    );

    render(<OnboardingFlow />);

    // Passo 1
    await userEvent.selectOptions(screen.getByRole('combobox'), 'masculino');
    await userEvent.type(screen.getByPlaceholderText(/dd\/mm\/aaaa/i), '15/05/1995');
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

    // Passo 2
    expect(await screen.findByText(/passo 2 de 5/i)).toBeInTheDocument();
    await userEvent.click(screen.getByText(/emagrecer/i));
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

    // Passo 3
    expect(await screen.findByText(/passo 3 de 5/i)).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/ex: 75/i), '80');
    await userEvent.type(screen.getByPlaceholderText(/ex: 175/i), '180');
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

    // Passo 4
    expect(await screen.findByText(/passo 4 de 5/i)).toBeInTheDocument();
    await userEvent.click(screen.getByText(/moderadamente ativo/i));
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));

    // Passo 5 - Revisão e Finalização
    expect(await screen.findByText(/passo 5 de 5/i)).toBeInTheDocument();
    const finishBtn = screen.getByRole('button', { name: /começar agora/i });
    await userEvent.click(finishBtn);

    await waitFor(() => {
      expect(screen.getByText(/dados inválidos no servidor/i)).toBeInTheDocument();
    });
  });
});
