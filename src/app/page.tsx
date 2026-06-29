import Link from "next/link";
import { fetchPosts } from "@/lib/api";
import PostCard from "@/components/PostCard";

export default async function Home() {
  const posts = await fetchPosts();
  const latest = posts.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-light to-white">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <span className="inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-dark shadow-sm">
            Next.js · Vercel-ready · Nina API test harness
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            A base site to test the Nina blog publishing pipeline.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Nina&apos;s n8n workflow POSTs finished posts to <code className="rounded bg-slate-100 px-1.5 py-0.5 text-brand-dark">/api/posts</code>.
            They validate, persist, and render here automatically — a real end-to-end round trip.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/blog" className="rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark">
              View the blog
            </Link>
            <a
              href="https://vercel.com/new"
              className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-ink transition hover:border-brand"
            >
              Deploy on Vercel
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ink">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { step: "1", title: "Nina sends a post", body: "n8n's HTTP node POSTs JSON (title, body, tags…) with a Bearer token." },
            { step: "2", title: "The endpoint validates", body: "/api/posts checks the token, validates the payload, and writes an MDX file." },
            { step: "3", title: "It goes live", body: "The post renders at /blog/<slug> through the API-driven reader." },
          ].map((c) => (
            <div key={c.step} className="rounded-xl border border-slate-200 p-6">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">{c.step}</span>
              <h3 className="mt-4 font-bold text-ink">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest posts */}
      {latest.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ink">Latest posts</h2>
            <Link href="/blog" className="text-sm font-semibold text-brand hover:text-brand-dark">
              All posts →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
