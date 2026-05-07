import type { Meta, StoryObj } from "@storybook/react-vite";
import { CompleteStep } from "./complete-step";

const meta: Meta<typeof CompleteStep> = {
  title: "Onboarding/CompleteStep",
  component: CompleteStep,
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-lg p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CompleteStep>;

export const Default: Story = {};
