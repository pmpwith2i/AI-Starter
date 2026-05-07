import { cn } from "@/lib/utils";

interface MarkerProps {
  n: number | string;
  className?: string;
}

export function Marker({ n, className }: MarkerProps) {
  const formatted = typeof n === "number" ? String(n).padStart(2, "0") : n;
  return (
    <span
      aria-hidden
      className={cn(
        "numerals leading-none text-[color:var(--ink-soft)] font-mono text-sm tracking-[0.16em]",
        className,
      )}
    >
      {formatted}
    </span>
  );
}
