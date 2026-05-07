import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfileForm } from "./profile-form";
import { profileKeys } from "@/hooks/profile/profile.keys";

const MOCK_PROFILE = {
  id: "user-1",
  email: "maria.rossi@example.com",
  firstName: "Maria",
  lastName: "Rossi",
  phone: "+39 333 1234567",
  dateOfBirth: "1975-06-15",
  preferences: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
};

function createMockQueryClient() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  qc.setQueryData(profileKeys.detail(), MOCK_PROFILE);
  return qc;
}

const meta: Meta<typeof ProfileForm> = {
  title: "Profile/ProfileForm",
  component: ProfileForm,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <QueryClientProvider client={createMockQueryClient()}>
        <div className="max-w-2xl">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProfileForm>;

export const Default: Story = {};
