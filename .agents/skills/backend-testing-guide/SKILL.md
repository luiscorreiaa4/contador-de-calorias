---
name: backend-testing-guide
description: "Instruções para criação de testes automatizados no backend Node.js (TypeScript)."
---

# Guia de Testes Automatizados no Backend

Sempre que criar ou alterar um service ou controller no backend, proponha ou crie os testes correspondentes.

## 1. Localização dos Arquivos
- Pasta dos testes: `/backend/tests/`
- Nome do arquivo: `[modulo].test.ts`
- Ferramenta: Vitest (ou Jest) + `supertest` para testes de rota HTTP.

## 2. O que testar em cada camada
- **Service:** regras de negócio isoladas (mockando o model). É aqui que fica a maior parte da cobertura.
- **Controller/Rota (integração):** caminho feliz e principais erros de HTTP, via `supertest`.
- **Model:** opcional, cobrir apenas queries com lógica não trivial (joins complexos, filtros dinâmicos).

## 3. Casos Obrigatórios de Teste (rota)
1. **Caminho Feliz (200/201):** dados válidos retornando resposta correta, com `success: true`.
2. **Validação de Entrada (400):** envio de dados incompletos/inválidos, rejeitado pelo schema zod.
3. **Recurso Inexistente (404):** busca por ID que não existe.
4. **Não Autorizado (401/403):** se a rota exigir autenticação/autorização, testar acesso sem token e com permissão insuficiente.

## 4. Exemplo de Teste de Integração (rota)
```typescript
// /backend/tests/example.test.ts
import request from 'supertest';
import app from '../src/app';

describe('POST /api/recursos', () => {
  it('deve criar um recurso e retornar HTTP 201', async () => {
    const response = await request(app).post('/api/recursos').send({ name: 'Teste' });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('id');
  });

  it('deve retornar 400 quando o campo obrigatório não é enviado', async () => {
    const response = await request(app).post('/api/recursos').send({});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
  });
});

describe('GET /api/recursos/:id', () => {
  it('deve retornar 404 para um recurso inexistente', async () => {
    const response = await request(app).get('/api/recursos/id-inexistente');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
  });
});
```

## 5. Exemplo de Teste de Service (unitário, com mock do model)
```typescript
// /backend/tests/example.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import * as ExampleModel from '../src/models/example.model';
import * as ExampleService from '../src/services/example.service';

describe('ExampleService.getById', () => {
  it('deve lançar erro com statusCode 404 quando o item não existe', async () => {
    vi.spyOn(ExampleModel, 'findById').mockResolvedValue(null);
    await expect(ExampleService.getById('id-inexistente')).rejects.toMatchObject({ statusCode: 404 });
  });
});
```

## 6. Checklist antes de finalizar
- [ ] Testes em `.ts`, usando os tipos reais do recurso (sem `any`).
- [ ] Cobertura mínima: caminho feliz + validação + 404 (+ 401/403 se houver auth).
- [ ] Regras de negócio complexas testadas no nível de service, não só na rota.
- [ ] Testes não dependem de banco de dados real rodando (usar mock do model ou banco de teste isolado).
