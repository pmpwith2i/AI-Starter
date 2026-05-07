import { cn } from "@/lib/utils";

interface RingMarkProps {
  className?: string;
  /** Outer size in Tailwind units. Default 6 (24px). */
  size?: number;
}

/**
 * Signature mark — concentric ring pair. Clinical cross-section + human orbit.
 * Appears as a small accent in headers, eyebrows, loaders, footers.
 * Drawn inline so it inherits `currentColor` for light/dark + accent variants.
 */
export function RingMark({ className, size = 6 }: RingMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className="size-full"
      >
        <circle cx="12" cy="12" r="10.5" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
