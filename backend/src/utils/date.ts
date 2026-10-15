/**
 * Utilitários de manipulação de data e fuso horário.
 * Conforme decisão D-01: O servidor fixa America/Sao_Paulo via Intl.
 */

const saoPauloDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Retorna a data no formato YYYY-MM-DD no fuso horário America/Sao_Paulo.
 * Evita o bug de virada de data às 21h BRT (00h UTC) gerado por toISOString().split('T')[0].
 */
export function getSaoPauloDateString(date: Date = new Date()): string {
  return saoPauloDateFormatter.format(date);
}
