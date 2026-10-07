# Daily AI publisher

This worker generates up to 50 original articles and submits them to the Redemption Hackers publishing API.

## Setup

```bash
cd publisher
npm install
cp .env.example .env
```

Set:
- `OPENAI_API_KEY`
- `BLOG_API_URL`
- `BLOG_ADMIN_TOKEN`

Then run:

```bash
npm run
```

## Schedule

Run this worker once every day using cron, a server scheduler, or a CI scheduler.

Example cron:

```cron
15 2 * * * cd /path/to/redemption_hackers_complete/publisher && /usr/bin/node worker.js >> /var/log/redemption-blog.log 2>&1
```

The worker is deliberately separate from the public website. The OpenAI key and blog admin token stay on the server and are never sent to browser code.

Before production use, review the generated content workflow and monitor API errors, duplicate rejection and publishing logs.
