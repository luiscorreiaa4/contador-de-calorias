import { describe, expect, it } from 'vitest';
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
    await userEvent.click(await screen.findByRole('button', { name: /ativar mfa/i }));
    expect(await screen.findByText('ABCDEFGH')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/código de 6 dígitos/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /confirmar e ativar/i }));
    expect(await screen.findByText('AAAA-1111')).toBeInTheDocument();
  });
});
