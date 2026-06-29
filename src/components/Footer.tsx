export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-slate-500 sm:flex-row">
        <p>Nina Blog Tester — a base Next.js app for the publishing API.</p>
        <p>Deployed on Vercel · Content via /api/posts</p>
      </div>
    </footer>
  );
}
