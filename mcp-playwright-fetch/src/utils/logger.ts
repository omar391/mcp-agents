// Logger utility for controlled debug output
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'none';

class Logger {
    private level: LogLevel = 'info';

    constructor() {
        // Allow log level to be set via environment variable
        const envLevel = process.env.LOG_LEVEL as LogLevel;
        if (envLevel && ['error', 'warn', 'info', 'debug', 'none'].includes(envLevel)) {
            this.level = envLevel;
        }
    }

    private shouldLog(level: LogLevel): boolean {
        if (this.level === 'none') return false;
        const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
        return levels.indexOf(level) <= levels.indexOf(this.level);
    }

    error(...args: any[]): void {
        if (this.shouldLog('error')) {
            console.error('[ERROR]', ...args);
        }
    }

    warn(...args: any[]): void {
        if (this.shouldLog('warn')) {
            console.warn('[WARN]', ...args);
        }
    }

    info(...args: any[]): void {
        if (this.shouldLog('info')) {
            console.log('[INFO]', ...args);
        }
    }

    debug(...args: any[]): void {
        if (this.shouldLog('debug')) {
            console.log('[DEBUG]', ...args);
        }
    }

    // Special method for test failures
    testFailure(...args: any[]): void {
        // Always log test failures regardless of level
        console.error('[TEST FAILURE]', ...args);
    }
}

export const logger = new Logger();