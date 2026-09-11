import { Injectable } from '@angular/core';

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private currentLevel: LogLevel = 'debug';

  debug(...args: unknown[]): void {
    if (this.canLog('debug')) {
      console.debug('[DEBUG]', ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.canLog('info')) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.canLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.canLog('error')) {
      console.error('[ERROR]', ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  private canLog(level: LogLevel): boolean {
    return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(this.currentLevel);
  }
}