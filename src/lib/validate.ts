import type { IncomingPost, PostStatus } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  value?: IncomingPost;
}

const VALID_STATUS: PostStatus[] = ["publish", "draft"];

/** Validate + coerce the raw JSON body posted to /api/posts. */
export function validateIncomingPost(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Body must be a JSON object"] };
  }

  const b = input as Record<string, unknown>;

  if (typeof b.title !== "string" || b.title.trim().length === 0) {
    errors.push("`title` is required and must be a non-empty string");
  }
  if (typeof b.body !== "string" || b.body.trim().length === 0) {
    errors.push("`body` is required and must be a non-empty string (Markdown)");
  }
  if (b.slug !== undefined && typeof b.slug !== "string") {
    errors.push("`slug` must be a string");
  }
  if (b.tags !== undefined && !(Array.isArray(b.tags) && b.tags.every((t) => typeof t === "string"))) {
    errors.push("`tags` must be an array of strings");
  }
  if (b.status !== undefined && !VALID_STATUS.includes(b.status as PostStatus)) {
    errors.push("`status` must be 'publish' or 'draft'");
  }
  if (b.publishedAt !== undefined && typeof b.publishedAt === "string" && Number.isNaN(Date.parse(b.publishedAt))) {
    errors.push("`publishedAt` must be a valid date string");
  }

  // `schema` may be a JSON string, an object, or an array of objects. If it's a
  // string, it must be valid JSON so we never inject malformed JSON-LD.
  let schema: IncomingPost["schema"] | undefined;
  if (b.schema !== undefined && b.schema !== null && b.schema !== "") {
    if (typeof b.schema === "string") {
      try {
        JSON.parse(b.schema);
        schema = b.schema;
      } catch {
        errors.push("`schema` must be valid JSON (string) or a JSON object");
      }
    } else if (typeof b.schema === "object") {
      schema = b.schema as IncomingPost["schema"];
    } else {
      errors.push("`schema` must be a JSON string or object");
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const value: IncomingPost = {
    title: (b.title as string).trim(),
    slug: typeof b.slug === "string" ? b.slug : undefined,
    excerpt: typeof b.excerpt === "string" ? b.excerpt : undefined,
    body: b.body as string,
    author: typeof b.author === "string" ? b.author : undefined,
    tags: Array.isArray(b.tags) ? (b.tags as string[]) : undefined,
    coverImage: typeof b.coverImage === "string" ? b.coverImage : undefined,
    publishedAt: typeof b.publishedAt === "string" ? b.publishedAt : undefined,
    status: VALID_STATUS.includes(b.status as PostStatus) ? (b.status as PostStatus) : undefined,
    schema,
  };

  return { ok: true, errors: [], value };
}

/** Constant-time-ish bearer token check. */
export function isAuthorized(req: Request): boolean {
  const expected = process.env.NINA_PUBLISH_TOKEN;
  if (!expected) return false; // fail closed if no token configured
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const provided = match[1].trim();
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
