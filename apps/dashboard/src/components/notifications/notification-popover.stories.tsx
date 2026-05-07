import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationPopover } from "./notification-popover";
import { notificationKeys } from "@/hooks/notifications/notification.keys";

const MOCK_NOTIFICATIONS = {
  data: [
    {
      id: "1",
      type: "appointment",
      title: "Promemoria appuntamento",
      body: "Domani alle 09:30 con Dr.ssa Bianchi",
      read: false,
      metadata: null,
      createdAt: "2026-03-05T10:00:00.000Z",
    },
    {
      id: "2",
      type: "nutrition",
      title: "Nuovo piano nutrizionale",
      body: "Il tuo piano settimanale è pronto",
      read: false,
      metadata: null,
      createdAt: "2026-03-04T14:00:00.000Z",
    },
    {
      id: "3",
      type: "course",
      title: "Corso completato!",
      body: "Hai completato la lezione 5",
      read: true,
      metadata: null,
      createdAt: "2026-03-03T09:00:00.000Z",
    },
  ],
  pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
};

function createMockQueryClient() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  qc.setQueryData(
    notificationKeys.list({ limit: 10, page: 1, unreadOnly: false }),
    MOCK_NOTIFICATIONS,
  );
  return qc;
}

const meta: Meta<typeof NotificationPopover> = {
  title: "Dashboard/NotificationPopover",
  component: NotificationPopover,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <QueryClientProvider client={createMockQueryClient()}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationPopover>;

export const WithUnread: Story = {
  args: { unreadCount: 2 },
};

export const AllRead: Story = {
  args: { unreadCount: 0 },
};
