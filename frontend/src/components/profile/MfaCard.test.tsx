import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render, screen } from '../../tests/setup/test-utils';
import { server } from '../../mocks/server';
import { MfaCard } from './MfaCard';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

describe('MfaCard', () => {
  it('ativa o MFA e exibe os códigos de recuperação uma vez', async () => {
    server.use(
      http.get(`${baseURL}/users/me`, () =>
        HttpResponse.json({ success: true, data: { id: '1', mfa_enabled: false } }),
      ),
      http.post(`${baseURL}/users/me/mfa/setup`, () =>
        HttpResponse.json({
          success: true,
          data: { secret: 'ABCDEFGH', otpauth_url: 'otpauth://totp/x' },
        }),
      ),
      http.post(`${baseURL}/users/me/mfa/enable`, () =>
        HttpResponse.json({ success: true, data: { recovery_codes: ['AAAA-1111'] } }),
      ),
    );
    render(<MfaCard />);
    expect(await screen.findByText(/app autenticador no celular/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /começar/i }));
    expect(await screen.findByRole('img', { name: /qr code/i })).toBeInTheDocument();
    expect(screen.getByText('ABCDEFGH')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/código de 6 dígitos/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /confirmar e ativar/i }));
    expect(await screen.findByText('AAAA-1111')).toBeInTheDocument();
  });

  it('desativa com código de recuperação alternando o campo', async () => {
    let sent: unknown;
    server.use(
      http.get(`${baseURL}/users/me`, () =>
        HttpResponse.json({ success: true, data: { id: '1', mfa_enabled: true } }),
      ),
      http.post(`${baseURL}/users/me/mfa/disable`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    render(<MfaCard />);
    expect(await screen.findByLabelText(/código do app autenticador/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /usar código de recuperação/i }));
    await user.type(screen.getByLabelText(/código de recuperação/i), '3f9a1c7b2e');
    await user.click(screen.getByRole('button', { name: /desativar verificação/i }));
    await vi.waitFor(() => expect(sent).toEqual({ code: '3f9a1c7b2e' }));
  });

  it('copia a chave e avisa quando a cópia falha', async () => {
    server.use(
      http.get(`${baseURL}/users/me`, () =>
        HttpResponse.json({ success: true, data: { id: '1', mfa_enabled: false } }),
      ),
      http.post(`${baseURL}/users/me/mfa/setup`, () =>
        HttpResponse.json({
          success: true,
          data: { secret: 'ABCDEFGH', otpauth_url: 'otpauth://totp/x' },
        }),
      ),
    );
    const user = userEvent.setup();
    render(<MfaCard />);
    await user.click(await screen.findByRole('button', { name: /começar/i }));
    const copy = await screen.findByRole('button', { name: /copiar chave/i });

    await user.click(copy);
    expect(await screen.findByText('CHAVE COPIADA')).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe('ABCDEFGH');

    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('negado'));
    await user.click(copy);
    expect(await screen.findByText(/selecione a chave manualmente/i)).toBeInTheDocument();
  });
});
