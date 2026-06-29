// Quick helper to exercise POST /api/posts the way Nina's n8n workflow will.
// Usage:
//   node scripts/post-sample.mjs                  (posts to http://localhost:3000)
//   BASE_URL=https://your.vercel.app node scripts/post-sample.mjs
//
// Requires NINA_PUBLISH_TOKEN in the environment (matches .env.local).

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const TOKEN = process.env.NINA_PUBLISH_TOKEN ?? "dev-local-token-change-me";

const sample = {
  title: `Sample Post ${new Date().toISOString().slice(0, 19)}`,
  excerpt: "Posted via scripts/post-sample.mjs to test the ingestion endpoint.",
  body: [
    "## It works",
    "",
    "This post was created by hitting `POST /api/posts` with a Bearer token —",
    "exactly the path Nina's n8n workflow uses.",
    "",
    "- Validated",
    "- Stored as MDX",
    "- Rendered through the API-driven reader",
  ].join("\n"),
  author: "Nina",
  tags: ["test", "api"],
  status: "publish",
};

const res = await fetch(`${BASE_URL}/api/posts`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
  },
  body: JSON.stringify(sample),
});

const json = await res.json().catch(() => ({}));
console.log(`Status: ${res.status}`);
console.log(JSON.stringify(json, null, 2));
if (json.url) console.log(`\nView it: ${json.url}`);
