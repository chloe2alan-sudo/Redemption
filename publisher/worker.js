import OpenAI from "openai";

const required = ["OPENAI_API_KEY","BLOG_API_URL","BLOG_ADMIN_TOKEN"];
for (const k of required) if (!process.env[k]) throw new Error(`Missing ${k}`);

const count = Math.min(50, Math.max(1, Number(process.env.POSTS_PER_RUN || 50)));
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const prompt = `Create ${count} ORIGINAL blog article drafts for a legitimate cryptocurrency recovery assistance website.
Purpose: educate victims and prospective clients about blockchain tracing, scam prevention, evidence documentation, exchange reporting, wallet/address analysis, and lawful recovery options.

Return ONLY valid JSON:
{"posts":[{"title":"","slug":"","category":"","seo_description":"","content":"","status":"published"}]}

Requirements:
- Exactly ${count} posts.
- Every title and slug must be distinct.
- Substantive article body, minimum 700 words each.
- Useful, factual, reader-first writing; no keyword stuffing.
- No guaranteed recovery claims.
- No fabricated statistics, success rates, testimonials, case results, identities or credentials.
- Do not request or expose seed phrases, private keys, passwords or 2FA codes.
- Do not provide instructions for hacking, unauthorized access, credential theft, evasion or laundering.
- Clearly distinguish blockchain tracing from actual recovery.
- Encourage preserving evidence and using legitimate exchanges, law enforcement, regulators or qualified legal professionals where appropriate.
- Vary categories and article angles.
- Do not repeat the same article concept.
- The content must be suitable for direct publication.
`;

const response = await client.chat.completions.create({
  model,
  response_format: {type:"json_object"},
  messages: [
    {role:"system", content:"You are a careful editorial assistant for a lawful cryptocurrency recovery education website."},
    {role:"user", content:prompt}
  ]
});

const parsed = JSON.parse(response.choices[0].message.content);
if (!Array.isArray(parsed.posts) || parsed.posts.length !== count) {
  throw new Error(`Generator returned ${parsed.posts?.length || 0} posts; expected ${count}`);
}

for (const p of parsed.posts) {
  if (!p.title || !p.slug || !p.category || !p.seo_description || !p.content) {
    throw new Error(`Invalid generated post: ${p.title || "(untitled)"}`);
  }
}

const result = await fetch(process.env.BLOG_API_URL, {
  method:"POST",
  headers:{
    "content-type":"application/json",
    "authorization":`Bearer ${process.env.BLOG_ADMIN_TOKEN}`
  },
  body:JSON.stringify({posts:parsed.posts})
});

const text = await result.text();
if (!result.ok) throw new Error(`Blog API ${result.status}: ${text}`);
console.log(text);
