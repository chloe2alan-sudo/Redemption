# Redemption Hackers — self-contained publishing site

## What this includes
- Express web server
- SQLite database created automatically on first run
- Public homepage
- Public blog listing and article pages
- JSON publishing API
- Authenticated single-post and batch publishing
- Duplicate slug protection
- Basic content validation
- Daily batch size limit (default 50)
- No CMS required

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and set a long random `ADMIN_TOKEN`.
3. Run `npm install`.
4. Start with `npm start`.
5. Open `http://localhost:3000`.

The SQLite database is `data.sqlite` and is created automatically.

## Publish through the API
Use:
POST /api/publish-batch
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

Body:
{
  "posts": [
    {
      "title": "Example title",
      "slug": "example-title",
      "category": "Blockchain Tracing",
      "seo_description": "A useful description of the article for search and readers.",
      "content": "At least 400 characters of substantive educational content...",
      "status": "published"
    }
  ]
}

## Connecting the daily AI generator
The daily generator should create structured JSON and POST it to `/api/publish-batch`.
Keep the token server-side. Never put the admin token in browser JavaScript.

The generator should:
- create exactly up to 50 unique drafts per run
- avoid duplicates by checking titles/slugs before publishing
- use useful, substantive articles
- avoid guaranteed recovery claims or fabricated success rates
- never request or expose seed phrases, private keys, passwords or 2FA codes
- avoid hacking/unauthorized-access instructions
- avoid keyword stuffing
- keep content focused on blockchain tracing, scam prevention, evidence, lawful recovery and client education

## Production deployment
Use a Node-compatible host with persistent storage (for SQLite) or switch the DB layer to PostgreSQL for multi-instance/serverless hosting. Set `ADMIN_TOKEN` as a secret environment variable. Put HTTPS in front of the service. Add backups and rate limiting before public launch.

## Important
This implementation provides the publishing infrastructure. It does not secretly or automatically connect the existing ChatGPT scheduled task to the API; an external scheduler/AI integration must be configured with the API endpoint and server-side token.
