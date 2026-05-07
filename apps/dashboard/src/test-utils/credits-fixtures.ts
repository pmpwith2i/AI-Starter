import type { CreditsBalanceResponse } from "@repo/server-sdk";

interface MockBalanceInput {
  /** Credits already consumed in the current period (positive integer). */
  used?: number;
  /** Plan period limit. Pass null for an unlimited plan. */
  limit?: number | null;
  /** Bonus credits available (all-time). */
  bonus?: number;
  /** Plan code shown to the user. */
  planCode?: string;
  /** Plan display name. */
  planName?: string;
  periodType?: "daily" | "monthly";
  /** When the period rolls over (ISO string). Defaults to "30 days from now". */
  resetsAt?: string;
}

/**
 * Builds a fully-shaped `CreditsBalanceResponse` for use in Storybook
 * stories and component tests. Defaults match a Pro plan with no usage.
 */
export const mockCreditsBalance = (
  input: MockBalanceInput = {},
): CreditsBalanceResponse => {
  const limit = input.limit === undefined ? 500 : input.limit;
  const used = input.used ?? 0;
  const bonus = input.bonus ?? 0;
  const unlimited = limit === null;

  const periodAvailable = unlimited ? null : Math.max(0, (limit ?? 0) - used);
  const total = unlimited ? null : (periodAvailable ?? 0) + bonus;

  return {
    plan: {
      id: "plan-mock",
      code: input.planCode ?? "pro",
      name: input.planName ?? "Pro",
      description: null,
      creditsPerPeriod: limit,
      periodType: input.periodType ?? "monthly",
      isPublic: true,
      isDefault: false,
      priceMonthlyEur: 999,
    },
    period: {
      available: periodAvailable,
      used,
      limit,
      resetsAt:
        input.resetsAt ??
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    bonus: {
      available: bonus,
      expiringNext: null,
    },
    total,
    unlimited,
  };
};
