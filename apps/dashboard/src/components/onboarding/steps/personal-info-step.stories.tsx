import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PersonalInfoStep } from "./personal-info-step";

const meta: Meta<typeof PersonalInfoStep> = {
  title: "Onboarding/PersonalInfoStep",
  component: PersonalInfoStep,
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
  },
};

export default meta;
type Story = StoryObj<typeof PersonalInfoStep>;

export const Default: Story = {};

export const WithDefaults: Story = {
  args: {
    defaultValues: {
      firstName: "Maria",
      lastName: "Rossi",
      phone: "+39 333 1234567",
      dateOfBirth: "1975-06-15",
    },
  },
};
