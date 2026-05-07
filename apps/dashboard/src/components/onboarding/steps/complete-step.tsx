import { Trans } from "@lingui/react/macro";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CompleteStep() {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-8 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">
          <Trans>Tutto pronto!</Trans>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans>
            Il tuo profilo è stato configurato. Ora puoi iniziare a usare la
            piattaforma.
          </Trans>
        </p>
      </div>
      <Button asChild>
        <Link to="/app">
          <Trans>Vai alla Dashboard</Trans>
        </Link>
      </Button>
    </div>
  );
}
