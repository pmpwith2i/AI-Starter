import type { Meta, StoryObj } from "@storybook/react-vite";
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "./code-block";
import { Button } from "./button";
import { Copy } from "lucide-react";

const meta: Meta<typeof CodeBlock> = {
  title: "Chat/CodeBlock",
  component: CodeBlock,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const TypeScript: Story = {
  render: () => (
    <CodeBlock>
      <CodeBlockGroup className="border-b px-4 py-2">
        <span className="text-xs text-muted-foreground">example.ts</span>
        <Button variant="ghost" size="icon-xs">
          <Copy className="size-3" />
        </Button>
      </CodeBlockGroup>
      <CodeBlockCode
        code={`interface NutritionPlan {
  id: string;
  status: "draft" | "active" | "archived";
  days: NutritionDay[];
}

function getActivePlan(plans: NutritionPlan[]) {
  return plans.find(p => p.status === "active");
}`}
        language="typescript"
      />
    </CodeBlock>
  ),
};

export const JSON: Story = {
  render: () => (
    <CodeBlock>
      <CodeBlockCode
        code={`{
  "paziente": "Maria Bianchi",
  "piano": {
    "giorni": 7,
    "calorie_giornaliere": 1800,
    "allergie": ["glutine", "lattosio"]
  }
}`}
        language="json"
      />
    </CodeBlock>
  ),
};

export const Simple: Story = {
  render: () => (
    <CodeBlock>
      <CodeBlockCode
        code="pnpm --filter @repo/db exec prisma db push"
        language="bash"
      />
    </CodeBlock>
  ),
};
