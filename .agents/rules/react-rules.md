---
trigger: always_on
description: Sempre que for alterar ou criar arquivos do react
---

# Regras Gerais do Projeto (React + Node + Postgres)

## Requisitos Gerais
- **Simplicidade:** Mantenha a arquitetura simples, modular e sem sobreengenharia desnecessária.
- **Obrigatório uso de TypeScript:** Todo o código do Frontend (React) e do Backend (Node.js) deve ser escrito em TypeScript (`.ts` / `.tsx`).
- **Linguagem:** Prefira código limpo e com nomes autodescritivos de variáveis e funções em inglês, mantendo comentários relevantes quando a regra de negócio for complexa.
- Evite o uso de `any`; defina interfaces claras para o banco de dados e para as respostas da API.

## Estrutura de Pastas do Frontend
- `src/components/`: componentes React pequenos, reutilizáveis e focados em uma única responsabilidade.
- `src/pages/` (ou `src/routes/`): componentes de página/rota, que compõem components menores.
- `src/hooks/`: custom hooks reutilizáveis (ex: `useAuth`, `useDebounce`).
- `src/services/`: cliente HTTP centralizado e funções de chamada à API (nunca `fetch` solto dentro de componentes).
- `src/types/`: tipos, interfaces e DTOs compartilhados no frontend.
- `src/context/` ou `src/store/`: estado global, se necessário (ver seção abaixo).

## Data Fetching e Comunicação com a API
- **Não usar `useEffect` + `useState` manual para chamadas de API.** Esse padrão é propenso a race conditions, falta de cache e código repetitivo.
- Adote **React Query (TanStack Query)** para toda chamada assíncrona à API (fetch, cache, revalidação, loading e erro).
- Centralize as chamadas HTTP em `src/services/api.ts` (instância única de `axios` ou `fetch` configurada com base URL e headers padrão), e consuma essa camada dentro dos hooks do React Query.
- Todo componente que consome dados assíncronos deve tratar explicitamente os estados de `loading`, `error` e `empty` (não deixar isso implícito).

## Estado
- **Estado local:** use `useState` para estado que pertence a um único componente.
- **Estado de servidor** (dados vindos da API): sempre via React Query, nunca duplicado manualmente em `useState`.
- **Estado global de UI/cliente** (ex: usuário logado, tema, sidebar aberta): use Context API para casos simples ou Zustand se o projeto crescer. Documente a escolha e não misture as duas abordagens no mesmo projeto.

## Formulários
- Para formulários com mais de 2-3 campos, use `react-hook-form` combinado com `zod` para validação, reaproveitando o schema equivalente do backend sempre que possível.

## Testes
- Componentes e hooks com lógica relevante devem ter testes com Vitest/Jest + React Testing Library. Priorize fluxos críticos (formulários, autenticação, listagens principais).
