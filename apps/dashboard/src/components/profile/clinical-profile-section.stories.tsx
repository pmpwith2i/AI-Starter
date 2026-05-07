import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClinicalProfileSection } from "./clinical-profile-section";
import { clinicalProfileKeys } from "@/hooks/clinical-profile/clinical-profile.keys";

const MOCK_CLINICAL_PROFILE = {
  id: "cp-1",
  height: 175,
  weight: 72,
  sex: null,
  activityLevel: null,
  breakfastPreference: null,
  isVegan: null,
  isVegetarian: null,
  dislikes: null,
  allergies: "Glutine, lattosio",
  bloodType: "A+",
  conditions: null,
  dietaryRestrictions: null,
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-09T00:00:00.000Z",
};

function createQueryClient(data: unknown) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  qc.setQueryData(clinicalProfileKeys.detail(), data);
  return qc;
}

const meta: Meta<typeof ClinicalProfileSection> = {
  title: "Profile/ClinicalProfileSection",
  component: ClinicalProfileSection,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient(MOCK_CLINICAL_PROFILE)}>
        <div className="max-w-lg">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClinicalProfileSection>;

export const WithData: Story = {};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient(null)}>
        <div className="max-w-lg">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
