import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ProfileResponse, UpdateProfileBody } from "@repo/server-sdk";
import { sdk, getAccessToken } from "@/lib/api/client";
import { handleMutationError } from "@/lib/api/mutation-error-handler";
import { profileKeys } from "./profile.keys";

export const profileQueryOptions = () =>
  queryOptions<ProfileResponse>({
    queryKey: profileKeys.detail(),
    queryFn: () => sdk.profile.get(getAccessToken() ?? undefined),
  });

export const useProfile = () => useQuery(profileQueryOptions());

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileBody) =>
      sdk.profile.update(data, getAccessToken() ?? undefined),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.detail() });

      const previous = queryClient.getQueryData<ProfileResponse>(
        profileKeys.detail(),
      );

      if (previous) {
        queryClient.setQueryData<ProfileResponse>(profileKeys.detail(), {
          ...previous,
          ...data,
          dateOfBirth: data.dateOfBirth ?? previous.dateOfBirth,
        });
      }

      return { previous };
    },
    onError: (err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(profileKeys.detail(), context.previous);
      }
      handleMutationError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) =>
      sdk.profile.uploadAvatar(file, getAccessToken() ?? undefined),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
    onError: handleMutationError,
  });
};

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      sdk.profile.completeOnboarding(getAccessToken() ?? undefined),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
    onError: handleMutationError,
  });
};
