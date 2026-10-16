---
name: backend-testing-guide
description: "Instruções para criação de testes automatizados no backend Node.js (TypeScript) usando Node Native Test Runner (node:test)."
---

# Guia de Testes Automatizados no Backend

Sempre que criar ou alterar um service, model ou controller no backend, proponha ou crie os testes correspondentes.

## 1. Ferramentas e Localização
- **Pasta dos testes:** `/backend/tests/`
  - Unitários: `/backend/tests/unit/[modulo].service.test.ts`
  - Integração: `/backend/tests/integration/[modulo].routes.test.ts`
- **Ferramentas:** `node:test` + `node:assert` (Node Native Test Runner) + `supertest` para rotas HTTP.
- **Execução:** via `tsx --test` no script `npm test` do backend.
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
import app from '../../src/app.js';

describe('POST /api/recursos (Integração)', () => {
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
- [ ] Todo teste que toca no banco DEVE ter `describe(...)` com `after` chamando `await pool.end()` em bloco `try / finally`.
- [ ] Execução validada via `npm run test` (suíte completa) ou `npm run test:backend:file <caminho>` (arquivo isolado).

## 7. Isolamento de Processos e Encerramento de Sockets (REGRA CRÍTICA)
- **Fechamento Obrigatório de Conexões:** O Node Native Test Runner (`node:test`) mantém o processo rodando enquanto houver sockets TCP ativos no Event Loop. Se o pool do PostgreSQL (`pool`) for importado no teste, o bloco `describe` DEVE conter um hook `after()` encapsulado em `try / finally` chamando `await pool.end()`:
  ```typescript
  describe('Minha Suíte', () => {
    after(async () => {
      try {
        await cleanupTestData('tester-...%');
      } finally {
        await pool.end(); // OBRIGATÓRIO: impede que o processo do Node fique travado no Event Loop
      }
    });
    // it(...)
  });
  ```
- **Proibição de `t.after` com subtestes (`t.test`):** Se um subteste falhar com `AssertionError` antes de alcançar `t.after()`, o hook nunca é registrado e o pool nunca fecha, congelando o processo indefinidamente. Utilize SEMPRE `describe(...)`, `it(...)` e `after(...)` no escopo do `describe`.
- **Execução de Testes Isolados (Arquivo Único):**
  - **Backend:** `npm run test:backend:file tests/integration/[nome].test.ts`
  - **Frontend:** `npm run test:frontend:file src/[modulo]/[nome].test.tsx`
  - O script oficial `npm run test:backend:file` garante o carregamento absoluto do arquivo `.env` e define `NODE_ENV=test`, `DB_NAME=contador_calorias_test` e `TZ=America/Sao_Paulo`.

