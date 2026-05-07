import { Bell, Check, CheckCheck } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/notifications/use-notifications";

export function NotificationPopover({ unreadCount }: { unreadCount: number }) {
  const { t } = useLingui();
  const { data } = useNotifications({ limit: 10, page: 1, unreadOnly: false });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.data ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={t`Notifiche`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center p-0 text-xs leading-none">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">
            <Trans>Notifiche</Trans>
          </span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="mr-1 size-3" />
              <Trans>Segna tutte lette</Trans>
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              <Trans>Nessuna notifica</Trans>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => {
                    if (!notification.read) {
                      markRead.mutate(notification.id);
                    }
                  }}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    !notification.read && "bg-primary/5",
                  )}
                >
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span
                      className={cn(
                        "text-sm leading-tight",
                        !notification.read && "font-medium",
                      )}
                    >
                      {notification.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {notification.body}
                    </span>
                  </div>
                  {!notification.read && (
                    <div className="mt-1 flex size-5 shrink-0 items-center justify-center">
                      <Check className="size-3 text-muted-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
