import "server-only";

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "dissent-web",
    environment: process.env.NODE_ENV ?? "development",
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.apiKey",
      "*.api_key",
      "*.privateKey",
      "*.private_key",
      "*.secret",
      "*.password",
      "*.token",
      "databaseUrl",
      "connectionString",
    ],
    censor: "[REDACTED]",
  },
});
