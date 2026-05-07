import { useLingui } from "@lingui/react/macro";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useUnreadCount } from "@/hooks/notifications/use-notifications";
import { AppSidebar } from "./app-sidebar";

function DashboardHeader() {
  const { t } = useLingui();
  const { data: countData } = useUnreadCount();
  const unreadCount = countData?.unreadCount ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur-xl sm:px-4 lg:px-6">
      <SidebarTrigger
        className="-ml-1 md:hidden"
        aria-label={t`Apri il menu di navigazione`}
      />
      <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
        <NotificationPopover unreadCount={unreadCount} />
        <ModeToggle />
      </div>
    </header>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="dashboard-surface min-w-0 flex min-h-0 flex-1">
        <DashboardHeader />
        <div
          id="main-content"
          className="w-full min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6"
        >
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
