// Reader client. The front-end blog pages call these to fetch content.
//
// By default it reads from this same app's /api routes (relative). Set
// NEXT_PUBLIC_NINA_API_URL to point the reader at an external Nina API instead —
// this is the single swap point for "API-driven" content.

import type { Post, PostSummary } from "./types";

function apiBase(): string {
  const external = process.env.NEXT_PUBLIC_NINA_API_URL?.trim();
  return external && external.length > 0 ? external.replace(/\/$/, "") : "";
}

/**
 * On the server we can't use a relative URL with fetch, so when no external base
 * is configured we read the store directly. On the client, relative works.
 */
async function readDirect(): Promise<typeof import("./store") | null> {
  if (typeof window !== "undefined") return null; // browser → must use fetch
  if (apiBase()) return null; // external API configured → use fetch
  return import("./store");
}

export async function fetchPosts(): Promise<PostSummary[]> {
  const direct = await readDirect();
  if (direct) return direct.listPosts();

  const res = await fetch(`${apiBase()}/api/posts`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load posts: ${res.status}`);
  const json = await res.json();
  return json.posts as PostSummary[];
}

export async function fetchPost(slug: string): Promise<Post | null> {
  const direct = await readDirect();
  if (direct) return direct.getPost(slug);

  const res = await fetch(`${apiBase()}/api/posts/${slug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load post: ${res.status}`);
  const json = await res.json();
  return json.post as Post;
}
