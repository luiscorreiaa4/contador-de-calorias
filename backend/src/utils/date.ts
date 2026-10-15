export const APP_TIMEZONE = 'America/Sao_Paulo';

const saoPauloDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Retorna a data no formato YYYY-MM-DD no fuso horário da aplicação (America/Sao_Paulo).
 * Conforme decisão D-01: o servidor é a autoridade de fuso da aplicação.
 */
export function todayInAppTz(now: Date = new Date()): string {
  return saoPauloDateFormatter.format(now);
}

export const getSaoPauloDateString = todayInAppTz;
