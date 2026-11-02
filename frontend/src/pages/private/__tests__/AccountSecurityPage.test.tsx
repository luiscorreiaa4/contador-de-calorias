import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '../../../tests/setup/test-utils';
import { server } from '../../../mocks/server';
import { AccountSecurityPage } from '../AccountSecurityPage';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const mfaHeading = { name: /verificação em duas etapas/i };

function mockProfile(data: { role: 'user' | 'admin'; mfa_enabled: boolean }) {
  let served = false;
  server.use(
    http.get(`${baseURL}/users/me`, () => {
      served = true;
      return HttpResponse.json({ success: true, data: { id: '1', ...data } });
    }),
  );
  return () => served;
}

describe('AccountSecurityPage: visibilidade da verificação em duas etapas', () => {
  it('esconde o cartão para usuário comum sem MFA', async () => {
    const wasServed = mockProfile({ role: 'user', mfa_enabled: false });
    render(<AccountSecurityPage />);
    await waitFor(() => expect(wasServed()).toBe(true));
    // Dá tempo de a resposta chegar ao componente antes de afirmar a ausência.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('heading', mfaHeading)).toBeNull();
  });

  it('mostra o cartão para administrador', async () => {
    mockProfile({ role: 'admin', mfa_enabled: false });
    render(<AccountSecurityPage />);
    expect(await screen.findByRole('heading', mfaHeading)).toBeInTheDocument();
  });

  it('mantém o cartão para usuário comum que já ativou, para poder desativar', async () => {
    mockProfile({ role: 'user', mfa_enabled: true });
    render(<AccountSecurityPage />);
    expect(await screen.findByRole('heading', mfaHeading)).toBeInTheDocument();
  });
});
