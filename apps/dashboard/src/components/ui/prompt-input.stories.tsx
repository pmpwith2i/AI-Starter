import type { Meta, StoryObj } from "@storybook/react-vite";
import { Send, Square, Paperclip } from "lucide-react";
import { Button } from "./button";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "./prompt-input";

const meta: Meta<typeof PromptInput> = {
  title: "Chat/PromptInput",
  component: PromptInput,
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
type Story = StoryObj<typeof PromptInput>;

export const Default: Story = {
  render: () => (
    <PromptInput>
      <PromptInputTextarea placeholder="Scrivi un messaggio..." />
      <PromptInputActions className="justify-end px-2 pb-1">
        <PromptInputAction tooltip="Invia messaggio">
          <Button size="sm" className="size-8 rounded-full">
            <Send className="size-4" />
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  ),
};

export const WithValue: Story = {
  render: () => (
    <PromptInput value="Vorrei un piano nutrizionale personalizzato per la prossima settimana">
      <PromptInputTextarea placeholder="Scrivi un messaggio..." />
      <PromptInputActions className="justify-between px-2 pb-1">
        <PromptInputAction tooltip="Allega file">
          <Button variant="ghost" size="sm" className="size-8">
            <Paperclip className="size-4" />
          </Button>
        </PromptInputAction>
        <PromptInputAction tooltip="Invia messaggio">
          <Button size="sm" className="size-8 rounded-full">
            <Send className="size-4" />
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  ),
};

export const Loading: Story = {
  render: () => (
    <PromptInput isLoading>
      <PromptInputTextarea placeholder="Scrivi un messaggio..." />
      <PromptInputActions className="justify-end px-2 pb-1">
        <PromptInputAction tooltip="Interrompi">
          <Button
            size="sm"
            variant="destructive"
            className="size-8 rounded-full"
          >
            <Square className="size-3" />
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  ),
};

export const Disabled: Story = {
  render: () => (
    <PromptInput disabled>
      <PromptInputTextarea placeholder="Chat non disponibile..." />
      <PromptInputActions className="justify-end px-2 pb-1">
        <PromptInputAction tooltip="Invia messaggio">
          <Button size="sm" className="size-8 rounded-full" disabled>
            <Send className="size-4" />
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  ),
};
