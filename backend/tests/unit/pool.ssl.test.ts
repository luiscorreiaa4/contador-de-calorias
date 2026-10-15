import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getSslConfig } from '../../src/database/pool.js';

describe('Database Pool SSL Configuration (CA-05 / D-19)', () => {
  it('deve desabilitar SSL fora de produção por padrão', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const ssl = getSslConfig();
      assert.strictEqual(ssl, false);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('deve configurar SSL estrito com rejectUnauthorized: true em produção', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalCa = process.env.DB_SSL_CA;
    delete process.env.DB_SSL_CA;
    process.env.NODE_ENV = 'production';
    try {
      const ssl = getSslConfig();
      assert.notStrictEqual(ssl, false);
      if (typeof ssl === 'object' && ssl !== null) {
        assert.strictEqual(ssl.rejectUnauthorized, true);
        assert.strictEqual('ca' in ssl, false);
      }
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalCa !== undefined) process.env.DB_SSL_CA = originalCa;
    }
  });

  it('deve incluir certificado CA customizado se DB_SSL_CA for definido em produção', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalCa = process.env.DB_SSL_CA;
    process.env.NODE_ENV = 'production';
    process.env.DB_SSL_CA = '-----BEGIN CERTIFICATE-----\nFAKE\n-----END CERTIFICATE-----';
    try {
      const ssl = getSslConfig();
      assert.notStrictEqual(ssl, false);
      if (typeof ssl === 'object' && ssl !== null) {
        assert.strictEqual(ssl.rejectUnauthorized, true);
        assert.strictEqual(ssl.ca, '-----BEGIN CERTIFICATE-----\nFAKE\n-----END CERTIFICATE-----');
      }
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalCa !== undefined) {
        process.env.DB_SSL_CA = originalCa;
      } else {
        delete process.env.DB_SSL_CA;
      }
    }
  });
});
