import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  /** Color token. Defaults to primary; `muted` for low-emphasis, `ink` on dark panels. */
  tone?: "muted" | "primary" | "ink";
  /** Render a dot + rule after the label — editorial signature. */
  rule?: boolean;
  as?: "p" | "span" | "div";
}

const TONE_CLASS: Record<NonNullable<EyebrowProps["tone"]>, string> = {
  muted: "text-muted-foreground",
  primary: "text-primary",
  ink: "text-ink",
};

/**
 * Consistent eyebrow label used across every section.
 * Mono font, uppercase, wide tracking, optional dot+rule tail.
 */
export function Eyebrow({
  children,
  className,
  tone = "primary",
  rule = true,
  as: Tag = "p",
}: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "text-eyebrow flex items-center gap-3",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className="rule-dot" />
      <span>{children}</span>
      {rule ? <span className="rule-line max-w-16" /> : null}
    </Tag>
  );
}
