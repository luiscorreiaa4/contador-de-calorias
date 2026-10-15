import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateEnvironment } from '../../scripts/reset-db.js';

describe('reset-db.js Environment Guard (CA-12 / SEC-010)', () => {
  it('deve permitir execução apenas quando NODE_ENV=test e DB_NAME termina com _test', () => {
    assert.doesNotThrow(() => {
      validateEnvironment({ NODE_ENV: 'test', DB_NAME: 'contador_calorias_test' });
    });
  });

  it('deve bloquear execução em ambiente de produção', () => {
    assert.throws(
      () => {
        validateEnvironment({ NODE_ENV: 'production', DB_NAME: 'contador_calorias_prod' });
      },
      /Proibido rodar reset-db fora do ambiente isolado de testes/
    );
  });

  it('deve bloquear execução em ambiente de desenvolvimento', () => {
    assert.throws(
      () => {
        validateEnvironment({ NODE_ENV: 'development', DB_NAME: 'contador_calorias' });
      },
      /Proibido rodar reset-db fora do ambiente isolado de testes/
    );
  });

  it('deve bloquear execução se o banco de dados não terminar com _test', () => {
    assert.throws(
      () => {
        validateEnvironment({ NODE_ENV: 'test', DB_NAME: 'contador_calorias' });
      },
      /Proibido rodar reset-db fora do ambiente isolado de testes/
    );
  });
});
