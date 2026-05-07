import pino from "pino";
import { ENVIRONMENT_VARIABLES } from "./constants/env.constants.js";
import { LOG_REDACT_PATHS } from "./constants/redact.constants.js";

const isProd = ENVIRONMENT_VARIABLES.NODE_ENV === "production";

export const logger = pino({
  level: ENVIRONMENT_VARIABLES.LOG_LEVEL,
  redact: LOG_REDACT_PATHS,
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        },
      }),
});
