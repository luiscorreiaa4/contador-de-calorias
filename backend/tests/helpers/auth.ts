import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { pool } from '../../src/database/pool.js';
import { signAuthToken } from '../../src/utils/jwt.js';
import { getMemoryMailer, type MailMessage } from '../../src/mail/mailer.js';

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
  token: string;
}

export interface CreateVerifiedUserOptions {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Cria uma conta já verificada diretamente no banco de testes e devolve um JWT com `tv`.
 * Usado pelas suítes que precisam apenas de uma sessão válida, sem passar pelo fluxo de e-mail.
 */
export async function createVerifiedUser(
  options: CreateVerifiedUserOptions = {}
): Promise<TestUser> {
  const name = options.name ?? 'Tester';
  const email = (options.email ?? `tester-${randomUUID()}@example.com`).trim().toLowerCase();
  const password = options.password ?? 'senhaForte123';
  const passwordHash = await bcrypt.hash(password, 1);

  const result = await pool.query<{ id: string; name: string; email: string; token_version: number }>(
    `INSERT INTO users (name, email, password_hash, terms_accepted_at, email_verified_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, name, email, token_version`,
    [name.trim(), email, passwordHash]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password,
    token: signAuthToken(row.id, Number(row.token_version)),
  };
}

/** Marca a conta como verificada (usado após exercitar o cadastro real via HTTP). */
export async function markEmailVerified(email: string): Promise<void> {
  const result = await pool.query(
    `UPDATE users
        SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
      WHERE lower(email) = lower($1)`,
    [email.trim().toLowerCase()]
  );
  if ((result.rowCount ?? 0) === 0) {
    throw new Error(`Usuário de teste não encontrado para verificação: ${email}`);
  }
}

/** Última mensagem enviada ao endereço (MemoryMailer). */
export function lastEmailTo(email: string): MailMessage | undefined {
  const normalized = email.trim().toLowerCase();
  return [...getMemoryMailer().getOutbox()]
    .reverse()
    .find((message) => message.to.trim().toLowerCase() === normalized);
}

/** Extrai o código de 6 dígitos do último e-mail de verificação enviado. */
export function verificationCodeFor(email: string): string {
  const message = lastEmailTo(email);
  if (!message) {
    throw new Error(`Nenhum e-mail encontrado para ${email}`);
  }
  const match = message.text.match(/\b(\d{6})\b/);
  if (!match) {
    throw new Error(`Código de verificação não encontrado no e-mail para ${email}`);
  }
  return match[1];
}

/** Limpa a caixa de saída em memória entre cenários. */
export function clearMailbox(): void {
  getMemoryMailer().clear();
}
