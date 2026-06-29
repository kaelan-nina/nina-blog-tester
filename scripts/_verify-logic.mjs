// Standalone verification of the core publishing logic (no Next required).
// Mirrors src/lib/store.ts (slugify + frontmatter round-trip),
// src/lib/markdown.ts (marked render), and src/lib/validate.ts (validation).
// Run from a dir where gray-matter + marked are installed.
import matter from "gray-matter";
import { marked } from "marked";

let pass = 0, fail = 0;
const ok = (name, cond) => { (cond ? pass++ : fail++); console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); };

// --- slugify (copied from store.ts) ---
function slugify(input) {
  return input.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
}
ok("slugify basic", slugify("How to Choose a Hemp Supplier") === "how-to-choose-a-hemp-supplier");
ok("slugify punctuation", slugify("Nina's Guide: Part 1!") === "ninas-guide-part-1");

// --- validation (copied rules from validate.ts) ---
function validate(b) {
  const errors = [];
  if (typeof b?.title !== "string" || !b.title.trim()) errors.push("title");
  if (typeof b?.body !== "string" || !b.body.trim()) errors.push("body");
  if (b?.status !== undefined && !["publish", "draft"].includes(b.status)) errors.push("status");
  return errors;
}
ok("validate rejects empty", validate({}).length === 2);
ok("validate accepts minimal", validate({ title: "T", body: "B" }).length === 0);
ok("validate bad status", validate({ title: "T", body: "B", status: "nope" }).includes("status"));

// --- frontmatter round-trip (store.ts savePost -> getPost) ---
const fm = { title: "Test", excerpt: "x", author: "Nina", tags: ["a", "b"], publishedAt: "2026-06-29", status: "publish" };
const file = matter.stringify("\n## Body\n\nHello\n", fm);
const parsed = matter(file);
ok("frontmatter title preserved", parsed.data.title === "Test");
ok("frontmatter tags preserved", Array.isArray(parsed.data.tags) && parsed.data.tags.length === 2);
ok("body preserved", parsed.content.includes("## Body"));

// --- markdown render (markdown.ts) ---
marked.setOptions({ gfm: true, breaks: false });
const html = marked.parse("## Hi\n\n- one\n- two\n\n[link](https://x.com)", { async: false });
ok("md renders h2", html.includes("<h2"));
ok("md renders list", html.includes("<li>"));
ok("md renders link", html.includes('href="https://x.com"'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
