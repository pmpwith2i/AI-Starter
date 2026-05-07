import type { Meta, StoryObj } from "@storybook/react-vite";
import { Lightbulb, Search, CheckCircle } from "lucide-react";
import {
  ChainOfThought,
  ChainOfThoughtStep,
  ChainOfThoughtTrigger,
  ChainOfThoughtContent,
  ChainOfThoughtItem,
} from "./chain-of-thought";

const meta: Meta<typeof ChainOfThought> = {
  title: "Chat/ChainOfThought",
  component: ChainOfThought,
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
type Story = StoryObj<typeof ChainOfThought>;

export const Default: Story = {
  render: () => (
    <ChainOfThought>
      <ChainOfThoughtStep>
        <ChainOfThoughtTrigger
          leftIcon={<Lightbulb className="size-4" />}
          swapIconOnHover
        >
          Analisi della richiesta del paziente
        </ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          <ChainOfThoughtItem>
            Il paziente chiede informazioni sulla dieta durante la
            chemioterapia. Devo considerare il tipo di trattamento e le
            eventuali allergie.
          </ChainOfThoughtItem>
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>

      <ChainOfThoughtStep>
        <ChainOfThoughtTrigger
          leftIcon={<Search className="size-4" />}
          swapIconOnHover
        >
          Consultazione piano nutrizionale
        </ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          <ChainOfThoughtItem>
            Verifico il piano nutrizionale attivo del paziente per
            personalizzare i consigli.
          </ChainOfThoughtItem>
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>

      <ChainOfThoughtStep>
        <ChainOfThoughtTrigger
          leftIcon={<CheckCircle className="size-4" />}
          swapIconOnHover
        >
          Preparazione risposta
        </ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          <ChainOfThoughtItem>
            Formulo una risposta basata sulle linee guida ARTOI e sul profilo
            specifico del paziente.
          </ChainOfThoughtItem>
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>
    </ChainOfThought>
  ),
};

export const SingleStep: Story = {
  render: () => (
    <ChainOfThought>
      <ChainOfThoughtStep>
        <ChainOfThoughtTrigger>Ragionamento in corso...</ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          <ChainOfThoughtItem>
            Sto analizzando i dati del paziente per fornire una risposta
            accurata.
          </ChainOfThoughtItem>
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>
    </ChainOfThought>
  ),
};
