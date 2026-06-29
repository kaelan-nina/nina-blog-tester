import type { Metadata } from "next";
import { fetchPosts } from "@/lib/api";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "All posts published through the Nina blog API.",
};

export default async function BlogIndex() {
  const posts = await fetchPosts();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-ink">Blog</h1>
        <p className="mt-2 text-slate-600">
          {posts.length} {posts.length === 1 ? "post" : "posts"} published via the Nina API.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          No posts yet. POST one to <code className="rounded bg-slate-100 px-1.5 py-0.5">/api/posts</code> to see it here.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
