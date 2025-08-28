export type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug' | 'trace';

export type ConsoleRedirectFunction = (
  level: LogLevel,
  message: unknown,
  ...args: unknown[]
) => void;

export interface ConsoleLogHandlingOptions {
  disableInProduction?: boolean;

  disabledLevels?: LogLevel[];

  redirectFunction?: ConsoleRedirectFunction;

  logLevelsToRedirect?: LogLevel[];
}

interface ResolvedConsoleConfig {
  disableInProduction: boolean;
  disabledLevels: LogLevel[];
  redirectFunction?: ConsoleRedirectFunction;
  logLevelsToRedirect: LogLevel[];
}

type ConsoleMethods = Record<LogLevel, (...args: unknown[]) => void>;

export function handleConsoleLogs(options?: ConsoleLogHandlingOptions): void {
  const isProduction = process.env.NODE_ENV === 'production';

  const config: ResolvedConsoleConfig = {
    disableInProduction: true,
    disabledLevels: [],
    redirectFunction: undefined,
    logLevelsToRedirect: [],
    ...options,
  };

  if (isProduction && config.disableInProduction) {
    disableAllConsoleLogs();
  } else if (config.disabledLevels.length > 0 || config.redirectFunction) {
    handleSpecificConsoleLogs(config);
  }
}

function disableAllConsoleLogs(): void {
  const consoleAsMethods = console as ConsoleMethods;

  consoleAsMethods.log = () => {};
  consoleAsMethods.warn = () => {};
  consoleAsMethods.error = () => {};
  consoleAsMethods.info = () => {};
  consoleAsMethods.debug = () => {};
  consoleAsMethods.trace = () => {};
}

function handleSpecificConsoleLogs(config: ResolvedConsoleConfig): void {
  const originalConsole: ConsoleMethods = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
    trace: console.trace,
  };

  const allLogLevels: LogLevel[] = [
    'log',
    'warn',
    'error',
    'info',
    'debug',
    'trace',
  ];

  const consoleAsMethods = console as ConsoleMethods;

  allLogLevels.forEach((level) => {
    if (config.disabledLevels.includes(level)) {
      consoleAsMethods[level] = () => {};
    } else if (
      config.redirectFunction &&
      config.logLevelsToRedirect.includes(level)
    ) {
      consoleAsMethods[level] = (...args: unknown[]) => {
        config.redirectFunction!(level, ...args);
      };
    } else {
      consoleAsMethods[level] = originalConsole[level];
    }
  });
}
