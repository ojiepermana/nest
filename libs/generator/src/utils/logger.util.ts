/**
 * Simple logger utility for generator
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SUCCESS = 4,
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO;

  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  static debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`ℹ️  [INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`⚠️  [WARN] ${message}`, ...args);
    }
  }

  static error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`❌ [ERROR] ${message}`);
      if (error) {
        console.error(error);
      }
    }
  }

  static success(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.SUCCESS) {
      console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
  }

  static section(title: string): void {
    console.log('\n' + '='.repeat(60));

    console.log(`  ${title}`);

    console.log('='.repeat(60) + '\n');
  }

  static step(step: number, total: number, message: string): void;
  static step(message: string): void;
  static step(stepOrMessage: number | string, total?: number, message?: string): void {
    if (typeof stepOrMessage === 'string') {
      console.log(`⏩ ${stepOrMessage}`);
    } else {
      console.log(`[${stepOrMessage}/${total}] ${message}`);
    }
  }

  static progress(message: string): void {
    console.log(`⏳ ${message}...`);
  }

  static spinner(message: string): () => void {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const interval = setInterval(() => {
      process.stdout.write(`\r${frames[i]} ${message}...`);
      i = (i + 1) % frames.length;
    }, 80);

    return () => {
      clearInterval(interval);
      process.stdout.write('\r');
    };
  }

  static table(data: Record<string, unknown>[]): void {
    if (data.length === 0) {
      console.log('(empty)');
      return;
    }

    console.table(data);
  }

  static box(message: string): void;
  static box(lines: string[]): void;
  static box(messageOrLines: string | string[]): void {
    const lines = Array.isArray(messageOrLines) ? messageOrLines : messageOrLines.split('\n');
    const maxLength = Math.max(...lines.map((l) => l.length));
    const border = '─'.repeat(maxLength + 2);

    console.log(`┌${border}┐`);
    lines.forEach((line) => {
      console.log(`│ ${line.padEnd(maxLength)} │`);
    });

    console.log(`└${border}┘`);
  }
}
