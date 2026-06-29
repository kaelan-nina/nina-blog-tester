import { NextResponse } from "next/server";
import { getPost } from "@/lib/store";

export const dynamic = "force-dynamic";

/** GET /api/posts/:slug — reader endpoint for a single post. */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, post });
}
