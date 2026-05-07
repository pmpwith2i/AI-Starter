// Starter app sidebar.
// Pattern: shadcn `Sidebar` primitive with `defaultOpen={false}` + icon-only
// rail on desktop, full drawer on mobile via `useIsMobile`.
//
// Add new menu groups for each domain you scaffold. Use `useMatches()` to
// drive active state from TanStack Router.

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Trans, useLingui } from "@lingui/react/macro";
import { Link, useMatches } from "@tanstack/react-router";
import { Bell, Home, LogOut, User } from "lucide-react";

export const AppSidebar = () => {
  const { t } = useLingui();
  const { logout, firstName, lastName, email } = useAuth();
  const matches = useMatches();
  const currentPath = matches.at(-1)?.pathname ?? "";

  const isActive = (to: string, exact = false) =>
    exact ? currentPath === to : currentPath.startsWith(to);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={t`Home`}>
              <Link to="/app">
                <Home className="size-5" />
                <span className="font-semibold">
                  <Trans>Starter</Trans>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Trans>Main</Trans>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/app", true)}
                  tooltip={t`Overview`}
                >
                  <Link to="/app">
                    <Home className="size-4" />
                    <span>
                      <Trans>Overview</Trans>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Trans>Account</Trans>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/app/profile")}
                  tooltip={t`Profile`}
                >
                  <Link to="/app/profile">
                    <User className="size-4" />
                    <span>
                      <Trans>Profile</Trans>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip={t`Notifications`}>
                  <Bell className="size-4" />
                  <span>
                    <Trans>Notifications</Trans>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t`Sign out`}
              onClick={() => logout()}
              aria-label={t`Sign out`}
            >
              <LogOut className="size-4" />
              <span className="truncate">
                {firstName || lastName
                  ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
                  : (email ?? "")}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
