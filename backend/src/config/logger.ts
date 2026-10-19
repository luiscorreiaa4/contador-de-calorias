/**
 * Logging estruturado em JSON (uma linha por evento).
 * Todo evento sai em `stdout` com os campos `level` e `time` para permitir
 * ingestão direta por coletores (12-factor).
 */
export type LogLevel = 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface StructuredLogRecord extends LogContext {
  level: LogLevel;
  time: string;
  message: string;
}

export function structuredLog(level: LogLevel, message: string, context: LogContext = {}): void {
  const record: StructuredLogRecord = {
    level,
    time: new Date().toISOString(),
    message,
    ...context,
  };

  console.log(JSON.stringify(record));
}
