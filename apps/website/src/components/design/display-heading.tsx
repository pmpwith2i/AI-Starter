import { cn } from "@/lib/utils";

interface DisplayHeadingProps {
  children: React.ReactNode;
  className?: string;
  /** Scale step — display is the largest; h1/h2 step down. */
  level?: "display" | "h1" | "h2";
  /** Render tag. Default `h2`; use `h1` on hero. */
  as?: "h1" | "h2" | "h3";
  id?: string;
}

const LEVEL_CLASS: Record<NonNullable<DisplayHeadingProps["level"]>, string> = {
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
};

export function DisplayHeading({
  children,
  className,
  level = "h2",
  as: Tag = "h2",
  id,
}: DisplayHeadingProps) {
  return (
    <Tag id={id} className={cn("text-ink", className, LEVEL_CLASS[level])}>
      {children}
    </Tag>
  );
}
