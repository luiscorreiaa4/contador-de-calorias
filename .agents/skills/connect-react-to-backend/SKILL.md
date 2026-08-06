---
name: connect-react-to-backend
description: "Padroniza o consumo das rotas do backend Node.js no frontend React usando TypeScript e React Query."
---

# Guia de Integração Frontend (React) com o Backend

Sempre que criar componentes no React que se conectam com a API do Node.js, siga estas regras.

## 1. Organização
- Cliente HTTP centralizado em `/src/services/api.ts`. Nunca usar `fetch`/`axios` solto dentro de componentes.
- Utilize variáveis de ambiente para a URL da API (`import.meta.env.VITE_API_URL`).
- Tipos de resposta da API em `/src/types/` (compartilhando forma com os DTOs do backend sempre que possível).
- Toda chamada assíncrona à API passa por **React Query** (`useQuery` para leitura, `useMutation` para escrita) — nunca `useState` + `useEffect` manual.

## 2. Cliente HTTP Centralizado
```typescript
// /src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json: ApiResponse<T> = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message ?? 'Erro ao comunicar com a API.');
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
import { Example } from '../types/example.types';

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
  if (isError) return <p className="text-red-500 dark:text-red-400">{(error as Error).message}</p>;
  if (!itens || itens.length === 0) return <p>Nenhum item encontrado.</p>;

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
- [ ] `useQuery` para GET, `useMutation` para POST/PUT/DELETE.
- [ ] Estados loading/error/empty/data tratados.
- [ ] Classes Tailwind com suporte a `dark:` em qualquer texto/cor exibido (ver `style-rules.md`).
