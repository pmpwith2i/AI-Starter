import { createOpenRouterProvider } from "@repo/ai";
import { ENVIRONMENT_VARIABLES } from "#src/constants/env.constants.js";

export const openRouterProvider = createOpenRouterProvider({
  apiKey: ENVIRONMENT_VARIABLES.OPENROUTER_API_KEY,
});
