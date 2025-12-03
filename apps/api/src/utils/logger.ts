type logLevel = "debug" | "info" | "warn" | "error";

function log(level: logLevel, message: string, meta?: Record<string, unknown>) {
  const logEntry = {
    level,
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(logEntry));
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    log("error", message, meta),
};
