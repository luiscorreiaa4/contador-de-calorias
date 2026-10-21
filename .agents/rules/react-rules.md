---
trigger: always_on
description: Regras obrigatórias e verificáveis para desenvolvimento de frontend React, TypeScript, TanStack Query e testes
---

# Regras de Frontend (React + TypeScript)

## 1. Tipagem e Simplicidade
- **TypeScript Estrito:** 100% do código do frontend deve ser tipado em `.ts` ou `.tsx`. O uso do tipo `any` ou type-casts com `as any` é **terminantemente proibido**.
- **Tipos e DTOs:** Contratos de API devem vir de `@caloriesync/shared` (fonte única com o backend). Interfaces exclusivas de UI podem residir em `src/types/` ou ser exportadas por arquivos de serviço.

## 2. Comunicação com a API e Data Fetching (Resolução de Ambiguidade)
- **Proibição de `fetch` Nativo:** O método `window.fetch()` nativo é **estritamente proibido** em qualquer componente, hook ou serviço, EXCETO dentro da implementação do cliente centralizado em `src/services/api.ts`.
- **Escopo do `apiFetch`:** A função `apiFetch` só pode ser importada e executada dentro de módulos da pasta `src/services/` (ex: `meal.service.ts`, `food.service.ts`, `auth.service.ts`, `goals.service.ts`). **Nenhum componente UI pode chamar `apiFetch` diretamente.**
- **Proibição de `useEffect` para Chamadas de API:** É **terminantemente proibido** invocar funções de serviço dentro de `useEffect` combinadas com `useState` para carregar ou sincronizar dados vindos do servidor.
- **Obrigatoriedade do TanStack Query (React Query v5):**
  - **Leitura (Queries):** Toda busca de dados da API deve ser realizada utilizando o hook `useQuery`, passando a função de serviço em `queryFn` e definindo `queryKey` e `staleTime` adequados.
  - **Escrita (Mutations):** Toda operação de criação, edição ou exclusão deve ser executada via `useMutation`, com invalidação explícita de cache via `queryClient.invalidateQueries` no callback `onSuccess`.
  - **Exceção Única (`AuthContext`):** O módulo `src/context/AuthContext.tsx` pode invocar diretamente serviços de autenticação (`loginUser`, `registerUser`, `getCurrentUserProfile`) exclusivamente para gerenciar a inicialização e persistência do token de sessão.

## 3. Tratamento Obrigatório de Estados Assíncronos
Todo componente que consome dados de queries assíncronas DEVE tratar explicitamente os seguintes estados visuais:
- **`isLoading` / `isPending`:** Renderização de indicador visual de carregamento ou skeleton (no estilo brutalista: texto em maiúsculas com feedback claro).
- **`isError`:** Renderização de mensagem clara e tratada de erro para o usuário.
- **Estado Vazio (`empty`):** Quando o array de dados retornado estiver vazio (`length === 0`), exibir mensagem contextual informando a ausência de registros (ex: "NENHUMA REFEIÇÃO REGISTRADA HOJE").

## 4. Formulários
- Formulários com 3 ou mais campos editáveis DEVEM utilizar `react-hook-form` integrado com resolvers de validação Zod (`@hookform/resolvers/zod`), aproveitando schemas conceituais compatíveis com o backend.
- É **proibido** criar estados manuais com mais de 3 variáveis de `useState` e funções imperativas de validação manual para formulários complexos.

## 5. Gerenciamento de Estado
- **Estado do Servidor:** Sempre gerenciado pelo TanStack Query (cache, invalidação e sincronização automática). Nunca duplicar dados de servidor em `useState`.
- **Estado Local da UI:** Utilizar `useState` apenas para estados transitórios locais de interface (ex: modal aberto/fechado, aba ativa, campo de busca em digitação).
- **Estado Global da UI:** `AuthContext.tsx` gerencia a sessão global do usuário.

## 6. Testes de Componentes (Vitest + Testing Library + MSW)
- **Consultas Exclusivas por Acessibilidade (RTL):** Elementos interativos e visuais DEVEM ser consultados exclusivamente através de `getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`. É **terminantemente proibido** selecionar elementos por classes CSS (`container.querySelector('.btn')`) ou por tags HTML genéricas.
- **Mocks Exclusivos via MSW:** Toda interceptação de requisições nos testes deve ser realizada no nível de rede com Mock Service Worker (`src/mocks/handlers.ts`). Mocks manuais de `global.fetch` são proibidos.
