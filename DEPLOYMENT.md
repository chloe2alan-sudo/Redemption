# Deployment — no CMS required

## Option A: Docker
On a server with Docker installed:

```bash
mkdir -p data
export ADMIN_TOKEN="$(openssl rand -hex 32)"
docker compose up -d --build
```

The site will listen on port 3000. Put HTTPS/reverse proxy in front of it for production.

## Publishing 50 articles
The API accepts a batch:

`POST /api/publish-batch`

Header:

`Authorization: Bearer YOUR_ADMIN_TOKEN`

JSON:

```json
{
  "posts": [
    {
      "title": "Example educational article",
      "slug": "example-educational-article",
      "category": "Blockchain Tracing",
      "seo_description": "A clear description of the article for search engines and readers.",
      "content": "Substantive educational article content of at least 400 characters.",
      "status": "published"
    }
  ]
}
```

The server caps each request at 50 posts and rejects duplicate slugs.

## Connecting the daily AI job
Use your scheduler to send its generated JSON to the API endpoint. Keep the bearer token only in the scheduler/server secret store.

The content policy for this site should remain:
- lawful blockchain tracing and recovery education
- no guaranteed recovery claims
- no fabricated success rates or testimonials
- no seed phrases, private keys, passwords or 2FA requests
- no unauthorized-access/hacking instructions
- no keyword stuffing

## Database
The SQLite database is persisted in `./data/data.sqlite` when using Docker Compose. Back it up regularly.

For a multi-server/serverless deployment, migrate the same schema to PostgreSQL rather than relying on local SQLite.
