import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

interface ProseMarkdownProps {
  content: string;
  className?: string;
}

const isExternalHref = (href: string): boolean => {
  if (!href) return false;
  if (href.startsWith("/") || href.startsWith("#")) return false;
  try {
    new URL(href);
    return true;
  } catch {
    return false;
  }
};

const isHttpsImageUrl = (src: string): boolean => {
  try {
    const u = new URL(src);
    return u.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Renders descriptive markdown (course / event descriptions, etc.) safely.
 * Sanitizes HTML, externalises remote links, and gates images to https.
 */
export function ProseMarkdown({ content, className }: ProseMarkdownProps) {
  return (
    <div
      className={cn(
        "text-base leading-relaxed text-foreground",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        "[&_p]:my-4",
        "[&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground",
        "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1.5",
        "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:no-underline",
        "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em]",
        "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4",
        "[&_hr]:my-8 [&_hr]:border-border",
        "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
        "[&_img]:my-6 [&_img]:rounded-md",
        "[&_figure]:my-6 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          img({ src, alt }) {
            if (typeof src !== "string" || !isHttpsImageUrl(src)) return null;
            return (
              <figure>
                <img
                  src={src}
                  alt={alt ?? ""}
                  loading="lazy"
                  className="h-auto w-full rounded-md object-cover"
                />
                {alt ? <figcaption>{alt}</figcaption> : null}
              </figure>
            );
          },
          a({ href, children }) {
            if (!href || typeof href !== "string") return <>{children}</>;
            if (isExternalHref(href)) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  {children}
                </a>
              );
            }
            return <a href={href}>{children}</a>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
