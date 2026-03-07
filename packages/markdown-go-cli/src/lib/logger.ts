/**
 * Simple logger utility with prefixes and levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: any[]) {
    console.debug(this.format('debug', message), ...args);
  }

  info(message: string, ...args: any[]) {
    console.log(this.format('info', message), ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(this.format('warn', message), ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(this.format('error', message), ...args);
  }
}

export const createLogger = (prefix: string) => new Logger(prefix);

