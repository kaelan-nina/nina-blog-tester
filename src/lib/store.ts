// Post store with a swappable WRITE driver.
//
//   READ  (getPost / listPosts): always from the local filesystem. On Vercel the
//         committed MDX files are baked into each build, so the reader works in
//         both dev and production.
//   WRITE (savePost): driver-selected —
//         • "fs"  → writes a file locally. Perfect round-trip for `next dev`.
//         • "git" → commits the MDX to GitHub via the API, which triggers a
//                   Vercel rebuild so the post goes live (spec §2). Use this in
//                   production, where the runtime filesystem is read-only.
//
// Driver: BLOG_STORAGE = "fs" | "git". If unset, defaults to "git" when
// GITHUB_TOKEN is present (i.e. on Vercel) and "fs" otherwise (local dev).

import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { IncomingPost, Post, PostStatus, PostSummary } from "./types";
import { gitCommitFile, gitPostExists } from "./git-store";

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const CONTENT_REL = "content/blog"; // POSIX path used for Git commits

type Driver = "fs" | "git";

function driver(): Driver {
  const explicit = process.env.BLOG_STORAGE?.toLowerCase();
  if (explicit === "fs" || explicit === "git") return explicit;
  return process.env.GITHUB_TOKEN ? "git" : "fs";
}

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

function relPathFor(slug: string): string {
  return `${CONTENT_REL}/${slug}.mdx`;
}

/** Filesystem existence check (used by the local reader / fs driver). */
export async function postExists(slug: string): Promise<boolean> {
  try {
    await fs.access(fileFor(slug));
    return true;
  } catch {
    return false;
  }
}

/** Driver-aware existence check used before writing, to detect slug conflicts. */
async function existsForWrite(slug: string): Promise<boolean> {
  return driver() === "git" ? gitPostExists(relPathFor(slug)) : postExists(slug);
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

/** Normalize an incoming post and serialize it to MDX-with-frontmatter. */
function buildPost(incoming: IncomingPost): { post: Post; fileContents: string } {
  const slug = incoming.slug ? slugify(incoming.slug) : slugify(incoming.title);

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
  return { post, fileContents };
}

/**
 * Persist an incoming post via the active driver. Returns the normalized Post
 * plus the commit sha when the git driver is used.
 * Throws { code: "CONFLICT" } if the slug already exists.
 */
export async function savePost(incoming: IncomingPost): Promise<Post & { commit?: string }> {
  const { post, fileContents } = buildPost(incoming);

  if (await existsForWrite(post.slug)) {
    const err = new Error(`Post with slug "${post.slug}" already exists`);
    (err as Error & { code?: string }).code = "CONFLICT";
    throw err;
  }

  if (driver() === "git") {
    const commit = await gitCommitFile(
      relPathFor(post.slug),
      fileContents,
      `Publish blog post: ${post.title}`,
    );
    return { ...post, commit };
  }

  await ensureDir();
  await fs.writeFile(fileFor(post.slug), fileContents, "utf8");
  return post;
}
