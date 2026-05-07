import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { profileKeys } from "@/hooks/profile/profile.keys";
import { OnboardingFlow } from "./onboarding-flow";

const meta: Meta<typeof OnboardingFlow> = {
  title: "Onboarding/OnboardingFlow",
  component: OnboardingFlow,
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity },
        },
      });

      queryClient.setQueryData(profileKeys.detail(), {
        id: "u1",
        name: "Maria Rossi",
        firstName: "Maria",
        lastName: "Rossi",
        email: "maria@example.com",
        avatar: null,
        phone: null,
        dateOfBirth: null,
        role: "patient",
        emailVerified: true,
        onboardingCompleted: false,
        preferences: null,
      });

      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof OnboardingFlow>;

export const Default: Story = {};
