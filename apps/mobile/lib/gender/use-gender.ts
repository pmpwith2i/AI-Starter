/**
 * Gender helper — starter stub.
 *
 * The original version derived `Sex` from the user's clinical
 * profile to pick the right Italian past-participle / adjective form. The
 * starter doesn't ship a clinical profile, so the hooks below default to
 * masculine/neutral.
 *
 * Wire it back to your real source (form input, account preference, etc.)
 * when you scaffold a richer profile model.
 */

export type Sex = "f" | "m" | "other" | null;

export function useSex(): Sex {
  return null;
}

/** Pick the right gendered form. Defaults to masculine when unknown. */
export function gendered(
  sex: Sex,
  female: string,
  male: string,
  neutral?: string,
): string {
  if (sex === "f") return female;
  if (sex === "m") return male;
  return neutral ?? male;
}

/** Hook: return the gendered string based on the user's profile sex. */
export function useGenderedText(
  female: string,
  male: string,
  neutral?: string,
): string {
  return gendered(useSex(), female, male, neutral);
}
