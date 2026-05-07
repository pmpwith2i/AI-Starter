// Starter SDK root. Composes the domain SDKs into a single typed object.
// Add new domain SDKs to this file using the `use-sdk` skill — keep the
// "one factory per domain hung off a single ApiSDK" pattern.

import { createAuthSDK } from "./client/auth.js";
import type { AuthSDK } from "./client/auth.js";
import { createNotificationSDK } from "./client/notification.js";
import type { NotificationSDK } from "./client/notification.js";
import { createProfileSDK } from "./client/profile.js";
import type { ProfileSDK } from "./client/profile.js";
import { createConsentSDK } from "./client/consent.js";
import type { ConsentSDK } from "./client/consent.js";
import { createLegalSDK } from "./client/legal.js";
import type { LegalSDK } from "./client/legal.js";

export interface ApiSDK {
  auth: AuthSDK;
  notifications: NotificationSDK;
  profile: ProfileSDK;
  consent: ConsentSDK;
  legal: LegalSDK;
}

export const createApiSDK = (baseUrl: string): ApiSDK => ({
  auth: createAuthSDK(baseUrl),
  notifications: createNotificationSDK(baseUrl),
  profile: createProfileSDK(baseUrl),
  consent: createConsentSDK(baseUrl),
  legal: createLegalSDK(baseUrl),
});
