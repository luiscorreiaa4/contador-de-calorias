import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '../../../tests/setup/test-utils';
import { EditProfilePage } from '../EditProfilePage';
import { MemoryRouter } from 'react-router';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('EditProfilePage Component (PC-34 / TST-011)', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'fake-jwt-token');
    localStorage.setItem(
      'user_session',
      JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        onboarding_completed: true,
      })
    );
  });

  it('deve renderizar os campos do formulário com dados iniciais', async () => {
    render(
      <MemoryRouter>
        <EditProfilePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /editar perfil/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
  });

  it('deve exibir erro de validação ao limpar o campo nome e perder o foco', async () => {
    render(
      <MemoryRouter>
        <EditProfilePage />
      </MemoryRouter>
    );

    // Aguarda carregar dados do usuário
    const nameInput = await screen.findByDisplayValue('Test User');
    await userEvent.clear(nameInput);
    await userEvent.tab();

    expect(await screen.findByText(/o nome é obrigatório/i)).toBeInTheDocument();
  });

  it('deve submeter o formulário com sucesso quando dados válidos forem enviados', async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    server.use(
      http.put(`${baseURL}/users/me`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          success: true,
          data: {
            id: '1',
            name: body.name || 'Nome Atualizado',
            email: 'test@example.com',
            goal: 'perder_peso',
          },
        });
      })
    );

    render(
      <MemoryRouter>
        <EditProfilePage />
      </MemoryRouter>
    );

    const nameInput = await screen.findByDisplayValue('Test User');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Nome Atualizado');

    const saveButton = screen.getByRole('button', { name: /salvar alterações/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/perfil atualizado com sucesso/i)).toBeInTheDocument();
    });
  });
});
