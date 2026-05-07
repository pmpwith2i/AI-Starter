import { getPrismaClient } from "@repo/db";
import { HttpErrorResponse } from "#src/plugins/error-handler.plugin.js";
import { ERROR_CODES } from "@repo/server-sdk/schemas";
import type { User } from "@repo/db";

const mapUserToProfile = (user: User) => ({
  id: user.id,
  firstName: user.firstName ?? null,
  lastName: user.lastName ?? null,
  email: user.email,
  emailVerified: user.emailVerified,
  phone: user.phone ?? null,
  dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
  avatar: user.avatar ?? null,
  preferences: user.preferences ?? null,
  onboardingCompleted: user.onboardingCompleted,
  createdAt: user.createdAt.toISOString(),
});

export const getProfile = async (userId: string) => {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new HttpErrorResponse(
      "Profile not found",
      404,
      ERROR_CODES.PROFILE_NOT_FOUND,
    );
  }

  return mapUserToProfile(user);
};

export const updateProfile = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    avatar?: string;
    preferences?: unknown;
  },
) => {
  const prisma = getPrismaClient();

  const updateData: Record<string, unknown> = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.dateOfBirth !== undefined)
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.preferences !== undefined) updateData.preferences = data.preferences;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return mapUserToProfile(user);
};

export const completeOnboarding = async (userId: string) => {
  const prisma = getPrismaClient();
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  });
  return { success: true };
};

// Avatar upload is intentionally not implemented in the starter — wire your
// own object storage (S3, R2, GCS) before exposing the route. Args are typed
// to match the route handler signature so the surrounding wiring compiles.
export type UploadAvatarArgs = [
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
];

export const uploadAvatar = async (
  ...args: UploadAvatarArgs
): Promise<{ avatarUrl: string }> => {
  void args;
  throw new HttpErrorResponse(
    "Avatar upload is not configured in the starter — implement your storage backend in profile.service.ts",
    503,
    ERROR_CODES.UPLOAD_NOT_CONFIGURED,
  );
};
