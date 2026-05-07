"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before the transition starts. */
  delay?: number;
  /** IntersectionObserver threshold. */
  threshold?: number;
  as?: "div" | "section" | "article" | "header" | "li" | "span";
}

/**
 * Scroll-in reveal primitive. Uses IntersectionObserver + CSS vars rather
 * than a motion library — zero runtime dep, honors prefers-reduced-motion
 * via the `.anim-in` utility defined in globals.css.
 */
export function AnimateIn({
  children,
  className,
  delay = 0,
  threshold = 0.15,
  as: Tag = "div",
}: AnimateInProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already in/above viewport on mount — reveal immediately.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  // Cast the polymorphic ref once — Tag is narrowed to an HTMLElement subtype.
  const style = { ["--anim-delay" as string]: `${delay}ms` };
  const classes = cn("anim-in", visible && "is-visible", className);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;
  return (
    <Component ref={ref} className={classes} style={style}>
      {children}
    </Component>
  );
}
