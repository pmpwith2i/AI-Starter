interface LegalPageProps {
  title: string;
  version?: string;
  updatedAt?: string;
  content: string;
}

export function LegalPage({
  title,
  version,
  updatedAt,
  content,
}: LegalPageProps) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12 lg:px-8 lg:py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
          {title}
        </h1>
        {version ? (
          <p className="text-sm text-muted-foreground">
            Versione {version}
            {updatedAt
              ? ` · ultimo aggiornamento ${new Date(updatedAt).toLocaleDateString("it-IT")}`
              : ""}
          </p>
        ) : null}
      </header>
      <article className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {content}
      </article>
    </main>
  );
}
