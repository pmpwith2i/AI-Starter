import type { ReactNode } from "react";
import { RouteBreadcrumbs } from "@/components/route-breadcrumbs";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: ReactNode;
  /** Optional className appended to the wrapper for one-off overrides. */
  className?: string;
}

/**
 * Standard top-level layout for any page rendered inside the dashboard
 * shell. Renders the route-driven breadcrumbs (read from each route
 * file's `loader` via `useMatches()`) followed by the page content
 * with consistent vertical spacing.
 *
 * Every page that uses this MUST also declare its breadcrumb chain in
 * the corresponding route file's `loader`:
 *
 * ```ts
 * export const Route = createFileRoute("/app/foo/$id")({
 *   component: FooPage,
 *   loader: () => ({
 *     crumbs: [
 *       { label: "Sezione", link: { to: "/app/sezione" } },
 *       { label: "Foo", link: { to: "/app/foo" } },
 *     ],
 *   }),
 * });
 * ```
 *
 * The last crumb is rendered as the current page (non-clickable). For
 * detail routes the dynamic resource name is intentionally omitted —
 * only the static parent navigation chain is listed.
 *
 * Example usage in a route component:
 *
 * ```tsx
 * function FooPage() {
 *   return (
 *     <PageLayout>
 *       <FooContent />
 *     </PageLayout>
 *   );
 * }
 * ```
 */
export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <RouteBreadcrumbs />
      {children}
    </div>
  );
}
