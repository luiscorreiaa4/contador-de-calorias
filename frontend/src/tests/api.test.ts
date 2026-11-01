import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { apiFetch } from '../services/api';

describe('apiFetch resilience (PC-06)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('deve ler token do sessionStorage quando não estiver presente no localStorage', async () => {
    sessionStorage.setItem('auth_token', 'session_token_123');
    let capturedAuthHeader: string | null = null;

    server.use(
      http.get('http://localhost:3001/api/test-session-token', ({ request }) => {
        capturedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, data: { ok: true } });
      })
    );

    const data = await apiFetch<{ ok: boolean }>('/test-session-token');
    expect(data).toEqual({ ok: true });
    expect(capturedAuthHeader).toBe('Bearer session_token_123');
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it('deve tratar resposta 502 HTML sem quebrar com SyntaxError de JSON', async () => {
    server.use(
      http.get('http://localhost:3001/api/test-502', () => {
        return new HttpResponse('<html><body>502 Bad Gateway</body></html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        });
      })
    );

    await expect(apiFetch('/test-502')).rejects.toThrow(
      /serviço temporariamente indisponível \(502\)/i
    );
  });

  it('deve limpar localStorage e disparar evento auth:unauthorized ao receber status 401', async () => {
    localStorage.setItem('auth_token', 'expired_token');
    localStorage.setItem('user_session', JSON.stringify({ id: '1' }));

    server.use(
      http.get('http://localhost:3001/api/test-401', () => {
        return HttpResponse.json(
          { success: false, message: 'Token expirado ou inválido.' },
          { status: 401 }
        );
      })
    );

    const unauthorizedListener = vi.fn();
    window.addEventListener('auth:unauthorized', unauthorizedListener);

    await expect(apiFetch('/test-401')).rejects.toThrow(/token expirado ou inválido/i);

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_session')).toBeNull();
    expect(unauthorizedListener).toHaveBeenCalledTimes(1);

    window.removeEventListener('auth:unauthorized', unauthorizedListener);
  });
});
