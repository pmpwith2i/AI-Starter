import type { Meta, StoryObj } from "@storybook/react-vite";
import { ResponseStream } from "./response-stream";

const SAMPLE_TEXT =
  "Durante la chemioterapia è fondamentale mantenere un'alimentazione equilibrata. Cerca di consumare pasti leggeri e frequenti, preferendo cibi ricchi di proteine come il pesce, le uova e i legumi. Bevi almeno 1.5 litri di acqua al giorno e evita cibi troppo grassi o speziati.";

const meta: Meta<typeof ResponseStream> = {
  title: "Chat/ResponseStream",
  component: ResponseStream,
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
type Story = StoryObj<typeof ResponseStream>;

export const Typewriter: Story = {
  args: {
    textStream: SAMPLE_TEXT,
    mode: "typewriter",
    speed: 50,
    className: "text-sm",
  },
};

export const Fade: Story = {
  args: {
    textStream: SAMPLE_TEXT,
    mode: "fade",
    speed: 30,
    className: "text-sm",
  },
};

export const Fast: Story = {
  args: {
    textStream: SAMPLE_TEXT,
    mode: "typewriter",
    speed: 90,
    className: "text-sm",
  },
};

export const Slow: Story = {
  args: {
    textStream: SAMPLE_TEXT,
    mode: "typewriter",
    speed: 5,
    className: "text-sm",
  },
};
