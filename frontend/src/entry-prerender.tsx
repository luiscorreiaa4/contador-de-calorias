/* eslint-disable react-refresh/only-export-components -- entrada de build, sem HMR */
// Entrada SSR usada só no build (scripts/prerender.mjs): gera o HTML estático das páginas públicas.
import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { routes } from './router';

export { PUBLIC_PAGES, SITE_URL, OG_IMAGE, jsonLdFor } from './seo/pages';

export async function render(path: string): Promise<string> {
  const handler = createStaticHandler(routes);
  const context = await handler.query(new Request(`http://localhost${path}`));
  if (context instanceof Response) throw new Error(`Rota ${path} redirecionou no prerender`);
  const router = createStaticRouter(handler.dataRoutes, context);

  // prerender (e não renderToString) espera os componentes lazy carregarem.
  const { prelude } = await prerender(
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <StaticRouterProvider router={router} context={context} hydrate={false} />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
    // Sem isso o React separa trechos grandes num <div hidden> + <script> inline, que a CSP bloqueia.
    { progressiveChunkSize: Number.POSITIVE_INFINITY },
  );
  return new Response(prelude).text();
}
