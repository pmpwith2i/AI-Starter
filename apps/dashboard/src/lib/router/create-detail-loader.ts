import type { QueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { BreadcrumbSegment } from "@/lib/breadcrumbs";
import { mapDetailLoaderError } from "./map-detail-loader-error";

/**
 * Configuration for a single-resource detail route loader.
 *
 *  - `paramKey`: which TanStack Router param holds the resource id
 *    (e.g. `"courseId"` for `/app/courses/$courseId`).
 *  - `queryOptions`: factory that builds the React Query options for
 *    the resource detail. Used both as the cache key (so `useQuery` in
 *    the component reads the same entry) and as the query function
 *    that actually fetches.
 *  - `buildCrumbs`: pure function that turns the loaded data into the
 *    breadcrumb chain rendered by `RouteBreadcrumbs`.
 */
export interface CreateDetailLoaderOptions<
  TParams extends Record<string, string>,
  TData,
> {
  paramKey: keyof TParams & string;
  queryOptions: (id: string) => UseQueryOptions<TData>;
  buildCrumbs: (data: TData) => BreadcrumbSegment[];
}

/**
 * Returns a TanStack Router `loader` function that:
 *
 * 1. Reads the resource id from `params[paramKey]`.
 * 2. Calls `queryClient.ensureQueryData(queryOptions(id))` to prefill
 *    the React Query cache. The corresponding `useQuery(queryOptions(id))`
 *    in the component will then resolve immediately on mount — no
 *    skeleton flash on warm navigations.
 * 3. Builds the breadcrumb chain from the loaded data and returns it
 *    so `RouteBreadcrumbs` can render the real resource title.
 * 4. On `ApiError` 404, throws `notFound()` so the route's
 *    `notFoundComponent` renders. Other errors bubble up to the
 *    `errorComponent` (root `GlobalErrorPage` by default).
 *
 * Designed to be the single source of truth for the loader-pattern of
 * every single-id detail page in the dashboard. Multi-id routes (e.g.
 * `/app/courses/$courseId/lessons/$lessonId`) write a custom inline
 * loader and reuse `mapDetailLoaderError` directly.
 */
export const createDetailLoader =
  <TParams extends Record<string, string>, TData>(
    opts: CreateDetailLoaderOptions<TParams, TData>,
  ) =>
  async ({
    context,
    params,
  }: {
    context: { queryClient: QueryClient };
    params: TParams;
  }): Promise<{ crumbs: BreadcrumbSegment[] }> => {
    const id = params[opts.paramKey];
    try {
      const data = await context.queryClient.ensureQueryData(
        opts.queryOptions(id),
      );
      return { crumbs: opts.buildCrumbs(data) };
    } catch (err) {
      // mapDetailLoaderError is `(...) => never` but TS narrowing across
      // the catch boundary is conservative — repeat the throw so the
      // function's control-flow analysis sees it as terminal.
      return mapDetailLoaderError(err);
    }
  };
