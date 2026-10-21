const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let json: ApiResponse<T> | null = null;

  if (contentType && contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  if (!response.ok || !json?.success) {
    const isUnauthorized =
      response.status === 401 ||
      (json as { code?: string })?.code === 'USER_NOT_FOUND' ||
      (response.status === 404 && json?.message === 'Usuário não encontrado.');

    if (isUnauthorized) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_session');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_session');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    const errorMessage =
      json?.message ??
      (response.status >= 500
        ? `Serviço temporariamente indisponível (${response.status}). Tente novamente mais tarde.`
        : `Erro na requisição (${response.status}).`);

    throw new Error(errorMessage);
  }

  return json.data as T;
}
