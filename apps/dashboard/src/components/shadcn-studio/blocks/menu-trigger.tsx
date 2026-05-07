import { PanelLeftCloseIcon, PanelRightCloseIcon } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { useSidebar } from "@/components/ui/use-sidebar";
import { Button } from "@/components/ui/button";
import type { buttonVariants } from "@/components/ui/button-variants";

type Props = {
  className?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
};

const MenuTrigger = ({ className, variant = "ghost" }: Props) => {
  const { open, isMobile, openMobile, toggleSidebar } = useSidebar();

  const isOpen = isMobile ? openMobile : open;

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggleSidebar}
      className={className}
    >
      {isOpen ? <PanelLeftCloseIcon /> : <PanelRightCloseIcon />}
    </Button>
  );
};

export default MenuTrigger;
