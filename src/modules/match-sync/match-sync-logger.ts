export interface MatchSyncLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export const consoleMatchSyncLogger: MatchSyncLogger = {
  info(message, context) {
    writeLog("info", message, context);
  },
  warn(message, context) {
    writeLog("warn", message, context);
  },
  error(message, context) {
    writeLog("error", message, context);
  },
};

function writeLog(
  level: "info" | "warn" | "error",
  message: string,
  context: Record<string, unknown> = {},
): void {
  const payload = {
    level,
    workerName: "worker:matches",
    message,
    ...context,
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}
