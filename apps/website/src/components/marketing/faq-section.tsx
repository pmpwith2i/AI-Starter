"use client";

import { Accordion } from "@base-ui/react/accordion";
import { Plus } from "lucide-react";
import { DisplayHeading } from "@/components/design";
import type { Faq } from "./content";

interface FaqSectionProps {
  eyebrow?: string;
  heading?: React.ReactNode;
  subheading?: string;
  questions: readonly Faq[];
}

export function FaqSection({
  eyebrow = "Domande frequenti",
  heading = "Le risposte che cerchi.",
  subheading,
  questions,
}: FaqSectionProps) {
  return (
    <section
      aria-labelledby="faq-heading"
      className="section-x section-y border-t border-[color:var(--rule)]"
    >
      <div className="container-wide editorial-grid">
        <div className="editorial-aside">
          <p className="mono-label">{eyebrow}</p>
          <DisplayHeading id="faq-heading" level="h2" className="mt-4">
            {heading}
          </DisplayHeading>
          {subheading ? (
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground max-w-sm">
              {subheading}
            </p>
          ) : null}
        </div>

        <Accordion.Root className="flex flex-col">
          {questions.map((faq, i) => (
            <Accordion.Item
              key={faq.question}
              className="group border-b border-[color:var(--rule)] first:border-t"
            >
              <Accordion.Header>
                <Accordion.Trigger className="flex w-full items-center gap-6 py-6 text-left transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                  <span className="text-eyebrow numerals w-10 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-h3 text-ink flex-1">
                    {faq.question}
                  </span>
                  <Plus
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-data-[panel-open]:rotate-45"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="overflow-hidden text-[15px] leading-relaxed text-muted-foreground transition-all duration-300 data-[ending-style]:h-0 data-[starting-style]:h-0">
                <p className="max-w-2xl pb-6 pl-[calc(2.5rem+1.5rem)]">
                  {faq.answer}
                </p>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
