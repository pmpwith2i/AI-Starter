import type { QueryClient } from "@tanstack/react-query";

import { appointmentKeys } from "../appointments/appointment.keys";
import { bundlesKeys } from "../bundles/bundles.keys";
import { coursesKeys } from "../courses/courses.keys";
import { creditsKeys } from "../credits/credits.keys";
import { eventsKeys } from "../events/events.keys";
import { notificationsKeys } from "../notifications/notifications.keys";
import { nutritionKeys } from "../nutrition/nutrition.keys";
import { shoppingListKeys } from "../nutrition/shopping-list.keys";
import { tasksKeys } from "../tasks/tasks.keys";

/**
 * Maps realtime entity names (the FIRST segment of a WS topic, e.g. "nutrition"
 * for `nutrition:user:abc`) to TanStack Query keys to invalidate when an event
 * arrives.
 *
 * Add a new entry here every time a new domain key file is created.
 */
const ENTITY_KEY_MAP: Record<string, readonly (readonly unknown[])[]> = {
  notification: [notificationsKeys.all],
  credits: [creditsKeys.all],
  // The shopping list is derived from nutrition plans — when a plan changes
  // (regenerated meal, new plan, status flip) the cart must refresh too.
  nutrition: [nutritionKeys.all, shoppingListKeys.all],
  // task progress drives the plan generation spinner AND the notifications
  // panel "in corso" section — invalidate both so they refresh as the task
  // transitions from pending → running → completed. Shopping list included
  // because plan-generation tasks regenerate the cart on completion.
  task: [nutritionKeys.all, tasksKeys.all, shoppingListKeys.all],
  event: [eventsKeys.all, bundlesKeys.all],
  bundle: [bundlesKeys.all, eventsKeys.all],
  speaker: [eventsKeys.all, bundlesKeys.all, coursesKeys.all],
  // Admin grants (V1 ghost-mode) and future Stripe webhooks emit `purchase`
  // events — both event/bundle CTAs need to flip to "purchased" state.
  purchase: [eventsKeys.all, bundlesKeys.all],
  course: [coursesKeys.all],
  // Appointments emit `appointment:user:{userId}` whenever the pro server
  // creates / confirms / completes / cancels an appointment for the patient.
  appointment: [appointmentKeys.all],
  // `food:public:all` is admin-only and the patient app does not subscribe
  // to it, so no entry is needed here. Documented to avoid future "missing?"
  // confusion.
};

export const invalidateByEntity = (
  queryClient: QueryClient,
  entity: string,
): void => {
  const keys = ENTITY_KEY_MAP[entity];
  if (!keys) return;
  for (const key of keys) {
    void queryClient.invalidateQueries({ queryKey: key });
  }
};
