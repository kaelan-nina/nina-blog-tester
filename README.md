# Nina Blog Tester

A base **Next.js (App Router) + TypeScript + Tailwind** site, Vercel-ready, built to
test the Nina blog publishing pipeline end to end. It implements **both sides** of the
contract in `../n8n-to-nextjs-blog-api-spec.md`:

- **Ingestion** — `POST /api/posts`, the endpoint Nina's n8n workflow calls (Bearer auth, validation, persistence).
- **Reader** — an API-driven `/blog` that renders whatever gets published.

## Quick start

```bash
cd nina-blog-tester
npm install
cp .env.example .env.local   # then set NINA_PUBLISH_TOKEN
npm run dev                  # http://localhost:3000
```

Publish a test post (in a second terminal):

```bash
npm run seed:post            # uses NINA_PUBLISH_TOKEN from your env
```

…or by hand:

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer $NINA_PUBLISH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"How to Choose a Hemp Supplier","body":"## Full post in Markdown..."}'
```

Then open <http://localhost:3000/blog>.

## API

### `POST /api/posts` — publish a post (Nina → site)

Headers: `Authorization: Bearer <NINA_PUBLISH_TOKEN>`, `Content-Type: application/json`

Body (per spec §4):

```json
{
  "title": "How to Choose a Hemp Supplier",
  "slug": "how-to-choose-a-hemp-supplier",
  "excerpt": "Short summary for cards and meta description.",
  "body": "## Full post in Markdown...",
  "author": "Nina",
  "tags": ["hemp", "sourcing"],
  "coverImage": "https://.../cover.jpg",
  "publishedAt": "2026-06-29",
  "status": "publish"
}
```

Only `title` and `body` are required; `slug` is derived from the title if omitted.

Responses: `201` created · `400` validation failure · `401` bad/missing token ·
`409` slug already exists · `502` storage failure.

### `GET /api/posts` — list posts (reader)

Returns published post summaries. Add `?drafts=1` with a valid Bearer token to include drafts.

### `GET /api/posts/:slug` — single post (reader)

## How content is stored

Reads (`getPost` / `listPosts`) always come from the local filesystem (`content/blog/`).
On Vercel the committed MDX files are baked into each build, so the reader works in dev
and production alike.

Writes (`savePost`) go through a **swappable driver** set by `BLOG_STORAGE`:

| Driver | What it does | Use for |
|---|---|---|
| `fs` | Writes the MDX file to disk | Local `next dev` — a real round-trip |
| `git` | Commits the MDX to GitHub via the API, triggering a Vercel rebuild | Production on Vercel |

If `BLOG_STORAGE` is unset it defaults to `git` when `GITHUB_TOKEN` is present (i.e. on
Vercel) and `fs` otherwise. The git path lives in `src/lib/git-store.ts`; to move to a
database or headless CMS instead, add another driver branch in `savePost` — nothing else
changes.

### Enabling the git driver in production

The serverless filesystem on Vercel is read-only at runtime, so production publishing
commits to the repo and lets Vercel's Git integration redeploy. To enable it, set these
in **Vercel → Settings → Environment Variables**:

- `BLOG_STORAGE` = `git`
- `GITHUB_TOKEN` = a **fine-grained Personal Access Token** scoped to this repo with
  **Contents: Read and write**
- `GITHUB_OWNER` = `kaelan-nina`, `GITHUB_REPO` = `nina-blog-tester`, `GITHUB_BRANCH` = `main`

A `POST /api/posts` then commits `content/blog/<slug>.mdx`, Vercel rebuilds, and the post
goes live in ~30–60s. The `201` response includes the `commit` sha.

## Pointing the reader at an external API

Set `NEXT_PUBLIC_NINA_API_URL` to read blog content from a different Nina service instead
of this app's own routes. Leave it blank to read locally (default).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add env var `NINA_PUBLISH_TOKEN` (and optionally `NEXT_PUBLIC_NINA_API_URL`).
4. Deploy.

## Stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS 3 · gray-matter · marked
