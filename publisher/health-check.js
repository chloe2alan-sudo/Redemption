const url = process.env.BLOG_API_URL;
if (!url) throw new Error("Set BLOG_API_URL");
const r = await fetch(url.replace(/\/publish-batch$/, "/../health").replace("/api/../","/api/"));
console.log("HTTP", r.status);
console.log(await r.text());
