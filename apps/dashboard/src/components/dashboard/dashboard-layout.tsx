import { useLingui } from "@lingui/react/macro";
import { BackgroundTasksPopover } from "@/components/dashboard/background-tasks-popover";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import { CreditsBalanceWidget } from "@/components/credits/credits-balance-widget";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChatProvider } from "@/hooks/chat/chat.context";
import { useUnreadCount } from "@/hooks/notifications/use-notifications";
import { useActiveTasks } from "@/hooks/tasks/use-tasks";
import { Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AppSidebar } from "./app-sidebar";
import { Container } from "../ui/container";

const FloatingChat = lazy(() =>
  import("./ai-chat-panel").then((m) => ({ default: m.FloatingChat })),
);

const MobileChatSheet = lazy(() =>
  import("./ai-chat-panel").then((m) => ({ default: m.MobileChatSheet })),
);

function DashboardHeader() {
  const { t } = useLingui();
  const { data: countData } = useUnreadCount();
  const unreadCount = countData?.unreadCount ?? 0;
  const activeTaskCount = useActiveTasks();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur-xl sm:px-4 lg:px-6">
      <SidebarTrigger
        className="-ml-1 md:hidden"
        aria-label={t`Apri il menu di navigazione`}
      />
      <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
        <Link
          to="/app/credits"
          className="hidden md:block"
          aria-label={t`Vai alla pagina dei crediti AI`}
        >
          <CreditsBalanceWidget
            compact
            className="border-0 bg-transparent p-1 hover:bg-muted/50"
          />
        </Link>
        <BackgroundTasksPopover activeCount={activeTaskCount} />
        <NotificationPopover unreadCount={unreadCount} />
        <ModeToggle />
      </div>
    </header>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="dashboard-surface min-w-0 flex min-h-0 flex-1">
          <DashboardHeader />
          <Container
            id="main-content"
            className="w-full min-w-0 flex-1 py-4 sm:py-5 lg:py-6"
          >
            {children}
          </Container>
        </SidebarInset>
      </SidebarProvider>

      {/* Floating chat — overlays on top of content */}
      <Suspense>
        <FloatingChat />
        <MobileChatSheet />
      </Suspense>
    </ChatProvider>
  );
}
