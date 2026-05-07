export interface ApiErrorBody {
  status: "error";
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorCode: string | undefined;
  readonly details: Record<string, unknown> | undefined;

  constructor(statusCode: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = body.code;
    this.details = body.details;
  }
}
