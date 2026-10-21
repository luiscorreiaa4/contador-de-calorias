export function getLocalDateString(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA');
}

/** Valida uma string de data no formato YYYY-MM-DD (calendário real). */
export function isValidLocalDateString(value?: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

/**
 * Converte YYYY-MM-DD numa Date local (00:00), sem o deslocamento de
 * fuso que `new Date('YYYY-MM-DD')` provoca ao interpretar como UTC.
 */
export function parseLocalDateString(value?: string | null): Date {
  if (isValidLocalDateString(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
}

/** Desloca uma data YYYY-MM-DD em N dias, retornando outra YYYY-MM-DD. */
export function addDaysToDateString(value: string, days: number): string {
  const base = parseLocalDateString(value);
  base.setDate(base.getDate() + days);
  return getLocalDateString(base);
}
