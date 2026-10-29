const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  code?: string;
}

export interface ApiResponseWithMeta<T> {
  data: T;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Erro de API com status HTTP e código de negócio (ex.: EMAIL_NOT_VERIFIED).
 * Permite que as telas reajam a fluxos específicos sem comparar mensagens.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function handleUnauthorizedCleanup() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_session');
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('user_session');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
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
      json?.code === 'USER_NOT_FOUND' ||
      (response.status === 404 && json?.message === 'Usuário não encontrado.');

    if (isUnauthorized) {
      handleUnauthorizedCleanup();
    }

    const errorMessage =
      json?.message ??
      (response.status >= 500
        ? `Serviço temporariamente indisponível (${response.status}). Tente novamente mais tarde.`
        : `Erro na requisição (${response.status}).`);

    throw new ApiError(errorMessage, response.status, json?.code);
  }

  return json.data as T;
}

export async function apiFetchWithMeta<T>(path: string, options?: RequestInit): Promise<ApiResponseWithMeta<T>> {
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
      json?.code === 'USER_NOT_FOUND' ||
      (response.status === 404 && json?.message === 'Usuário não encontrado.');

    if (isUnauthorized) {
      handleUnauthorizedCleanup();
    }

    const errorMessage =
      json?.message ??
      (response.status >= 500
        ? `Serviço temporariamente indisponível (${response.status}). Tente novamente mais tarde.`
        : `Erro na requisição (${response.status}).`);

    throw new ApiError(errorMessage, response.status, json?.code);
  }

  const meta = json.meta ?? {
    page: 1,
    pageSize: 25,
    total: Array.isArray(json.data) ? json.data.length : 0,
    totalPages: 1,
  };

  return {
    data: json.data as T,
    meta,
  };
}
