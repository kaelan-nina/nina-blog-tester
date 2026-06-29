import { NextResponse } from "next/server";
import { listPosts, savePost } from "@/lib/store";
import { isAuthorized, validateIncomingPost } from "@/lib/validate";

export const dynamic = "force-dynamic";

/**
 * GET /api/posts — reader endpoint. Lists published posts (summaries).
 * Pass ?drafts=1 with a valid token to include drafts.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const wantDrafts = url.searchParams.get("drafts") === "1";
  const includeDrafts = wantDrafts && isAuthorized(req);
  const posts = await listPosts({ includeDrafts });
  return NextResponse.json({ ok: true, count: posts.length, posts });
}

/**
 * POST /api/posts — ingestion endpoint Nina's n8n workflow calls.
 * Contract: see n8n-to-nextjs-blog-api-spec.md, Section 4.
 */
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized: missing or invalid Bearer token" },
      { status: 401 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body must be valid JSON" }, { status: 400 });
  }

  const result = validateIncomingPost(raw);
  if (!result.ok || !result.value) {
    return NextResponse.json({ ok: false, error: "Validation failed", details: result.errors }, { status: 400 });
  }

  try {
    const post = await savePost(result.value);
    const origin = new URL(req.url).origin;
    return NextResponse.json(
      {
        ok: true,
        slug: post.slug,
        status: post.status,
        url: `${origin}/blog/${post.slug}`,
      },
      { status: 201 },
    );
  } catch (err) {
    if ((err as { code?: string }).code === "CONFLICT") {
      return NextResponse.json(
        { ok: false, error: (err as Error).message },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Storage failure", detail: (err as Error).message },
      { status: 502 },
    );
  }
}
