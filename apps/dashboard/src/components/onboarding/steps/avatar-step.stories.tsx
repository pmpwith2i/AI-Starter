import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AvatarStep } from "./avatar-step";

const meta: Meta<typeof AvatarStep> = {
  title: "Onboarding/AvatarStep",
  component: AvatarStep,
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity },
        },
      });

      return (
        <QueryClientProvider client={queryClient}>
          <div className="mx-auto max-w-lg p-6">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  args: {
    onNext: () => {},
    onBack: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AvatarStep>;

export const Default: Story = {};

export const WithAvatar: Story = {
  args: {
    currentAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  },
};
