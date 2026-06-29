import Link from "next/link";
import type { PostSummary } from "@/lib/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {post.status === "draft" && (
          <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">Draft</span>
        )}
        {post.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded bg-brand-light px-2 py-0.5 font-medium text-brand-dark">
            {tag}
          </span>
        ))}
      </div>
      <h3 className="text-lg font-bold text-ink group-hover:text-brand-dark">{post.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{post.author}</span>
        <span>{formatDate(post.publishedAt)}</span>
      </div>
    </Link>
  );
}
