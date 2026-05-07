import type { FromSchema } from "json-schema-to-ts";
import {
  GET_PROFILE_ROUTE_SCHEMA,
  PUT_PROFILE_ROUTE_SCHEMA,
  POST_COMPLETE_ONBOARDING_ROUTE_SCHEMA,
  POST_UPLOAD_AVATAR_ROUTE_SCHEMA,
} from "../schemas/profile.schema.js";
import { apiFetch, getEffectiveAccessToken } from "./fetcher.js";
import { ApiError } from "./error.js";
import type { ApiErrorBody } from "./error.js";

export type ProfileResponse = FromSchema<
  (typeof GET_PROFILE_ROUTE_SCHEMA.response)[200]
>;
export type UpdateProfileBody = FromSchema<
  typeof PUT_PROFILE_ROUTE_SCHEMA.body
>;
export type CompleteOnboardingResponse = FromSchema<
  (typeof POST_COMPLETE_ONBOARDING_ROUTE_SCHEMA.response)[200]
>;
export type UploadAvatarResponse = FromSchema<
  (typeof POST_UPLOAD_AVATAR_ROUTE_SCHEMA.response)[200]
>;

export interface ProfileSDK {
  get: (accessToken?: string) => Promise<ProfileResponse>;
  update: (
    body: UpdateProfileBody,
    accessToken?: string,
  ) => Promise<ProfileResponse>;
  completeOnboarding: (
    accessToken?: string,
  ) => Promise<CompleteOnboardingResponse>;
  uploadAvatar: (
    file: File,
    accessToken?: string,
  ) => Promise<UploadAvatarResponse>;
}

export const createProfileSDK = (baseUrl: string): ProfileSDK => ({
  get: (accessToken) =>
    apiFetch<undefined, ProfileResponse>({
      baseUrl,
      path: "/profile",
      method: "GET",
      accessToken,
    }),

  update: (body, accessToken) =>
    apiFetch<UpdateProfileBody, ProfileResponse>({
      baseUrl,
      path: "/profile",
      method: "PUT",
      body,
      accessToken,
    }),

  completeOnboarding: (accessToken) =>
    apiFetch<undefined, CompleteOnboardingResponse>({
      baseUrl,
      path: "/profile/complete-onboarding",
      method: "POST",
      accessToken,
    }),

  uploadAvatar: async (file, accessToken) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const url = `${baseUrl}/profile/avatar`;
    const token = getEffectiveAccessToken(accessToken);
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      credentials: token ? undefined : "include",
    });

    if (!response.ok) {
      let errorBody: ApiErrorBody;
      try {
        errorBody = (await response.json()) as ApiErrorBody;
      } catch {
        errorBody = {
          status: "error",
          message: response.statusText || "Upload failed",
        };
      }
      throw new ApiError(response.status, errorBody);
    }

    return (await response.json()) as UploadAvatarResponse;
  },
});
