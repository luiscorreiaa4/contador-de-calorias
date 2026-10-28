import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '../../../tests/setup/test-utils';
import { EditProfilePage } from '../EditProfilePage';
import { AccountPrivacyPage } from '../AccountPrivacyPage';
import { NotificationsPage } from '../NotificationsPage';
import { MemoryRouter } from 'react-router';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('EditProfilePage Component (PC-34 / TST-011)', () => {
  it('mantém apenas dados pessoais no perfil, sem medidas, metas, senha ou notificações', async () => {
    render(<MemoryRouter><EditProfilePage /></MemoryRouter>);

    await screen.findByDisplayValue('Test User');
    expect(screen.queryByRole('heading', { name: /medidas corporais/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /objetivo e rotina/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/nova senha/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ativar notificações/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /excluir conta/i })).not.toBeInTheDocument();
  });
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
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:mock'), configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve renderizar os campos do formulário com dados iniciais', async () => {
    render(
      <MemoryRouter>
        <EditProfilePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /^perfil$/i })).toBeInTheDocument();
    expect(await screen.findByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeDisabled();
    expect(screen.getByLabelText(/altura/i)).toBeInTheDocument();
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

  it('deve exportar os dados do usuário em JSON ao clicar em exportar (BL-10 / D-04)', async () => {
    render(
      <MemoryRouter>
        <AccountPrivacyPage />
      </MemoryRouter>
    );

    const exportButton = screen.getByRole('button', { name: /exportar meus dados/i });
    await userEvent.click(exportButton);

    expect(await screen.findByText(/seus dados foram exportados com sucesso/i)).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
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
      expect(screen.getByText(/alterações salvas com sucesso/i)).toBeInTheDocument();
    });
  });

  it('deve disparar lembrete de teste de push com sucesso (BL-27)', async () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    const testPushBtn = await screen.findByRole('button', { name: /enviar lembrete de teste/i });
    await userEvent.click(testPushBtn);

    await waitFor(() => {
      expect(screen.getByText(/lembrete de teste enviado com sucesso/i)).toBeInTheDocument();
    });
  });
});

