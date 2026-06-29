// GitHub-commit storage driver.
//
// Writes each post as an MDX commit to the repo via the GitHub Contents API.
// The commit triggers Vercel's Git integration → the site rebuilds and the new
// post is baked into the next build's filesystem, where the fs reader picks it
// up. This is the "save" step from spec §2 (Git-backed architecture), used in
// production where Vercel's runtime filesystem is read-only/ephemeral.
//
// Required env vars (set in Vercel):
//   GITHUB_TOKEN   fine-grained PAT with Contents: Read and write on the repo
//   GITHUB_OWNER   default "kaelan-nina"
//   GITHUB_REPO    default "nina-blog-tester"
//   GITHUB_BRANCH  default "main"

const API = "https://api.github.com";

interface GitConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export function gitConfig(): GitConfig {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return {
    token,
    owner: process.env.GITHUB_OWNER || "kaelan-nina",
    repo: process.env.GITHUB_REPO || "nina-blog-tester",
    branch: process.env.GITHUB_BRANCH || "main",
  };
}

function headers(cfg: GitConfig): HeadersInit {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "nina-blog-tester",
    "Content-Type": "application/json",
  };
}

function contentsUrl(cfg: GitConfig, path: string): string {
  return `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
}

/** Does a post file already exist on the target branch? */
export async function gitPostExists(path: string): Promise<boolean> {
  const cfg = gitConfig();
  const res = await fetch(`${contentsUrl(cfg, path)}?ref=${encodeURIComponent(cfg.branch)}`, {
    headers: headers(cfg),
    cache: "no-store",
  });
  if (res.status === 200) return true;
  if (res.status === 404) return false;
  throw new Error(`GitHub existence check failed: ${res.status} ${await res.text()}`);
}

/**
 * Commit a new MDX file to the repo. Returns the commit sha.
 * Throws { code: "CONFLICT" } if the file already exists.
 */
export async function gitCommitFile(path: string, fileContents: string, message: string): Promise<string> {
  const cfg = gitConfig();

  // Base64-encode the UTF-8 content (GitHub Contents API requirement).
  const contentB64 = Buffer.from(fileContents, "utf8").toString("base64");

  const res = await fetch(contentsUrl(cfg, path), {
    method: "PUT",
    headers: headers(cfg),
    body: JSON.stringify({
      message,
      content: contentB64,
      branch: cfg.branch,
    }),
  });

  if (res.status === 201) {
    const json = (await res.json()) as { commit?: { sha?: string } };
    return json.commit?.sha ?? "";
  }

  // 422 = file already exists (we didn't send a sha for update).
  if (res.status === 422) {
    const err = new Error(`File already exists at ${path}`);
    (err as Error & { code?: string }).code = "CONFLICT";
    throw err;
  }

  throw new Error(`GitHub commit failed: ${res.status} ${await res.text()}`);
}
