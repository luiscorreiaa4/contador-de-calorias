import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getSaoPauloDateString } from '../../src/utils/date.js';

describe('Date Utilities (getSaoPauloDateString - D-01 / CA-04)', () => {
  it('deve manter o dia correto às 21:30 em Brasília (quando UTC já virou o dia)', () => {
    // 21:30 BRT (UTC-3) corresponde a 00:30 UTC do dia seguinte
    const dateAt2130BRT = new Date('2026-10-15T21:30:00-03:00');
    
    // O toISOString() gerava o bug de virar o dia para 2026-10-16
    const buggyIsoDate = dateAt2130BRT.toISOString().split('T')[0];
    assert.strictEqual(buggyIsoDate, '2026-10-16');

    // A função corrigida fixa America/Sao_Paulo e mantém 2026-10-15
    const correctDate = getSaoPauloDateString(dateAt2130BRT);
    assert.strictEqual(correctDate, '2026-10-15');
  });

  it('deve manter o dia correto às 23:59 em Brasília', () => {
    const dateAt2359BRT = new Date('2026-10-15T23:59:59-03:00');
    const correctDate = getSaoPauloDateString(dateAt2359BRT);
    assert.strictEqual(correctDate, '2026-10-15');
  });

  it('deve virar o dia apenas após a meia-noite em Brasília', () => {
    const dateAt0001BRT = new Date('2026-10-16T00:01:00-03:00');
    const correctDate = getSaoPauloDateString(dateAt0001BRT);
    assert.strictEqual(correctDate, '2026-10-16');
  });
});
