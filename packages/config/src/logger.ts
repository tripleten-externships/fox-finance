import winston from "winston";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFormat = "json" | "pretty";

/**
 * Configuration options for the logger.
 *
 * This logger uses console-only output, which is the best practice for containerized
 * environments (Docker, ECS, Kubernetes) because:
 * - CloudWatch Logs and other container logging solutions automatically capture stdout/stderr
 * - File logging in containers causes disk space issues (ephemeral storage)
 * - Log files are lost on container restart and not accessible for debugging
 * - Centralized logging (CloudWatch, DataDog, etc.) provides better search, retention, and alerting
 *
 * In production, logs are output in JSON format for structured logging and easier parsing.
 * In development, logs use a pretty-printed format with colors for better readability.
 */
export interface LoggerOptions {
  /**
   * Minimum log level to output.
   * @default "info"
   */
  level?: LogLevel;
  /**
   * Output format for logs.
   * - "json": Structured JSON output (recommended for production)
   * - "pretty": Human-readable colored output (recommended for development)
   * @default "json" in production, "pretty" in development
   */
  format?: LogFormat;
  /**
   * Service name to include in all log messages.
   * Useful for identifying logs from different services in centralized logging.
   * @default "app"
   */
  service?: string;
}

export interface LogContext {
  [key: string]: any;
}

/**
 * Creates a Winston format for pretty console output with colors
 */
const prettyFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    ({ timestamp, level, message, service, ...metadata }) => {
      const metaStr =
        Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : "";
      const serviceStr = service ? `[${service}] ` : "";
      return `[${timestamp}] ${level} ${serviceStr}${message}${metaStr}`;
    }
  )
);

/**
 * Creates a Winston format for JSON output
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Creates a Winston logger instance with console-only output.
 *
 * This logger is designed for containerized environments where:
 * - All console output (stdout/stderr) is automatically captured by CloudWatch Logs
 * - File-based logging would waste ephemeral disk space and be inaccessible after restarts
 * - Structured JSON logging in production enables better log parsing and analysis
 *
 * @param options - Configuration options for the logger
 * @returns A configured Winston logger instance
 */
function createWinstonLogger(options: LoggerOptions = {}): winston.Logger {
  const {
    level = "info",
    format = process.env.NODE_ENV === "production" ? "json" : "pretty",
    service = "app",
  } = options;

  // Console-only transport - logs are captured by CloudWatch/container logging
  const consoleTransport = new winston.transports.Console({
    format: format === "json" ? jsonFormat : prettyFormat,
  });

  return winston.createLogger({
    level,
    defaultMeta: { service },
    transports: [consoleTransport],
  });
}

/**
 * Logger class that wraps Winston and provides a clean API
 */
export class Logger {
  private logger: winston.Logger;

  constructor(options: LoggerOptions = {}) {
    this.logger = createWinstonLogger(options);
  }

  /**
   * Create a child logger with additional default metadata
   */
  child(metadata: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.logger = this.logger.child(metadata);
    return childLogger;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: LogContext): void {
    this.logger.error(message, context);
  }

  /**
   * Set the log level dynamically
   */
  setLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  /**
   * Get the underlying Winston logger instance (for advanced use cases)
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

// Singleton instance
let defaultLogger: Logger;

/**
 * Initialize the default logger with specific options
 */
export function initLogger(options: LoggerOptions): void {
  defaultLogger = new Logger(options);
}

/**
 * Get the default logger instance
 * If not initialized, creates a default logger
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger();
  }
  return defaultLogger;
}

/**
 * Create a new logger instance with specific options
 * Useful for creating isolated logger instances
 */
export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}
