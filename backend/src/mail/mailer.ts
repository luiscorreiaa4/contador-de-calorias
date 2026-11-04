import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Contrato único de envio (A10). Adaptadores não conhecem regras de negócio. */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/**
 * Adaptador de testes: mantém as mensagens em memória para inspeção.
 * Nunca é usado fora de `NODE_ENV=test`/`MAIL_TRANSPORT=memory`.
 */
export class MemoryMailer implements Mailer {
  private outbox: MailMessage[] = [];

  async send(message: MailMessage): Promise<void> {
    this.outbox.push({ ...message });
  }

  getOutbox(): readonly MailMessage[] {
    return [...this.outbox];
  }

  clear(): void {
    this.outbox = [];
  }
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
}

/**
 * Adaptador SMTP via nodemailer (Mailpit em dev, provedor em produção).
 */
class SmtpMailer implements Mailer {
  private readonly transporter: Transporter;

  constructor(config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: !config.secure && env.NODE_ENV === 'production',
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: config.user ? { user: config.user, pass: config.pass ?? '' } : undefined,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: env.MAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}

interface HttpMailerConfig {
  url: string;
  secret: string;
  timeoutMs?: number;
}

/**
 * Adaptador HTTPS para o Web App do Google Apps Script (Render grátis bloqueia SMTP).
 * O segredo vai no corpo porque o Apps Script não lê headers. O /exec responde 302
 * para script.googleusercontent.com; o fetch segue (POST vira GET, como esperado).
 * Mensagens de erro são fixas: são logadas e não podem carregar URL, segredo nem destinatário.
 */
export class HttpMailer implements Mailer {
  constructor(private readonly config: HttpMailerConfig) {}

  async send(message: MailMessage): Promise<void> {
    const signal = AbortSignal.timeout(this.config.timeoutMs ?? 10000);
    let response: Response;
    try {
      response = await fetch(this.config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: this.config.secret, ...message }),
        redirect: 'follow',
        signal,
      });
    } catch {
      // Sem `cause` de propósito: o erro do undici carrega a URL do script.
      throw new Error(signal.aborted ? 'mail_http_timeout' : 'mail_http_request_failed');
    }

    if (!response.ok) throw new Error(`mail_http_status_${response.status}`);

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error('mail_http_invalid_response');
    }
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('ok' in payload) ||
      payload.ok !== true
    ) {
      throw new Error('mail_http_rejected');
    }
  }
}

let activeMailer: Mailer | null = null;

function buildSmtpMailer(): SmtpMailer {
  if (!env.MAIL_SMTP_HOST || !env.MAIL_SMTP_PORT) {
    throw new Error('MAIL_SMTP_HOST e MAIL_SMTP_PORT são obrigatórios para MAIL_TRANSPORT=smtp.');
  }
  const host = env.MAIL_SMTP_HOST === 'localhost' ? '127.0.0.1' : env.MAIL_SMTP_HOST;
  return new SmtpMailer({
    host,
    port: Number(env.MAIL_SMTP_PORT),
    secure: env.MAIL_SMTP_SECURE,
    user: env.MAIL_SMTP_USER || undefined,
    pass: env.MAIL_SMTP_PASS || undefined,
  });
}

/**
 * Escolhe o adaptador por ambiente. Em testes, força MemoryMailer para permitir
 * inspeção da caixa sem rede.
 */
export function getMailer(): Mailer {
  if (activeMailer) return activeMailer;

  if (env.NODE_ENV === 'test' || env.MAIL_TRANSPORT === 'memory') {
    activeMailer = new MemoryMailer();
  } else if (env.MAIL_TRANSPORT === 'http') {
    if (!env.MAIL_HTTP_URL || !env.MAIL_HTTP_SECRET) {
      throw new Error(
        'MAIL_HTTP_URL e MAIL_HTTP_SECRET são obrigatórios para MAIL_TRANSPORT=http.',
      );
    }
    activeMailer = new HttpMailer({ url: env.MAIL_HTTP_URL, secret: env.MAIL_HTTP_SECRET });
  } else {
    activeMailer = buildSmtpMailer();
  }

  return activeMailer;
}

/** Acesso controlado à caixa em memória (somente testes). */
export function getMemoryMailer(): MemoryMailer {
  const mailer = getMailer();
  if (!(mailer instanceof MemoryMailer)) {
    throw new Error('MemoryMailer não está ativo neste ambiente.');
  }
  return mailer;
}

/** Reinicia o singleton entre suítes/arquivos de teste. */
export function resetMailerForTests(): void {
  activeMailer = null;
}
