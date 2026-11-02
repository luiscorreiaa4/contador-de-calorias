import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { render, screen } from '../../../tests/setup/test-utils';
import { NotificationsPage } from '../NotificationsPage';
import * as pushService from '../../../services/push.service';

describe('NotificationsPage Component (BL-27 / FEAT-C09)', () => {
  beforeEach(() => {
    localStorage.setItem('auth_session', 'test-token');
    localStorage.setItem(
      'user_session',
      JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        onboarding_completed: true,
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve renderizar a página com o checkbox de ativação de notificações e botão de teste', async () => {
    vi.spyOn(pushService, 'getPushSubscriptionStatus').mockResolvedValue({
      isSupported: true,
      permission: 'default',
      isSubscribed: false,
    });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /^notificações$/i })).toBeInTheDocument();

    const pushCheckbox = await screen.findByRole('checkbox', {
      name: /ativar lembretes de refeições via notificação push/i,
    });
    expect(pushCheckbox).toBeInTheDocument();
    expect(pushCheckbox).toBeDisabled();
    expect(pushCheckbox).not.toBeChecked();
    expect(screen.getByText(/temporariamente desabilitado/i)).toBeInTheDocument();

    const emailCheckbox = screen.getByRole('checkbox', {
      name: /ativar notificações por e-mail/i,
    });
    expect(emailCheckbox).toBeInTheDocument();
    expect(emailCheckbox).toBeDisabled();
    expect(emailCheckbox).not.toBeChecked();

    const phoneCheckbox = screen.getByRole('checkbox', {
      name: /ativar notificações no telefone/i,
    });
    expect(phoneCheckbox).toBeInTheDocument();
    expect(phoneCheckbox).toBeDisabled();
    expect(phoneCheckbox).not.toBeChecked();

    const inProgressBadges = screen.getAllByText(/em implementação/i);
    expect(inProgressBadges.length).toBe(2);

    expect(screen.queryByRole('button', { name: /enviar lembrete de teste/i })).toBeNull();
    expect(screen.queryByText(/diagnóstico do serviço/i)).toBeNull();
  });
});
