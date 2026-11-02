import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { registerProcessHandlers } from '../../src/config/processHandlers.js';

describe('Process Handlers Hardening (#17)', () => {
  it('deve invocar shutdown em SIGTERM', () => {
    const emitter = new EventEmitter();
    let invokedSignal: string | null = null;

    registerProcessHandlers((sig) => {
      invokedSignal = sig;
    }, emitter);

    emitter.emit('SIGTERM');
    assert.strictEqual(invokedSignal, 'SIGTERM');
  });

  it('deve invocar shutdown em SIGINT', () => {
    const emitter = new EventEmitter();
    let invokedSignal: string | null = null;

    registerProcessHandlers((sig) => {
      invokedSignal = sig;
    }, emitter);

    emitter.emit('SIGINT');
    assert.strictEqual(invokedSignal, 'SIGINT');
  });

  it('deve capturar uncaughtException e invocar shutdown', () => {
    const emitter = new EventEmitter();
    let invokedSignal: string | null = null;

    registerProcessHandlers((sig) => {
      invokedSignal = sig;
    }, emitter);

    emitter.emit('uncaughtException', new Error('Falha catastrófica de runtime'));
    assert.strictEqual(invokedSignal, 'uncaughtException');
  });

  it('deve capturar unhandledRejection e invocar shutdown', () => {
    const emitter = new EventEmitter();
    let invokedSignal: string | null = null;

    registerProcessHandlers((sig) => {
      invokedSignal = sig;
    }, emitter);

    emitter.emit('unhandledRejection', new Error('Promise rejeitada sem catch'));
    assert.strictEqual(invokedSignal, 'unhandledRejection');
  });
});
