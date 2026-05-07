/**
 * Pure client-side validators mirroring the server's auth schema rules.
 * The server is the source of truth; these helpers only gate the UI so the
 * submit button stays inert until input is plausibly valid.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: string): boolean =>
  EMAIL_REGEX.test(value.trim());

/**
 * Server pattern: 6-64 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit.
 */
export const isValidPassword = (value: string): boolean =>
  value.length >= 6 &&
  value.length <= 64 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value);

export const isValidName = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= 50;
};

export const isValidCode6 = (value: string): boolean =>
  /^\d{6}$/.test(value);

/**
 * Returns the list of password requirements not yet met (for inline UI hints).
 * Empty array = valid.
 */
export type PasswordRule =
  | "minLength"
  | "uppercase"
  | "lowercase"
  | "digit";

export const failingPasswordRules = (value: string): PasswordRule[] => {
  const failing: PasswordRule[] = [];
  if (value.length < 6) failing.push("minLength");
  if (!/[A-Z]/.test(value)) failing.push("uppercase");
  if (!/[a-z]/.test(value)) failing.push("lowercase");
  if (!/\d/.test(value)) failing.push("digit");
  return failing;
};

export const PASSWORD_RULE_LABEL: Record<PasswordRule, string> = {
  minLength: "Almeno 6 caratteri",
  uppercase: "Una maiuscola",
  lowercase: "Una minuscola",
  digit: "Un numero",
};
