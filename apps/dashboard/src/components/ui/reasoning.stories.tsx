import type { Meta, StoryObj } from "@storybook/react-vite";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "./reasoning";

const meta: Meta<typeof Reasoning> = {
  title: "Chat/Reasoning",
  component: Reasoning,
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
type Story = StoryObj<typeof Reasoning>;

export const Collapsed: Story = {
  render: () => (
    <Reasoning>
      <ReasoningTrigger className="text-sm">Ragionamento</ReasoningTrigger>
      <ReasoningContent markdown>
        {`Il paziente ha chiesto informazioni sulla **dieta durante la chemioterapia**.

Devo considerare:
- Il tipo di trattamento (chemioterapia adiuvante)
- Le allergie note (glutine)
- Lo stato nutrizionale attuale (BMI nella norma)

Basandomi sulle linee guida ARTOI, preparo una risposta personalizzata.`}
      </ReasoningContent>
    </Reasoning>
  ),
};

export const Open: Story = {
  render: () => (
    <Reasoning open>
      <ReasoningTrigger className="text-sm">Ragionamento</ReasoningTrigger>
      <ReasoningContent markdown>
        {`Sto analizzando il piano nutrizionale del paziente per verificare che i pasti siano **bilanciati** e conformi alle sue esigenze cliniche.

Le calorie giornaliere target sono **1800 kcal** con una distribuzione:
- Proteine: 20-25%
- Carboidrati: 45-55%
- Grassi: 25-30%`}
      </ReasoningContent>
    </Reasoning>
  ),
};

export const PlainText: Story = {
  render: () => (
    <Reasoning open>
      <ReasoningTrigger className="text-sm">Pensiero</ReasoningTrigger>
      <ReasoningContent>
        Analisi semplice senza formattazione markdown. Il paziente necessita di
        un aggiornamento al piano nutrizionale.
      </ReasoningContent>
    </Reasoning>
  ),
};
