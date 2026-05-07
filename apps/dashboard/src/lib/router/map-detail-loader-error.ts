import { notFound } from "@tanstack/react-router";
import { ApiError } from "@repo/server-sdk";

/**
 * Translates an error caught inside a detail route loader into the
 * appropriate TanStack Router signal:
 *
 *  - `ApiError` with status `404` → `throw notFound()` so the router
 *    renders the route's `notFoundComponent` (typically a resource-specific
 *    `NotFoundPage`).
 *  - Anything else → re-throw, which lets the error bubble up to the
 *    nearest `errorComponent` (the root `GlobalErrorPage` by default).
 *
 * This function never returns — its return type is `never`. Use it inside
 * the loader's catch block:
 *
 * ```ts
 * try {
 *   const data = await ctx.context.queryClient.ensureQueryData(...);
 *   return { crumbs: buildCrumbs(data) };
 * } catch (err) {
 *   mapDetailLoaderError(err);
 * }
 * ```
 */
export const mapDetailLoaderError = (err: unknown): never => {
  if (err instanceof ApiError && err.statusCode === 404) {
    throw notFound();
  }
  throw err;
};
