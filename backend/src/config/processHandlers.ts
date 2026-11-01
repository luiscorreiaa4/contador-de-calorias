import { structuredLog } from './logger.js';

export function registerProcessHandlers(
  onShutdown: (signal: string) => Promise<void> | void = () => process.exit(1),
  proc: NodeJS.EventEmitter = process
) {
  proc.on('SIGTERM', () => {
    void onShutdown('SIGTERM');
  });

  proc.on('SIGINT', () => {
    void onShutdown('SIGINT');
  });

  proc.on('uncaughtException', (err: Error) => {
    structuredLog('error', 'uncaught_exception', {
      error: err?.message,
      stack: err?.stack,
    });
    void onShutdown('uncaughtException');
  });

  proc.on('unhandledRejection', (reason: unknown) => {
    structuredLog('error', 'unhandled_rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    void onShutdown('unhandledRejection');
  });
}

