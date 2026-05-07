import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  /** Constrain inner content width. */
  width?: "narrow" | "prose" | "wide";
  /** Vertical padding. `normal` = section-y; `lg` = section-y-lg; `none` for custom. */
  pad?: "normal" | "lg" | "none";
  /** Background treatment. `paper` = ground, `surface` = white card, `alt` = cool gray panel, `ink` = dark inverse. */
  tone?: "paper" | "surface" | "alt" | "ink";
  /** Optional top/bottom rule divider. */
  divider?: "top" | "bottom" | "both" | "none";
  /** Semantic HTML tag. Defaults to `section`. */
  as?: "section" | "article" | "div";
  /** Optional aria-labelledby id, forwarded to the outer element. */
  "aria-labelledby"?: string;
  /** Optional aria-label. */
  "aria-label"?: string;
  id?: string;
}

const WIDTH_CLASS: Record<NonNullable<SectionProps["width"]>, string> = {
  prose: "container-prose",
  narrow: "container-narrow",
  wide: "container-wide",
};

const PAD_CLASS: Record<NonNullable<SectionProps["pad"]>, string> = {
  normal: "section-y",
  lg: "section-y-lg",
  none: "",
};

const TONE_CLASS: Record<NonNullable<SectionProps["tone"]>, string> = {
  paper: "bg-background text-foreground",
  surface: "bg-[color:var(--surface)] text-foreground",
  alt: "bg-[color:var(--surface-2)] text-foreground",
  ink: "bg-[color:var(--ink)] text-[color:var(--surface)]",
};

const DIVIDER_CLASS: Record<NonNullable<SectionProps["divider"]>, string> = {
  top: "border-t border-[color:var(--rule)]",
  bottom: "border-b border-[color:var(--rule)]",
  both: "border-y border-[color:var(--rule)]",
  none: "",
};

export function Section({
  children,
  className,
  width = "wide",
  pad = "normal",
  tone = "paper",
  divider = "none",
  as: Tag = "section",
  id,
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
}: SectionProps) {
  return (
    <Tag
      id={id}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      className={cn(
        "relative section-x",
        PAD_CLASS[pad],
        TONE_CLASS[tone],
        DIVIDER_CLASS[divider],
        className,
      )}
    >
      <div className={WIDTH_CLASS[width]}>{children}</div>
    </Tag>
  );
}
