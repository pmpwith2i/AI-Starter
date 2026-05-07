import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ConsentGrantBody,
  ConsentGrantResponse,
  ConsentStatusResponse,
  ConsentWithdrawResponse,
  LegalDocumentResponse,
} from "@repo/server-sdk";
import type { ConsentPurpose } from "@repo/server-sdk/schemas";
import { sdk, getAccessToken } from "@/lib/api/client";
import { consentKeys } from "./consent.keys";

// ─── Status ────────────────────────────────────────────────────────────────

export const consentStatusQueryOptions = (enabled: boolean = true) =>
  queryOptions<ConsentStatusResponse>({
    queryKey: consentKeys.status(),
    queryFn: () => sdk.consent.getStatus(getAccessToken() ?? undefined),
    // Always fetch fresh: the consent gate must not decide on stale data.
    staleTime: 0,
    enabled,
  });

export const useConsentStatus = (options?: { enabled?: boolean }) =>
  useQuery(consentStatusQueryOptions(options?.enabled ?? true));

// ─── Grant ─────────────────────────────────────────────────────────────────

export const useGrantConsents = () => {
  const queryClient = useQueryClient();
  return useMutation<ConsentGrantResponse, Error, ConsentGrantBody>({
    mutationFn: (body) =>
      sdk.consent.grant(body, getAccessToken() ?? undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: consentKeys.all });
    },
  });
};

// ─── Withdraw ──────────────────────────────────────────────────────────────

export const useWithdrawConsent = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ConsentWithdrawResponse,
    Error,
    { purpose: ConsentPurpose }
  >({
    mutationFn: ({ purpose }) =>
      sdk.consent.withdraw({ purpose }, getAccessToken() ?? undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: consentKeys.all });
    },
  });
};

// ─── Legal documents ───────────────────────────────────────────────────────

export const privacyPolicyQueryOptions = () =>
  queryOptions<LegalDocumentResponse>({
    queryKey: consentKeys.privacyPolicy(),
    queryFn: () => sdk.legal.getPrivacyPolicy(),
    staleTime: 60 * 60 * 1000, // 1 hour — legal copy rarely changes.
  });

export const usePrivacyPolicy = () => useQuery(privacyPolicyQueryOptions());

export const termsQueryOptions = () =>
  queryOptions<LegalDocumentResponse>({
    queryKey: consentKeys.terms(),
    queryFn: () => sdk.legal.getTerms(),
    staleTime: 60 * 60 * 1000,
  });

export const useTerms = () => useQuery(termsQueryOptions());
