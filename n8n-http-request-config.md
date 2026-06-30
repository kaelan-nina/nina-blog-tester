# n8n → Nina Blog Tester: HTTP Request node config

Copy-paste reference for the n8n **HTTP Request** node that publishes a finished
post to the live site (`https://nina-blog-tester.vercel.app`). The node commits the
post to GitHub, which auto-rebuilds Vercel — no deploy-hook call needed.

---

## 1. Store the token as a credential (do this once)

Keep the bearer token out of the workflow body by putting it in a reusable credential.

- In n8n: **Credentials → New → "Header Auth"**
- **Name:** `Authorization`
- **Value:** `Bearer aed4cf8a4368abd3171ba7e1f49992ce2e19dc269fc63f560f5af0585267692f`
- Save it as something like **"Nina Publish Token"**.

> This value must match `NINA_PUBLISH_TOKEN` in Vercel. If you rotate one, rotate both.

---

## 2. HTTP Request node settings

| Field | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `https://nina-blog-tester.vercel.app/api/posts` |
| **Authentication** | Generic Credential Type → **Header Auth** → *Nina Publish Token* |
| **Send Body** | ON |
| **Body Content Type** | **JSON** |
| **Specify Body** | **Using JSON** |

---

## 3. Body (JSON, with expressions)

Map each field from whatever upstream node holds the finished post (shown here as
`$json.*`). Only `title` and `body` are required; the rest are optional.

```json
{
  "title": "={{ $json.title }}",
  "body": "={{ $json.body }}",
  "excerpt": "={{ $json.excerpt }}",
  "author": "={{ $json.author || 'Nina' }}",
  "tags": "={{ $json.tags || [] }}",
  "coverImage": "={{ $json.coverImage || '' }}",
  "publishedAt": "={{ $json.publishedAt || $now.format('yyyy-MM-dd') }}",
  "status": "publish"
}
```

Notes:
- Omit `slug` to let the API derive it from the title, or send `"slug": "={{ $json.slug }}"` to control it.
- `tags` must be an array of strings. If your upstream value is a comma string, convert it:
  `"tags": "={{ ($json.tags || '').split(',').map(t => t.trim()).filter(Boolean) }}"`
- `status` can be `"publish"` or `"draft"`. Drafts are stored but hidden from the public blog.
- `coverImage` may be an empty string or omitted; the API treats it as "no image."

---

## 4. Success / error handling

**Success → `201`:**
```json
{ "ok": true, "slug": "how-to-choose-a-hemp-supplier", "status": "publish",
  "commit": "7f8b5b8…", "url": "https://nina-blog-tester.vercel.app/blog/how-to-choose-a-hemp-supplier" }
```
The post is live ~30–60s later, once Vercel finishes the auto-rebuild.

**Errors:**

| Code | Meaning | Fix |
|---|---|---|
| `400` | Validation failed (missing/empty `title` or `body`, bad `tags`/`status`) | Check the `details` array in the response |
| `401` | Missing/invalid bearer token | Token in n8n ≠ `NINA_PUBLISH_TOKEN` in Vercel |
| `409` | A post with that slug already exists | Use a unique slug/title |
| `502` | GitHub commit failed | Usually `GITHUB_TOKEN` expired or lost Contents-write — reissue it in Vercel |

Tip: enable **Retry On Fail** (2–3 attempts) on the node for transient `502`s.
