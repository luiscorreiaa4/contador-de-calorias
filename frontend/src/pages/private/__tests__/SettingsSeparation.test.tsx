import { beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '../../../tests/setup/test-utils';
import { server } from '../../../mocks/server';
import { EditProfilePage } from '../EditProfilePage';
import { RoutinePage } from '../RoutinePage';
import { AccountSecurityPage } from '../AccountSecurityPage';
import { GoalSettingsCard } from '../../../components/profile/GoalSettingsCard';
import { MeasurementsPage } from '../MeasurementsPage';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

describe('Separação das tarefas de perfil e configurações', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_session', JSON.stringify({ id: '1', name: 'Test User', email: 'test@example.com', onboarding_completed: true }));
  });

  function captureProfileUpdates() {
    const requests: Record<string, unknown>[] = [];
    server.use(http.put(`${baseURL}/users/me`, async ({ request }) => {
      const body = await request.json() as Record<string, unknown>;
      requests.push(body);
      return HttpResponse.json({ success: true, data: {
        id: '1', name: 'Test User', email: 'test@example.com', sex: 'masculino', birth_date: '1990-01-01',
        goal: 'manter_peso', activity_level: 'moderadamente_ativo', height: 175, weight: 75, body_fat: 15,
        onboarding_completed: true, ...body,
      } });
    }));
    return requests;
  }

  it('salva dados pessoais sem reenviar medidas, objetivo ou senha', async () => {
    const requests = captureProfileUpdates();
    render(<MemoryRouter><EditProfilePage /></MemoryRouter>);
    const input = await screen.findByLabelText(/nome completo/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'Novo Nome');
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));
    await waitFor(() => expect(requests).toEqual([{ name: 'Novo Nome', sex: 'masculino', birthDate: '01/01/1990', height: 175 }]));
  });

  it('não permite alterar o e-mail no perfil e permite alterar a altura', async () => {
    const requests = captureProfileUpdates();
    render(<MemoryRouter><EditProfilePage /></MemoryRouter>);
    const emailInput = await screen.findByLabelText(/^e-mail$/i);
    expect(emailInput).toBeDisabled();

    const heightInput = screen.getByLabelText(/altura/i);
    await userEvent.clear(heightInput);
    await userEvent.type(heightInput, '180');
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));
    await waitFor(() => expect(requests).toEqual([{ name: 'Test User', sex: 'masculino', birthDate: '01/01/1990', height: 180 }]));
  });

  it('salva objetivo e rotina sem alterar dados pessoais ou medidas', async () => {
    const requests = captureProfileUpdates();
    render(<MemoryRouter><RoutinePage /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('radio', { name: /emagrecer/i }));
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));
    await waitFor(() => expect(requests).toEqual([{ goal: 'perder_peso', activity_level: 'moderadamente_ativo' }]));
    expect(screen.queryByLabelText(/nome completo/i)).not.toBeInTheDocument();
  });

  it('altera senha sem exigir preenchimento de perfil ou medidas', async () => {
    const requests = captureProfileUpdates();
    render(<MemoryRouter><AccountSecurityPage /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/^senha atual/i), 'Atual123');
    await userEvent.type(screen.getByLabelText(/^nova senha/i), 'NovaSenha456');
    await userEvent.type(screen.getByLabelText(/confirmar nova senha/i), 'NovaSenha456');
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));
    await waitFor(() => expect(requests).toEqual([{ currentPassword: 'Atual123', newPassword: 'NovaSenha456' }]));
    expect(screen.getByLabelText(/^senha atual/i)).toHaveValue('');
  });

  it('bloqueia confirmação de senha divergente', async () => {
    const requests = captureProfileUpdates();
    render(<MemoryRouter><AccountSecurityPage /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/^senha atual/i), 'Atual123');
    await userEvent.type(screen.getByLabelText(/^nova senha/i), 'NovaSenha456');
    await userEvent.type(screen.getByLabelText(/confirmar nova senha/i), 'Diferente456');
    await userEvent.click(screen.getByRole('button', { name: /salvar alterações/i }));
    expect(await screen.findByText(/as senhas não coincidem/i)).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('não exibe opção de alterar altura na tela de peso e medidas', async () => {
    render(<MemoryRouter><MeasurementsPage embedded /></MemoryRouter>);
    await screen.findByRole('heading', { name: /peso e medidas/i });
    expect(screen.queryByRole('heading', { name: /dados corporais/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /salvar altura/i })).not.toBeInTheDocument();
  });

  it('permite aplicar metas manuais com validação e salvamento próprio', async () => {
    const requests: Record<string, unknown>[] = [];
    server.use(http.put(`${baseURL}/users/me/goals`, async ({ request }) => {
      const body = await request.json() as Record<string, unknown>;
      requests.push(body);
      return HttpResponse.json({ success: true, data: body });
    }));
    render(<MemoryRouter><GoalSettingsCard /></MemoryRouter>);
    await screen.findByRole('button', { name: /^manual$/i });
    expect(screen.queryByRole('button', { name: /aplicar metas/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^manual$/i }));
    expect(screen.getByRole('button', { name: /aplicar metas/i })).toBeInTheDocument();
    const calories = screen.getByLabelText(/calorias/i);
    await userEvent.clear(calories);
    await userEvent.type(calories, '1950');
    await userEvent.click(screen.getByRole('button', { name: /aplicar metas/i }));
    await waitFor(() => expect(requests).toEqual([{ calories: 1950, proteins: 150, carbs: 220, fats: 70, mode: 'manual' }]));
  });

  it('não salva nem exibe mensagem ao alternar para manual e voltar para o automático quando o modo já salvo for auto', async () => {
    const requests: Record<string, unknown>[] = [];
    server.use(http.put(`${baseURL}/users/me/goals`, async ({ request }) => {
      const body = await request.json() as Record<string, unknown>;
      requests.push(body);
      return HttpResponse.json({ success: true, data: body });
    }));
    render(<MemoryRouter><GoalSettingsCard /></MemoryRouter>);
    await screen.findByRole('button', { name: /^manual$/i });
    expect(screen.queryByRole('button', { name: /aplicar metas/i })).not.toBeInTheDocument();
    
    // Alterna para manual sem salvar
    await userEvent.click(screen.getByRole('button', { name: /^manual$/i }));
    expect(screen.getByRole('button', { name: /aplicar metas/i })).toBeInTheDocument();
    
    // Retorna para automático
    await userEvent.click(screen.getByRole('button', { name: /^automático$/i }));
    expect(screen.getByLabelText(/calorias/i)).toHaveValue(2100);
    expect(screen.queryByRole('button', { name: /aplicar metas/i })).not.toBeInTheDocument();
    
    // Não deve ter enviado requisição e não deve exibir mensagem de alterações salvas
    expect(requests).toHaveLength(0);
    expect(screen.queryByText(/alterações salvas com sucesso/i)).not.toBeInTheDocument();
  });

  it('ativa o modo automático e salva na API quando a meta salva anterior era manual', async () => {
    const requests: Record<string, unknown>[] = [];
    server.use(
      http.get(`${baseURL}/users/me/goals`, () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 'goal-manual',
            user_id: '1',
            effective_from: '2026-01-01',
            calories: 1900,
            proteins: 140,
            carbs: 210,
            fats: 60,
            mode: 'manual',
            created_at: '2026-01-01T00:00:00Z',
          },
        });
      }),
      http.put(`${baseURL}/users/me/goals`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        requests.push(body);
        return HttpResponse.json({ success: true, data: body });
      })
    );
    render(<MemoryRouter><GoalSettingsCard /></MemoryRouter>);
    await screen.findByRole('button', { name: /^automático$/i });
    expect(screen.getByRole('button', { name: /aplicar metas/i })).toBeInTheDocument();
    
    // Clica em automático para ativar
    await userEvent.click(screen.getByRole('button', { name: /^automático$/i }));
    expect(screen.queryByRole('button', { name: /aplicar metas/i })).not.toBeInTheDocument();
    await waitFor(() => expect(requests).toEqual([{ calories: 2100, proteins: 150, carbs: 230, fats: 65, mode: 'auto' }]));
  });

  it('exibe falha ao carregar perfil em vez de abrir formulário incompleto', async () => {
    server.use(http.get(`${baseURL}/users/me`, () => HttpResponse.json({ success: false, message: 'Falha ao carregar perfil' }, { status: 500 })));
    render(<MemoryRouter><EditProfilePage /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao carregar perfil');
    expect(screen.queryByLabelText(/nome completo/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });
});
