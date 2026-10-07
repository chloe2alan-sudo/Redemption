import express from "express";
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const adminToken = process.env.ADMIN_TOKEN || "change-me";
const postsPerRun = Number(process.env.POSTS_PER_RUN || 50);

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const dataDir = path.join(__dirname, "data");\nimport fs from "node:fs";\nfs.mkdirSync(dataDir, { recursive: true });\nconst db = new Database(path.join(dataDir, "data.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_status_date ON posts(status, published_at);
`);

function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}
function clean(s) {
  return String(s ?? "").trim();
}
function validPost(p) {
  return clean(p.title).length >= 8 &&
    clean(p.category).length >= 3 &&
    clean(p.seo_description).length >= 50 &&
    clean(p.content).length >= 400;
}
function auth(req, res, next) {
  const supplied = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!supplied || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(adminToken))) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/api/health", (req,res) => res.json({ok:true, service:"Redemption Hackers Blog API"}));

app.get("/api/posts", (req,res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const offset = (page - 1) * limit;
  const q = clean(req.query.q);
  const category = clean(req.query.category);
  let rows, total;
  if (q || category) {
    const like = `%${q}%`;
    rows = db.prepare(`
      SELECT id,title,slug,category,seo_description,featured_image,published_at
      FROM posts WHERE status='published'
      AND (?='' OR title LIKE ? OR seo_description LIKE ? OR content LIKE ?)
      AND (?='' OR category=?)
      ORDER BY published_at DESC LIMIT ? OFFSET ?
    `).all(q,like,like,like,category,category,limit,offset);
    total = db.prepare(`
      SELECT COUNT(*) n FROM posts WHERE status='published'
      AND (?='' OR title LIKE ? OR seo_description LIKE ? OR content LIKE ?)
      AND (?='' OR category=?)
    `).get(q,like,like,like,category,category).n;
  } else {
    rows = db.prepare(`
      SELECT id,title,slug,category,seo_description,featured_image,published_at
      FROM posts WHERE status='published'
      ORDER BY published_at DESC LIMIT ? OFFSET ?
    `).all(limit,offset);
    total = db.prepare(`SELECT COUNT(*) n FROM posts WHERE status='published'`).get().n;
  }
  res.json({page,limit,total,posts:rows});
});

app.get("/api/posts/:slug", (req,res) => {
  const post = db.prepare(`SELECT * FROM posts WHERE slug=? AND status='published'`).get(req.params.slug);
  if (!post) return res.status(404).json({error:"Post not found"});
  res.json(post);
});

app.post("/api/posts", auth, (req,res) => {
  const p = req.body || {};
  if (!validPost(p)) return res.status(400).json({error:"Invalid post fields"});
  const now = new Date().toISOString();
  let slug = slugify(p.slug || p.title);
  if (!slug) return res.status(400).json({error:"Invalid slug"});
  const exists = db.prepare("SELECT id FROM posts WHERE slug=?").get(slug);
  if (exists) slug += "-" + Date.now().toString(36);
  const status = ["draft","published"].includes(p.status) ? p.status : "published";
  const publishedAt = status === "published" ? (p.published_at || now) : null;
  const info = db.prepare(`
    INSERT INTO posts(title,slug,category,seo_description,content,featured_image,status,published_at,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)
  `).run(clean(p.title),slug,clean(p.category),clean(p.seo_description),clean(p.content),
    clean(p.featured_image)||null,status,publishedAt,now,now);
  res.status(201).json({id:info.lastInsertRowid,slug,status});
});

app.post("/api/publish-batch", auth, (req,res) => {
  const posts = Array.isArray(req.body?.posts) ? req.body.posts : [];
  if (!posts.length) return res.status(400).json({error:"posts array is required"});
  const accepted = [], rejected = [];
  const insert = db.prepare(`
    INSERT INTO posts(title,slug,category,seo_description,content,featured_image,status,published_at,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)
  `);
  const tx = db.transaction((items) => {
    for (const p of items.slice(0, postsPerRun)) {
      if (!validPost(p)) { rejected.push({title:p?.title || "", reason:"validation"}); continue; }
      let slug = slugify(p.slug || p.title);
      if (!slug) { rejected.push({title:p.title,reason:"slug"}); continue; }
      if (db.prepare("SELECT id FROM posts WHERE slug=?").get(slug)) {
        rejected.push({title:p.title,reason:"duplicate_slug"}); continue;
      }
      const now = new Date().toISOString();
      const status = p.status === "draft" ? "draft" : "published";
      const publishedAt = status === "published" ? (p.published_at || now) : null;
      insert.run(clean(p.title),slug,clean(p.category),clean(p.seo_description),clean(p.content),
        clean(p.featured_image)||null,status,publishedAt,now,now);
      accepted.push({title:p.title,slug,status});
    }
  });
  tx(posts);
  res.status(201).json({accepted,rejected,limit:postsPerRun});
});

app.delete("/api/posts/:id", auth, (req,res) => {
  const info = db.prepare("DELETE FROM posts WHERE id=?").run(Number(req.params.id));
  if (!info.changes) return res.status(404).json({error:"Post not found"});
  res.json({deleted:true});
});

app.get("*", (req,res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => console.log(`Redemption Hackers running on http://localhost:${port}`));
