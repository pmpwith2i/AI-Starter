import { Loader, type LoaderProps } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: LoaderProps["variant"];
  size?: LoaderProps["size"];
  className?: string;
}

function LoadingState({
  variant = "typing",
  size = "md",
  className,
}: LoadingStateProps) {
  return (
    <div className={cn("flex justify-center py-4 lg:py-8", className)}>
      <Loader variant={variant} size={size} />
    </div>
  );
}

export { LoadingState };
export type { LoadingStateProps };
