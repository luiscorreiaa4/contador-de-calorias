// Cloudflare Turnstile invisível (#6). Sem VITE_CAPTCHA_SITE_KEY o captcha fica desligado.
const SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY as string | undefined;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  execute(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile indisponível.'));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Não foi possível carregar a verificação de segurança.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** Token de uso único para o próximo envio; `undefined` quando o captcha está desligado. */
export async function getCaptchaToken(): Promise<string | undefined> {
  if (!SITE_KEY) return undefined;
  const turnstile = await loadTurnstile();

  return new Promise<string>((resolve, reject) => {
    // Fica vazio quando o desafio é invisível; só aparece se a Cloudflare exigir interação.
    const container = document.createElement('div');
    container.className = 'fixed bottom-4 right-4 z-50';
    document.body.appendChild(container);

    const finish = (widgetId: string) => {
      turnstile.remove(widgetId);
      container.remove();
    };
    const widgetId = turnstile.render(container, {
      sitekey: SITE_KEY,
      execution: 'execute',
      appearance: 'interaction-only',
      callback: (token: string) => {
        finish(widgetId);
        resolve(token);
      },
      'error-callback': () => {
        finish(widgetId);
        reject(new Error('Falha na verificação de segurança. Tente novamente.'));
      },
    });
    turnstile.execute(widgetId);
  });
}
