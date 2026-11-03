import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/index.css';

import App from './App.tsx';
import { hasStoredSession } from './services/api';
import { getInitialDarkMode } from './context/ThemeContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);

// Páginas públicas chegam pré-renderizadas (scripts/prerender.mjs); o resto usa a casca vazia.
// O prerender é deslogado e em tema claro: com sessão ou tema escuro o cliente renderiza outro
// header/ícone, e hidratar daria erro de hidratação e um re-render completo.
const rootEl = document.getElementById('root')!;
if (rootEl.hasChildNodes() && !hasStoredSession() && !getInitialDarkMode()) hydrateRoot(rootEl, app);
else createRoot(rootEl).render(app);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Falha ao registrar Service Worker:', err);
    });
  });
}
