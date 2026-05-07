import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Markdown } from "./markdown";

type ReasoningContextType = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const ReasoningContext = createContext<ReasoningContextType | undefined>(
  undefined,
);

function useReasoningContext() {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error(
      "useReasoningContext must be used within a Reasoning provider",
    );
  }
  return context;
}

export type ReasoningProps = {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isStreaming?: boolean;
};
function Reasoning({
  children,
  className,
  open,
  onOpenChange,
  isStreaming,
}: ReasoningProps) {
  "use no memo";
  const [internalOpen, setInternalOpen] = useState(false);
  const [prevIsStreaming, setPrevIsStreaming] = useState(isStreaming);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  // React-endorsed "adjusting state during render" pattern:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (prevIsStreaming !== isStreaming) {
    setPrevIsStreaming(isStreaming);
    if (isStreaming && !prevIsStreaming) {
      if (!isControlled) setInternalOpen(true);
    } else if (!isStreaming && prevIsStreaming) {
      if (!isControlled) setInternalOpen(false);
    }
  }

  return (
    <ReasoningContext.Provider
      value={{
        isOpen,
        onOpenChange: handleOpenChange,
      }}
    >
      <div className={className}>{children}</div>
    </ReasoningContext.Provider>
  );
}

export type ReasoningTriggerProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLButtonElement>;

function ReasoningTrigger({
  children,
  className,
  ...props
}: ReasoningTriggerProps) {
  const { isOpen, onOpenChange } = useReasoningContext();

  return (
    <button
      className={cn("flex cursor-pointer items-center gap-2", className)}
      onClick={() => onOpenChange(!isOpen)}
      {...props}
    >
      <span className="text-primary">{children}</span>
      <div
        className={cn(
          "transform transition-transform",
          isOpen ? "rotate-180" : "",
        )}
      >
        <ChevronDownIcon className="size-4" />
      </div>
    </button>
  );
}

export type ReasoningContentProps = {
  children: React.ReactNode;
  className?: string;
  markdown?: boolean;
  contentClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>;

function ReasoningContent({
  children,
  className,
  contentClassName,
  markdown = false,
  ...props
}: ReasoningContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<string>("0px");
  const { isOpen } = useReasoningContext();

  useEffect(() => {
    if (!contentRef.current || !innerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (innerRef.current && isOpen) {
        setMaxHeight(`${innerRef.current.scrollHeight}px`);
      }
    });

    observer.observe(innerRef.current);

    if (isOpen) {
      setMaxHeight(`${innerRef.current.scrollHeight}px`);
    } else {
      setMaxHeight("0px");
    }

    return () => observer.disconnect();
  }, [isOpen]);

  const content = markdown ? (
    <Markdown>{children as string}</Markdown>
  ) : (
    children
  );

  return (
    <div
      ref={contentRef}
      className={cn(
        "overflow-hidden transition-[max-height] duration-150 ease-out",
        className,
      )}
      style={{
        maxHeight,
      }}
      {...props}
    >
      <div
        ref={innerRef}
        className={cn(
          "text-muted-foreground prose prose-sm dark:prose-invert",
          contentClassName,
        )}
      >
        {content}
      </div>
    </div>
  );
}

export { Reasoning, ReasoningTrigger, ReasoningContent };
