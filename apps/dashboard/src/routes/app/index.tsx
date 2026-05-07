import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/")({
  component: OverviewPage,
});

function OverviewPage() {
  const { firstName } = useAuth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          <Trans>Welcome{firstName ? `, ${firstName}` : ""}</Trans>
        </h1>
        <p className="mt-2 text-muted-foreground">
          <Trans>
            This is your starter dashboard. Add domain widgets here as you
            scaffold features per the type-cascade workflow.
          </Trans>
        </p>
      </header>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">
          <Trans>Next steps</Trans>
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            <Trans>Run the design-system checkpoint agent (see AGENTS.md)</Trans>
          </li>
          <li>
            <Trans>Pick your first domain and run the use-sdk skill</Trans>
          </li>
          <li>
            <Trans>Each new domain gets a route, a hook, and a section here</Trans>
          </li>
        </ul>
      </section>
    </div>
  );
}
