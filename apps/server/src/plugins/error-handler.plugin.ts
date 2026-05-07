import { isDev } from "#src/constants/env.constants.js";
import type { FastifyError } from "fastify";
import fp from "fastify-plugin";

export class HttpErrorResponse extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.name = "HttpErrorResponse";
  }
}

export const errorHandlerPlugin = fp((fastify, _opts, done) => {
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpErrorResponse) {
      request.log.warn({ errorCode: error.errorCode }, error.message);
      reply.status(error.statusCode).send({
        status: "error",
        message: error.message,
        code: error.errorCode,
        ...(error.details ? { details: error.details } : {}),
        ...(isDev ? { stack: error.stack } : {}),
      });
      return;
    }

    const fastifyError = error as FastifyError;

    if (fastifyError.code === "FST_ERR_VALIDATION") {
      request.log.warn(
        { validationError: fastifyError.message },
        "Validation failed",
      );
      reply.status(400).send({
        status: "error",
        message: "Invalid request data. Please check your input and try again.",
        code: "VALIDATION_ERROR",
        errors: fastifyError.validation,
        ...(isDev ? { stack: fastifyError.stack } : {}),
      });
      return;
    }

    request.log.error(error, "Unhandled error");
    reply.status(500).send({
      status: "error",
      message: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
      ...(isDev ? { stack: fastifyError.stack } : {}),
    });
  });

  done();
});
