/**
 * Templates de e-mail transacional em pt-BR (A10).
 * Funções puras: recebem dados e devolvem { subject, text, html }.
 * Sem imagens remotas, sem pixels, sem links rastreados.
 */

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

const BRAND = 'CalorieSync';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(title: string, paragraphs: string[]): string {
  const body = paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1a1a1a;">${paragraph}</p>`)
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f5f5f0;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:2px solid #1a1a1a;">
      <tr>
        <td style="padding:24px 24px 8px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#555;">${BRAND}</p>
          <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#1a1a1a;">${title}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px;">${body}</td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-top:2px solid #1a1a1a;font-size:12px;color:#555;">
          Este é um e-mail automático. Não responda.
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function greeting(name?: string): string {
  const safeName = name?.trim();
  return safeName ? `Olá, ${escapeHtml(safeName)}.` : 'Olá.';
}

export function verificationCodeEmail(code: string, name?: string): EmailTemplate {
  const subject = `${BRAND}: confirme seu e-mail`;
  const text = [
    greeting(name),
    '',
    `Seu código de confirmação é: ${code}`,
    '',
    'O código expira em 15 minutos e pode ser usado uma única vez.',
    'Se você não solicitou este cadastro, ignore esta mensagem.',
  ].join('\n');
  const html = layout('Confirme seu e-mail', [
    greeting(name),
    `Seu código de confirmação é:`,
    `<span style="display:inline-block;padding:12px 20px;border:2px solid #1a1a1a;font-size:28px;letter-spacing:8px;font-weight:bold;">${escapeHtml(code)}</span>`,
    'O código expira em 15 minutos e pode ser usado uma única vez.',
    'Se você não solicitou este cadastro, ignore esta mensagem.',
  ]);
  return { subject, text, html };
}

export function passwordResetEmail(resetUrl: string, name?: string): EmailTemplate {
  const subject = `${BRAND}: redefina sua senha`;
  const text = [
    greeting(name),
    '',
    'Recebemos um pedido para redefinir a senha da sua conta.',
    `Acesse o link abaixo para criar uma nova senha (válido por 30 minutos):`,
    resetUrl,
    '',
    'O link pode ser usado uma única vez. Se não foi você, ignore esta mensagem.',
  ].join('\n');
  const html = layout('Redefina sua senha', [
    greeting(name),
    'Recebemos um pedido para redefinir a senha da sua conta.',
    'O link abaixo é válido por 30 minutos e pode ser usado uma única vez:',
    `<a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 20px;background:#1a1a1a;color:#ffffff;text-decoration:none;font-weight:bold;">Criar nova senha</a>`,
    'Se não foi você, ignore esta mensagem. Sua senha atual continua válida.',
  ]);
  return { subject, text, html };
}

export function existingAccountEmail(name?: string): EmailTemplate {
  const subject = `${BRAND}: tentativa de cadastro com seu e-mail`;
  const text = [
    greeting(name),
    '',
    'Alguém tentou criar uma conta no CalorieSync usando este endereço de e-mail.',
    'Sua conta já existe e está verificada; nenhuma alteração foi feita.',
    '',
    'Se foi você, entre com sua senha ou use a opção "Esqueci minha senha".',
    'Se não foi você, ignore esta mensagem.',
  ].join('\n');
  const html = layout('Tentativa de cadastro com seu e-mail', [
    greeting(name),
    'Alguém tentou criar uma conta no CalorieSync usando este endereço de e-mail.',
    'Sua conta já existe e está verificada; <strong>nenhuma alteração foi feita</strong>.',
    'Se foi você, entre com sua senha ou use a opção "Esqueci minha senha".',
    'Se não foi você, ignore esta mensagem.',
  ]);
  return { subject, text, html };
}

export function passwordChangedEmail(name?: string): EmailTemplate {
  const subject = `${BRAND}: sua senha foi alterada`;
  const text = [
    greeting(name),
    '',
    'A senha da sua conta foi alterada com sucesso.',
    '',
    'Se não foi você, redefina sua senha imediatamente pela opção "Esqueci minha senha" e verifique o acesso à sua caixa de e-mail.',
  ].join('\n');
  const html = layout('Sua senha foi alterada', [
    greeting(name),
    'A senha da sua conta foi alterada com sucesso.',
    'Se não foi você, redefina sua senha imediatamente pela opção "Esqueci minha senha" e verifique o acesso à sua caixa de e-mail.',
  ]);
  return { subject, text, html };
}
