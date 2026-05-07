import { getPrismaClient } from "@repo/db";
import { HttpErrorResponse } from "#src/plugins/error-handler.plugin.js";
import { ERROR_CODES } from "@repo/server-sdk/schemas";
import type { User } from "@repo/db";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";
import { uploadToS3 } from "#src/lib/s3.js";

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
    name?: string;
    phone?: string;
    dateOfBirth?: string;
    avatar?: string;
    preferences?: unknown;
  },
) => {
  const prisma = getPrismaClient();

  const updateData: Record<string, unknown> = {};
  if (data.firstName !== undefined) {
    updateData.firstName = data.firstName;
  }
  if (data.lastName !== undefined) {
    updateData.lastName = data.lastName;
  }
  // Compute name from firstName + lastName when either is provided
  if (data.firstName !== undefined || data.lastName !== undefined) {
    const current = await prisma.user.findUnique({ where: { id: userId } });
    const first = data.firstName ?? current?.firstName ?? "";
    const last = data.lastName ?? current?.lastName ?? "";
    updateData.name = [first, last].filter(Boolean).join(" ") || null;
  }
  if (
    data.name !== undefined &&
    data.firstName === undefined &&
    data.lastName === undefined
  ) {
    updateData.name = data.name;
  }
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

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const uploadAvatar = async (
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<{ avatarUrl: string }> => {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new HttpErrorResponse(
      "Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
      400,
      ERROR_CODES.INVALID_FILE_TYPE,
    );
  }

  if (!ENVIRONMENT_VARIABLES.AWS_S3_BUCKET) {
    throw new HttpErrorResponse(
      "Avatar upload is not configured",
      503,
      ERROR_CODES.UPLOAD_NOT_CONFIGURED,
    );
  }

  const avatarUrl = await uploadToS3(fileBuffer, mimeType, `avatars/${userId}`);

  const prisma = getPrismaClient();
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
  });

  return { avatarUrl };
};
