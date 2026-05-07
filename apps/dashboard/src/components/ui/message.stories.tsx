import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { Button } from "./button";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageActions,
  MessageAction,
} from "./message";

const meta: Meta<typeof Message> = {
  title: "Chat/Message",
  component: Message,
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
type Story = StoryObj<typeof Message>;

export const UserMessage: Story = {
  render: () => (
    <Message>
      <MessageAvatar
        src=""
        alt="Utente"
        fallback="MB"
        className="bg-primary text-primary-foreground"
      />
      <MessageContent>
        Buongiorno, vorrei sapere cosa posso mangiare durante la chemioterapia.
      </MessageContent>
    </Message>
  ),
};

export const AssistantMessage: Story = {
  render: () => (
    <Message>
      <MessageAvatar
        src=""
        alt="Onciro"
        fallback="AI"
        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
      />
      <div className="flex flex-col gap-1">
        <MessageContent markdown>
          {`Durante la chemioterapia è importante seguire un'alimentazione **bilanciata**. Ecco alcuni consigli:

- Preferisci cibi leggeri e facilmente digeribili
- Bevi molta acqua (almeno 1.5L al giorno)
- Evita cibi troppo grassi o speziati

Vuoi che ti prepari un piano alimentare personalizzato?`}
        </MessageContent>
        <MessageActions>
          <MessageAction tooltip="Copia">
            <Button variant="ghost" size="icon-xs">
              <Copy className="size-3" />
            </Button>
          </MessageAction>
          <MessageAction tooltip="Utile">
            <Button variant="ghost" size="icon-xs">
              <ThumbsUp className="size-3" />
            </Button>
          </MessageAction>
          <MessageAction tooltip="Non utile">
            <Button variant="ghost" size="icon-xs">
              <ThumbsDown className="size-3" />
            </Button>
          </MessageAction>
        </MessageActions>
      </div>
    </Message>
  ),
};

export const PlainText: Story = {
  render: () => (
    <Message>
      <MessageAvatar src="" alt="Onciro" fallback="AI" />
      <MessageContent>
        Messaggio semplice senza formattazione markdown.
      </MessageContent>
    </Message>
  ),
};
