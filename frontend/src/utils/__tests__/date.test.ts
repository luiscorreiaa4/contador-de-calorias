import { describe, it, expect } from 'vitest';
import {
  getLocalDateString,
  isValidLocalDateString,
  parseLocalDateString,
  parseLocalDateOrToday,
  addDaysToDateString,
} from '../date';

describe('Date utilities (BL-02 / D-20)', () => {
  it('valida strings YYYY-MM-DD de calendário real', () => {
    expect(isValidLocalDateString('2026-10-15')).toBe(true);
    expect(isValidLocalDateString('2026-02-30')).toBe(false);
    expect(isValidLocalDateString('15/10/2026')).toBe(false);
    expect(isValidLocalDateString(undefined)).toBe(false);
    expect(isValidLocalDateString(null)).toBe(false);
  });

  it('converte YYYY-MM-DD em Date local sem deslocar o dia', () => {
    const parsed = parseLocalDateString('2026-10-15');
    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(2026);
    expect(parsed!.getMonth()).toBe(9);
    expect(parsed!.getDate()).toBe(15);
  });

  it('retorna null quando a entrada é inválida no parse estrito', () => {
    expect(parseLocalDateString('data-invalida')).toBeNull();
    expect(parseLocalDateString(undefined)).toBeNull();
  });

  it('retorna a data corrente quando usa a variante explícita parseLocalDateOrToday', () => {
    expect(getLocalDateString(parseLocalDateOrToday('data-invalida'))).toBe(getLocalDateString());
  });

  it('soma e subtrai dias atravessando o mês', () => {
    expect(addDaysToDateString('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysToDateString('2026-11-01', -1)).toBe('2026-10-31');
    expect(addDaysToDateString('2026-10-19', 0)).toBe('2026-10-19');
  });
});
