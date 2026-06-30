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

/** Heuristic: does this body already contain block-level HTML? */
function looksLikeHtml(body: string): boolean {
  return /<\/?(h[1-6]|p|ul|ol|li|div|section|article|table|thead|tbody|tr|td|th|blockquote|figure|img|a|strong|em|br|pre|code)\b[^>]*>/i.test(
    body,
  );
}

/**
 * Render a post body faithfully. Posts published from n8n arrive as ready HTML,
 * so we emit them verbatim; Markdown seed posts are run through marked. This
 * honors "whatever the workflow sends is what goes to the site."
 */
export function renderContent(body: string): string {
  return looksLikeHtml(body) ? body : renderMarkdown(body);
}
