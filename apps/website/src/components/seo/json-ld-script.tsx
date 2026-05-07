import { serializeJsonLd } from "@/lib/seo/jsonld";

type JsonLdPayload =
  | Record<string, unknown>
  | ReadonlyArray<Record<string, unknown>>;

interface JsonLdScriptProps {
  data: JsonLdPayload;
}

export function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
