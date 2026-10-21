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
export class SmtpMailer implements Mailer {
  private readonly transporter: Transporter;

  constructor(config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
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

let activeMailer: Mailer | null = null;

function buildSmtpMailer(): SmtpMailer {
  if (!env.MAIL_SMTP_HOST || !env.MAIL_SMTP_PORT) {
    throw new Error('MAIL_SMTP_HOST e MAIL_SMTP_PORT são obrigatórios para MAIL_TRANSPORT=smtp.');
  }
  return new SmtpMailer({
    host: env.MAIL_SMTP_HOST,
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
