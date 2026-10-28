import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import {
  getMailer,
  getMemoryMailer,
  resetMailerForTests,
} from '../../src/mail/mailer.js';
import {
  existingAccountEmail,
  passwordChangedEmail,
  passwordResetEmail,
  verificationCodeEmail,
} from '../../src/mail/templates.js';

describe('Mailer e templates (D-21 / A10)', () => {
  beforeEach(() => {
    resetMailerForTests();
    getMemoryMailer().clear();
  });

  after(() => {
    resetMailerForTests();
  });

  it('usa MemoryMailer em NODE_ENV=test e mantém a caixa consultável', async () => {
    const mailer = getMailer();
    assert.strictEqual(mailer, getMemoryMailer());

    await mailer.send({
      to: 'tester-mail@example.com',
      subject: 'Assunto',
      text: 'Texto',
      html: '<p>Texto</p>',
    });

    const outbox = getMemoryMailer().getOutbox();
    assert.strictEqual(outbox.length, 1);
    assert.deepStrictEqual(outbox[0], {
      to: 'tester-mail@example.com',
      subject: 'Assunto',
      text: 'Texto',
      html: '<p>Texto</p>',
    });

    getMemoryMailer().clear();
    assert.strictEqual(getMemoryMailer().getOutbox().length, 0);
  });

  it('template de código contém o código, validade e orientação de descarte', () => {
    const tpl = verificationCodeEmail('042123', 'Ana <script>');
    assert.match(tpl.subject, /confirme seu e-mail/i);
    assert.match(tpl.text, /042123/);
    assert.match(tpl.text, /15 minutos/);
    assert.match(tpl.text, /ignore esta mensagem/i);
    assert.match(tpl.html, /042123/);
    assert.ok(tpl.html.includes('Ana &lt;script&gt;'), 'nome deve ser escapado no HTML');
    assert.doesNotMatch(tpl.html, /<img/i);
  });

  it('template de reset contém link, validade de 30 minutos e "se não foi você"', () => {
    const url = 'http://localhost:5173/redefinir-senha#token=abc123';
    const tpl = passwordResetEmail(url);
    assert.match(tpl.subject, /redefina sua senha/i);
    assert.ok(tpl.text.includes(url));
    assert.ok(tpl.html.includes(url));
    assert.match(tpl.text, /30 minutos/);
    assert.match(tpl.text, /Se não foi você, ignore/i);
    assert.doesNotMatch(tpl.html, /<img/i);
  });

  it('template de conta existente não expõe código nem link de ação', () => {
    const tpl = existingAccountEmail('Bia');
    assert.match(tpl.subject, /tentativa de cadastro/i);
    assert.match(tpl.text, /nenhuma alteração foi feita/i);
    assert.doesNotMatch(tpl.text, /\d{6}/);
    assert.doesNotMatch(tpl.text, /https?:\/\//);
  });

  it('template de senha alterada orienta a redefinir em caso de acesso indevido', () => {
    const tpl = passwordChangedEmail('Caio');
    assert.match(tpl.subject, /senha foi alterada/i);
    assert.match(tpl.text, /Se não foi você/i);
    assert.match(tpl.text, /Esqueci minha senha/i);
  });
});
