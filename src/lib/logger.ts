import pino from "pino";

export const logger = pino({
  base: {
    service: "tiny-polls",
  },
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: [
      "authorization",
      "headers.authorization",
      "password",
      "token",
      "*.password",
      "*.token",
    ],
    remove: true,
  },
});
