import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPost } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: post.coverImage ? { images: [post.coverImage] } : undefined,
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
  if (!post) notFound();

  const html = renderMarkdown(post.body);

  return (
    <article className="mx-auto max-w-content px-6 py-16">
      <Link href="/blog" className="text-sm font-semibold text-brand hover:text-brand-dark">
        ← Back to blog
      </Link>

      <header className="mt-6">
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {post.status === "draft" && (
            <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">Draft</span>
          )}
          {post.tags.map((tag) => (
            <span key={tag} className="rounded bg-brand-light px-2 py-0.5 font-medium text-brand-dark">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">{post.title}</h1>
        <p className="mt-3 text-sm text-slate-500">
          By {post.author} · {formatDate(post.publishedAt)}
        </p>
      </header>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" className="mt-8 w-full rounded-xl object-cover" />
      )}

      <div className="prose-nina mt-8" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
