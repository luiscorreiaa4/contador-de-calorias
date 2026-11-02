import { useEffect } from 'react';

/**
 * Garante que rotas privadas e sensíveis não sejam indexadas por motores de busca (robots: noindex, nofollow).
 */
export function useNoIndex(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
      created = true;
    }
    const previous = meta.content;
    meta.content = 'noindex, nofollow';

    return () => {
      if (created) {
        meta?.remove();
      } else if (meta) {
        meta.content = previous || 'index, follow';
      }
    };
  }, [enabled]);
}
