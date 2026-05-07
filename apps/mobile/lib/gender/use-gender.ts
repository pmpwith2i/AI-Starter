import { useClinicalProfile } from "../../hooks/clinical-profile/use-clinical-profile";

/**
 * Gender helper.
 *
 * Italian agrees adjectives/past-participles with grammatical gender
 * ("iscritta" / "iscritto", "benvenuta" / "benvenuto"). The biological-sex
 * value chosen in onboarding (`f` / `m` / `other` / null) drives the form.
 *
 * For "other" / unknown we default to the neutral / masculine form, matching
 * the standard Italian editorial fallback ("Benvenuto" being the catch-all).
 */
export type Sex = "f" | "m" | "other" | null;

export function useSex(): Sex {
  const { data } = useClinicalProfile();
  const sex = data?.sex;
  if (sex === "f" || sex === "m") return sex;
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

/** Hook: return the gendered string based on the user's onboarding sex. */
export function useGenderedText(
  female: string,
  male: string,
  neutral?: string,
): string {
  return gendered(useSex(), female, male, neutral);
}
