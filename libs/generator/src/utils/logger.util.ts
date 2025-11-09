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
      // eslint-disable-next-line no-console
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.log(`ℹ️  [INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  [WARN] ${message}`, ...args);
    }
  }

  static error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      // eslint-disable-next-line no-console
      console.error(`❌ [ERROR] ${message}`);
      if (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  }

  static success(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.SUCCESS) {
      // eslint-disable-next-line no-console
      console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
  }

  static section(title: string): void {
    // eslint-disable-next-line no-console
    console.log('\n' + '='.repeat(60));
    // eslint-disable-next-line no-console
    console.log(`  ${title}`);
    // eslint-disable-next-line no-console
    console.log('='.repeat(60) + '\n');
  }

  static step(step: number, total: number, message: string): void {
    // eslint-disable-next-line no-console
    console.log(`[${step}/${total}] ${message}`);
  }

  static progress(message: string): void {
    // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.log('(empty)');
      return;
    }
    // eslint-disable-next-line no-console
    console.table(data);
  }

  static box(message: string): void {
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map((l) => l.length));
    const border = '─'.repeat(maxLength + 2);

    // eslint-disable-next-line no-console
    console.log(`┌${border}┐`);
    lines.forEach((line) => {
      // eslint-disable-next-line no-console
      console.log(`│ ${line.padEnd(maxLength)} │`);
    });
    // eslint-disable-next-line no-console
    console.log(`└${border}┘`);
  }
}
