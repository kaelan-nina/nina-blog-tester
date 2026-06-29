import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-ink">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-sm text-white">N</span>
          Nina<span className="font-medium text-slate-400">Tester</span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/blog" className="hover:text-ink">
            Blog
          </Link>
          <Link
            href="/blog"
            className="rounded-full bg-brand px-4 py-2 text-white transition hover:bg-brand-dark"
          >
            Read posts
          </Link>
        </div>
      </nav>
    </header>
  );
}
