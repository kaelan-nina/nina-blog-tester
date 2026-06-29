import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render Markdown post bodies to HTML for display.
 * Content originates from Nina (trusted), but treat the endpoint as public-facing
 * per the spec — keep rendering deterministic and avoid raw HTML passthrough.
 */
export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
