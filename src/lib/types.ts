// Shared types for the Nina blog publishing API + reader.
// The payload shape mirrors the agreed contract in
// `n8n-to-nextjs-blog-api-spec.md` (Section 4).

export type PostStatus = "publish" | "draft";

/** What Nina's n8n workflow POSTs to /api/posts. */
export interface IncomingPost {
  title: string;
  slug?: string; // derived from title if omitted
  excerpt?: string;
  body: string; // Markdown
  author?: string;
  tags?: string[];
  coverImage?: string;
  publishedAt?: string; // ISO date (YYYY-MM-DD)
  status?: PostStatus;
}

/** A stored post, as the reader API returns it. */
export interface Post {
  title: string;
  slug: string;
  excerpt: string;
  body: string; // Markdown
  author: string;
  tags: string[];
  coverImage: string | null;
  publishedAt: string; // ISO date
  status: PostStatus;
}

/** List view: same as Post but without the full body. */
export type PostSummary = Omit<Post, "body">;
