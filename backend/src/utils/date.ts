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

export function getTimezoneOffsetForDate(date: Date = new Date(), timeZone: string = APP_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(date);
  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT-03:00';
  return tzPart.replace('GMT', '');
}

export function combineDateAndTimeInAppTz(dateStr: string, timeDate: Date): Date {
  const timeStr = getTimeInAppTz(timeDate);
  const offset = getTimezoneOffsetForDate(timeDate);
  return new Date(`${dateStr}T${timeStr}${offset}`);
}

export function getDayBoundariesInAppTz(dateStr: string): { startIso: string; endIso: string } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0));
  const nextDateStr = getSaoPauloDateString(nextDay);

  const startRef = new Date(`${dateStr}T12:00:00Z`);
  const nextRef = new Date(`${nextDateStr}T12:00:00Z`);

  const startOffset = getTimezoneOffsetForDate(startRef);
  const endOffset = getTimezoneOffsetForDate(nextRef);

  return {
    startIso: `${dateStr}T00:00:00${startOffset}`,
    endIso: `${nextDateStr}T00:00:00${endOffset}`,
  };
}
