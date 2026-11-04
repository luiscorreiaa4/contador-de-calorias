import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { HttpMailer } from '../../src/mail/mailer.js';

const SECRET = 'segredo-de-teste-com-mais-de-32-caracteres-0123456789';
const MESSAGE = {
  to: 'tester-http@example.com',
  subject: 'Assunto',
  text: 'Código 123456',
  html: '<p>Código 123456</p>',
};

type Handler = (req: http.IncomingMessage, body: string, res: http.ServerResponse) => void;

describe('HttpMailer (MAIL_TRANSPORT=http)', () => {
  const routes = new Map<string, Handler>();
  let server: http.Server;
  let base = '';

  before(async () => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => (body += chunk.toString()));
      req.on('end', () => {
        const handler = routes.get(new URL(req.url ?? '/', base).pathname);
        if (handler) handler(req, body, res);
        else res.writeHead(404).end();
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const json = (res: http.ServerResponse, status: number, payload: unknown) =>
    res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(payload));

  const mailerFor = (path: string, timeoutMs?: number) =>
    new HttpMailer({ url: `${base}${path}`, secret: SECRET, timeoutMs });

  /** A mensagem do erro é logada: não pode carregar URL, segredo, destinatário nem conteúdo. */
  const assertSafeRejection = async (path: string, timeoutMs?: number) => {
    await assert.rejects(mailerFor(path, timeoutMs).send(MESSAGE), (error: unknown) => {
      assert.ok(error instanceof Error);
      for (const leak of [base, '127.0.0.1', path, SECRET, MESSAGE.to, '123456']) {
        assert.ok(!error.message.includes(leak), `mensagem vazou "${leak}": ${error.message}`);
      }
      return true;
    });
  };

  it('envia { secret, to, subject, text, html } por POST JSON e aceita ok:true', async () => {
    let received: { method?: string; type?: string; body?: unknown } = {};
    routes.set('/ok', (req, body, res) => {
      received = { method: req.method, type: req.headers['content-type'], body: JSON.parse(body) };
      json(res, 200, { ok: true });
    });

    await mailerFor('/ok').send(MESSAGE);

    assert.strictEqual(received.method, 'POST');
    assert.match(received.type ?? '', /application\/json/);
    assert.deepStrictEqual(received.body, { secret: SECRET, ...MESSAGE });
  });

  it('segue o redirect 302 do Apps Script e usa a resposta final', async () => {
    let finalMethod = '';
    routes.set('/exec', (_req, _body, res) => res.writeHead(302, { Location: '/echo' }).end());
    routes.set('/echo', (req, _body, res) => {
      finalMethod = req.method ?? '';
      json(res, 200, { ok: true });
    });

    await mailerFor('/exec').send(MESSAGE);
    assert.strictEqual(finalMethod, 'GET');
  });

  it('rejeita ok:false (segredo errado)', async () => {
    routes.set('/denied', (_req, _body, res) => json(res, 200, { ok: false }));
    await assertSafeRejection('/denied');
  });

  it('rejeita ok que não seja exatamente true', async () => {
    routes.set('/truthy', (_req, _body, res) => json(res, 200, { ok: 'true' }));
    await assertSafeRejection('/truthy');
  });

  it('rejeita resposta HTML (ex.: página de login do Google)', async () => {
    routes.set('/html', (_req, _body, res) =>
      res.writeHead(200, { 'Content-Type': 'text/html' }).end('<html>login</html>'),
    );
    await assertSafeRejection('/html');
  });

  it('rejeita status 500 mesmo com corpo ok:true', async () => {
    routes.set('/500', (_req, _body, res) => json(res, 500, { ok: true }));
    await assertSafeRejection('/500');
  });

  it('rejeita JSON inválido', async () => {
    routes.set('/broken', (_req, _body, res) =>
      res.writeHead(200, { 'Content-Type': 'application/json' }).end('{ok:'),
    );
    await assertSafeRejection('/broken');
  });

  it('aborta por timeout quando o script não responde', async () => {
    routes.set('/slow', () => {
      /* nunca responde; o after encerra a conexão */
    });
    await assertSafeRejection('/slow', 100);
  });
});
