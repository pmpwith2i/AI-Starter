import { Fragment } from "react";
import { Link, useMatches } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { BreadcrumbSegment } from "@/lib/breadcrumbs";

export function RouteBreadcrumbs() {
  const matches = useMatches();

  const crumbs: BreadcrumbSegment[] = [];
  for (const match of matches) {
    const data = match.loaderData as
      | { crumb?: BreadcrumbSegment; crumbs?: BreadcrumbSegment[] }
      | undefined;
    if (data?.crumbs) {
      crumbs.push(...data.crumbs);
    } else if (data?.crumb) {
      crumbs.push(data.crumb);
    }
  }

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;

          return (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !crumb.link ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link {...crumb.link}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
