---
name: connect-react-to-backend
description: "Padroniza o consumo das rotas do backend Node.js no frontend React usando TypeScript e React Query."
---

# Guia de Integração Frontend (React) com o Backend

Sempre que criar componentes no React que se conectam com a API do Node.js, siga estas regras.

## 1. Organização
- Cliente HTTP centralizado em `/src/services/api.ts`. Nunca usar `fetch`/`axios` solto dentro de componentes.
- Utilize variáveis de ambiente para a URL da API (`import.meta.env.VITE_API_URL`).
- Contratos/DTOs da API vêm de `@caloriesync/shared` (fonte única com o backend). Tipos exclusivos de UI ficam em `/src/types/`.
- Toda chamada assíncrona à API passa por **React Query** (`useQuery` para leitura, `useMutation` para escrita) — nunca `useState` + `useEffect` manual.

## 2. Cliente HTTP Centralizado
Resumo do contrato; a implementação real está em `src/services/api.ts` (leia antes de alterar). Erros de API são `ApiError` com `status`/`code`: decida o fluxo por eles, **nunca** pelo texto de `message`.
```typescript
// /src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

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

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options?.headers || {});

  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let json: ApiResponse<T> | null = null;

  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user_session');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error(json?.message || 'Sessão expirada. Faça login novamente.');
  }

  if (!response.ok || !json?.success) {
    throw new ApiError(json?.message ?? `Erro na requisição (${response.status})`, response.status, json?.code);
  }

  return json.data as T;
}
```

## 3. Types do Recurso
```typescript
// /src/types/example.types.ts
export interface Example {
  id: string;
  name: string;
  createdAt: string;
}
```

## 4. Query (leitura) com React Query
```typescript
// /src/services/example.service.ts
import { apiFetch } from './api';
import type { Example } from '@caloriesync/shared';

export function fetchExamples(): Promise<Example[]> {
  return apiFetch<Example[]>('/api/recursos');
}
```

```tsx
// /src/components/ListaRecursos.tsx
import { useQuery } from '@tanstack/react-query';
import { fetchExamples } from '../services/example.service';

export function ListaRecursos() {
  const { data: itens, isLoading, isError, error } = useQuery({
    queryKey: ['examples'],
    queryFn: fetchExamples,
  });

  if (isLoading) return <p>Carregando...</p>;
  if (isError) return <p className="text-destructive">{error.message}</p>;
  if (!itens || itens.length === 0) return <p className="text-muted-foreground">NENHUM ITEM ENCONTRADO</p>;

  return (
    <div>
      {itens.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

## 5. Mutation (escrita) com React Query
```typescript
// /src/services/example.service.ts (continuação)
export function createExample(name: string): Promise<Example> {
  return apiFetch<Example>('/api/recursos', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
```

```tsx
// dentro de um componente de formulário
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createExample } from '../services/example.service';

const queryClient = useQueryClient();
const { mutate, isPending, isError, error } = useMutation({
  mutationFn: createExample,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['examples'] });
  },
});
```

## 6. Tratamento Obrigatório na Tela
Todo componente que busca ou envia dados precisa tratar 4 estados:
- **Loading:** indicador de carregamento (`isLoading` / `isPending`).
- **Error:** mensagem de erro vinda da API (`error.message`).
- **Empty:** estado vazio explícito (ex: lista sem itens), não apenas tela em branco.
- **Data:** exibição normal dos dados.

## 7. Checklist antes de finalizar
- [ ] Arquivo em `.tsx`/`.ts`, sem `any`.
- [ ] Nenhum `fetch` direto dentro do componente — sempre via `services/`.
- [ ] `useQuery` para GET, `useMutation` para POST/PUT/DELETE, com `invalidateQueries` no `onSuccess`.
- [ ] Erros tratados por `ApiError.status`/`code`; e-mail/código/token de reset nunca em `localStorage`/`sessionStorage`.
- [ ] Formulários com 3+ campos usam `react-hook-form` + Zod.
- [ ] Testes com RTL (por papel/label) e rede só via MSW (`src/mocks/handlers.ts`).
- [ ] Classes Tailwind com tokens semânticos (`bg-background`, `text-foreground`, `border-border`), `rounded-none`, sem cores literais nem `dark:` de cor, conforme `style-rules.md` (`npm run lint` roda `check:colors`).
