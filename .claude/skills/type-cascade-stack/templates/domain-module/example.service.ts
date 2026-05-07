// apps/server/src/routes/example/example.service.ts
//
// Pattern:
//   - pure business logic; throws HttpErrorResponse subclasses for known errors
//   - encrypt at the write boundary, decrypt at the read boundary
//   - return SDK shape directly — no mapper functions
//   - retentionExpiresAt is set on every write via resolveRetentionExpiry()

import { encrypt, decrypt } from "@repo/crypto";
import { getPrismaClient } from "@repo/db";
import type {
  CreateExampleBody,
  ExampleResponse,
} from "@repo/server-sdk/schemas";
import { HttpErrorResponse } from "../../plugins/error-handler.plugin.js";
import { resolveRetentionExpiry } from "../../services/retention-windows.js";

export class ExampleNotFoundError extends HttpErrorResponse {
  constructor() {
    super("Example not found", 404, "EXAMPLE_NOT_FOUND");
  }
}

export const createExample = async (
  userId: string,
  body: CreateExampleBody,
): Promise<ExampleResponse> => {
  const row = await getPrismaClient().example.create({
    data: {
      userId,
      title: body.title,
      encryptedNotes: body.notes ? encrypt(body.notes) : null,
      retentionExpiresAt: resolveRetentionExpiry("example", new Date()),
    },
  });

  return {
    id: row.id,
    title: row.title,
    notes: body.notes ?? null,
    createdAt: row.createdAt.toISOString(),
  };
};

export const getExample = async (
  userId: string,
  id: string,
): Promise<ExampleResponse> => {
  const row = await getPrismaClient().example.findFirst({
    where: { id, userId },
  });
  if (!row) throw new ExampleNotFoundError();

  return {
    id: row.id,
    title: row.title,
    notes: row.encryptedNotes ? decrypt(row.encryptedNotes) : null,
    createdAt: row.createdAt.toISOString(),
  };
};
