/**
 * Masks an email address for display. Shows first char + last char before @,
 * replaces the rest with asterisks.
 *
 * Examples:
 *   "federico@gmail.com" → "f******o@gmail.com"
 *   "ab@gmail.com"       → "a*@gmail.com"
 *   "a@gmail.com"        → "a@gmail.com"
 */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  const first = local[0];
  const last = local[local.length - 1];
  const masked = "*".repeat(local.length - 2);
  return `${first}${masked}${last}@${domain}`;
};
