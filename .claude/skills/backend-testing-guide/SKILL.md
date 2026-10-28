---
name: backend-testing-guide
description: "Instruções para criação de testes automatizados no backend Node.js (TypeScript) usando Node Native Test Runner (node:test)."
---

# Guia de Testes Automatizados no Backend

## Regra atual de execução e encerramento

Use exclusivamente `npm test`, `npm run test:strict` e `npm run test:file -- tests/...test.ts` (aliases oficiais também passam pelo wrapper). Nunca execute `tsx --test`/`npx` avulsos. O wrapper fixa CWD/ambiente e encerra a árvore após 300 s (`TEST_PROCESS_TIMEOUT_MS`). Comandos longos adicionais exigem `scripts/bounded-command.mjs`.

Todo arquivo que alcance pool/app diretamente ou por imports transitivos registra `closeTestPool()` de `tests/helpers/lifecycle.ts` antes dos testes. Para limpeza: `closeTestPool(async () => { await cleanupTestData('tester-recurso-%'); });`. O helper registra `after` com `try/finally` e fecha o pool mesmo se a limpeza falhar. Não registre outro `pool.end()`. Esta regra substitui os exemplos antigos de encerramento manual abaixo. A guarda AST integrada ao lint exige o helper.

Para autenticação por e-mail use `backend/tests/helpers/auth.ts` (`createVerifiedUser`, `lastEmailTo`, `verificationCodeFor`, `clearMailbox`); o `MemoryMailer` é forçado em `NODE_ENV=test`.

Valide sempre com `test:strict`, sem force-exit e sem allowExitOnIdle, além do comando padrão. O timeout herdado de 30 s do Node não cobre todos os handles restantes; o teto global é obrigatório. Banco exclusivamente `contador_calorias_test`, nunca reset/DROP/TRUNCATE.

Precisão sobre hooks: AssertionError não ignora automaticamente hooks já registrados. Um hook colocado depois de uma operação que lança nunca chega a ser registrado. Use describe/it e registre o encerramento antes de qualquer asserção.

Sempre que criar ou alterar um service, model ou controller no backend, proponha ou crie os testes correspondentes.

## 1. Ferramentas e Localização
- **Pasta dos testes:** `/backend/tests/`
  - Unitários: `/backend/tests/unit/[modulo].service.test.ts`
  - Integração: `/backend/tests/integration/[modulo].routes.test.ts`
- **Ferramentas:** `node:test` + `node:assert` (Node Native Test Runner) + `supertest` para rotas HTTP.
- **Execução:** somente pelos scripts oficiais da raiz (`npm test`, `npm run test:strict`, `npm run test:file -- tests/...`), que usam o wrapper com timeout; nunca `tsx --test` direto.
- **Banco Isolado:** Testes de integração rodam estritamente contra o banco de testes (`contador_calorias_test`). O pool aborta caso o banco não termine em `_test`.

## 2. O que testar em cada camada
- **Service (Unitário):** regras de negócio puras, cálculos matemáticos (ex: TMB, macros) e validações lógicas.
- **Controller/Rota (Integração):** caminho feliz e tratamento de erros HTTP via `supertest`.
- **Model:** queries com joins complexos ou agregações específicas (`LATERAL JOIN`).

## 3. Casos Obrigatórios de Teste (Rota)
1. **Caminho Feliz (200/201):** dados válidos retornando resposta correta, com `{ success: true, data: ... }`.
2. **Validação de Entrada (400):** envio de dados incompletos ou malformados, rejeitados pelo schema Zod.
3. **Não Autorizado (401/403):** requisições sem header `Authorization` ou com token inválido.
4. **Recurso Inexistente (404):** busca por ID inexistente.

## 4. Exemplo de Teste de Integração (Rota HTTP)
```typescript
// /backend/tests/integration/example.routes.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../../src/app.js';
import { closeTestPool } from '../helpers/lifecycle.js';

describe('POST /api/recursos (Integração)', () => {
  closeTestPool();

  it('deve retornar 401 quando o token JWT não é fornecido', async () => {
    const response = await request(app)
      .post('/api/recursos')
      .send({ name: 'Teste' });

    assert.strictEqual(response.status, 401);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Token não fornecido.');
  });

  it('deve retornar 400 quando o body não atende ao schema Zod', async () => {
    // Supondo token válido gerado para o teste
    const token = 'seu_token_de_teste';
    const response = await request(app)
      .post('/api/recursos')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // body vazio inválido

    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
  });
});
```

## 5. Exemplo de Teste Unitário de Service
```typescript
// /backend/tests/unit/example.service.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calcularMeta } from '../../src/services/example.service.js';

describe('Example Service (Unitário)', () => {
  it('deve calcular a meta calórica corretamente para déficit', () => {
    const resultado = calcularMeta({ peso: 80, altura: 180, objetivo: 'perder_peso' });
    assert.ok(resultado > 0);
    assert.strictEqual(typeof resultado, 'number');
  });
});
```

## 6. Checklist antes de finalizar
- [ ] Testes escritos em `.ts`, usando tipagens reais sem `any`.
- [ ] Imports padronizados com `from 'node:test'` e `from 'node:assert'`.
- [ ] Cobertura mínima: caminho feliz + validação 400 + 401 se houver autenticação.
- [ ] Testes não tocam no banco de desenvolvimento — apontam exclusivamente para `_test`.
- [ ] Todo teste que alcance pool/app, inclusive por imports transitivos, registra `closeTestPool()` antes dos testes e passa a limpeza como callback.
- [ ] Execução validada via `npm run test` (suíte completa) ou `npm run test:backend:file <caminho>` (arquivo isolado).

## 7. Isolamento de Processos e Encerramento de Sockets (REGRA CRÍTICA)
- **Fechamento Obrigatório de Conexões:** O helper central registra `after` e fecha o pool em `finally`, mesmo se a limpeza falhar. Não duplique `pool.end()` no arquivo:
  ```typescript
  describe('Minha Suíte', () => {
    closeTestPool(async () => {
      await cleanupTestData('tester-recurso-%');
    });
    // it(...)
  });
  ```
- **Registro anterior às asserções:** Uma falha antes de alcançar o registro impede que o hook exista; hooks já registrados não são automaticamente ignorados por AssertionError. Use describe/it e registre o helper antes dos testes. Clientes obtidos por `pool.connect()` precisam de `client.release()` em `finally`; servidores próprios, timers e listeners também exigem teardown.
- **Execução de Testes Isolados (Arquivo Único):**
  - **Backend:** `npm run test:backend:file tests/integration/[nome].test.ts`
  - **Frontend:** `npm run test:frontend:file src/[modulo]/[nome].test.tsx`
  - O script oficial `npm run test:backend:file` garante o carregamento absoluto do arquivo `.env` e define `NODE_ENV=test`, `DB_NAME=contador_calorias_test` e `TZ=America/Sao_Paulo`.

