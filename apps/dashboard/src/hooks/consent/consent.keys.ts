export const consentKeys = {
  all: ["consent"] as const,
  status: () => [...consentKeys.all, "status"] as const,
  privacyPolicy: () => [...consentKeys.all, "privacy-policy"] as const,
  terms: () => [...consentKeys.all, "terms"] as const,
};
