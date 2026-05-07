import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { clinicalProfileKeys } from "@/hooks/clinical-profile/clinical-profile.keys";
import { HealthDataStep } from "./health-data-step";

const meta: Meta<typeof HealthDataStep> = {
  title: "Onboarding/HealthDataStep",
  component: HealthDataStep,
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity },
        },
      });

      queryClient.setQueryData(clinicalProfileKeys.detail(), {
        id: "pd1",
        height: 168,
        weight: 62,
        allergies: null,
        bloodType: "A+",
        sex: null,
        activityLevel: null,
        conditions: null,
        breakfastPreference: null,
        isVegan: false,
        isVegetarian: false,
        dietaryRestrictions: null,
        dislikes: null,
        userId: "u1",
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T00:00:00.000Z",
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
type Story = StoryObj<typeof HealthDataStep>;

export const Default: Story = {};

export const Empty: Story = {
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity },
        },
      });

      queryClient.setQueryData(clinicalProfileKeys.detail(), null);

      return (
        <QueryClientProvider client={queryClient}>
          <div className="mx-auto max-w-lg p-6">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};
