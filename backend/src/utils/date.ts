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

const saoPauloTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export function getTimeInAppTz(date: Date): string {
  return saoPauloTimeFormatter.format(date);
}

export function combineDateAndTimeInAppTz(dateStr: string, timeDate: Date): Date {
  const timeStr = getTimeInAppTz(timeDate);
  return new Date(`${dateStr}T${timeStr}-03:00`);
}
