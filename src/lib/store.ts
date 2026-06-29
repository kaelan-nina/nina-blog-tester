// File-backed post store.
//
// Posts are written as MDX files with YAML frontmatter into `content/blog/`,
// matching the recommended Git-backed architecture in the spec. This is the
// "save" step the spec calls out as swappable (Section 3): to move to a DB or
// headless CMS, reimplement these functions and nothing else changes.
//
// NOTE on hosting: filesystem writes work perfectly for local dev (`next dev`)
// and make this a real round-trip testbed. On Vercel's serverless runtime the
// filesystem is ephemeral, so for production publishing you'd swap savePost()
// for a GitHub-commit or database write (see spec Section 2/3).

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { IncomingPost, Post, PostStatus, PostSummary } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
}

function fileFor(slug: string): string {
  return path.join(CONTENT_DIR, `${slug}.mdx`);
}

export async function postExists(slug: string): Promise<boolean> {
  try {
    await fs.access(fileFor(slug));
    return true;
  } catch {
    return false;
  }
}

function parseFile(raw: string, slug: string): Post {
  const { data, content } = matter(raw);
  const status = (data.status as PostStatus) ?? "publish";
  return {
    title: String(data.title ?? slug),
    slug,
    excerpt: String(data.excerpt ?? ""),
    body: content.trim(),
    author: String(data.author ?? "Nina"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    coverImage: data.coverImage ? String(data.coverImage) : null,
    publishedAt: String(data.publishedAt ?? new Date().toISOString().slice(0, 10)),
    status,
  };
}

export async function getPost(slug: string): Promise<Post | null> {
  try {
    const raw = await fs.readFile(fileFor(slug), "utf8");
    return parseFile(raw, slug);
  } catch {
    return null;
  }
}

export async function listPosts(opts: { includeDrafts?: boolean } = {}): Promise<PostSummary[]> {
  await ensureDir();
  const entries = await fs.readdir(CONTENT_DIR);
  const slugs = entries.filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));

  const posts = await Promise.all(slugs.map((s) => getPost(s)));
  return posts
    .filter((p): p is Post => p !== null)
    .filter((p) => (opts.includeDrafts ? true : p.status === "publish"))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .map(({ body, ...summary }) => summary);
}

/**
 * Persist an incoming post. Returns the normalized stored Post.
 * Throws { code: "CONFLICT" } if the slug already exists.
 */
export async function savePost(incoming: IncomingPost): Promise<Post> {
  await ensureDir();
  const slug = incoming.slug ? slugify(incoming.slug) : slugify(incoming.title);

  if (await postExists(slug)) {
    const err = new Error(`Post with slug "${slug}" already exists`);
    (err as Error & { code?: string }).code = "CONFLICT";
    throw err;
  }

  const post: Post = {
    title: incoming.title.trim(),
    slug,
    excerpt: (incoming.excerpt ?? "").trim(),
    body: incoming.body.trim(),
    author: (incoming.author ?? "Nina").trim(),
    tags: incoming.tags ?? [],
    coverImage: incoming.coverImage ?? null,
    publishedAt: incoming.publishedAt ?? new Date().toISOString().slice(0, 10),
    status: incoming.status ?? "publish",
  };

  const frontmatter = {
    title: post.title,
    excerpt: post.excerpt,
    author: post.author,
    tags: post.tags,
    coverImage: post.coverImage ?? undefined,
    publishedAt: post.publishedAt,
    status: post.status,
  };

  const fileContents = matter.stringify(`\n${post.body}\n`, frontmatter);
  await fs.writeFile(fileFor(slug), fileContents, "utf8");
  return post;
}
