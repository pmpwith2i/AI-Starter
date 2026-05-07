export { createEmailClient } from "./client.js";
export type { EmailClient, EmailParams } from "./client.js";
export {
  buildEmailTemplate,
  buildVerificationEmail,
  buildPasswordResetEmail,
} from "./templates.js";
