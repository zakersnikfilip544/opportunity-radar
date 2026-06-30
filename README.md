# Opportunity Radar

**AI-powered business intelligence platform that discovers where money is moving.**

> Not another news site. Opportunity Radar scans thousands of sources daily and answers: *Who should I sell to today?*

---

## What It Does

Every day, the platform scans public sources and uses AI to identify **real business opportunities**:

- Who just received funding?
- Who is hiring aggressively?
- Who is expanding operations?
- Which companies are adopting new technology?
- What government tenders are open?
- Where is capital flowing?

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS |
| Database | Supabase (PostgreSQL) |
| AI | OpenAI GPT-4o-mini |
| Scrapers | RSS, HN API, Reddit API, GitHub Trending |
| Jobs | node-cron (background scheduling) |
| Deployment | Docker / Vercel |

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd opportunity-radar
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `OPENAI_API_KEY` — OpenAI API key
- `CRON_SECRET` — random string to secure cron endpoints

### 3. Set up database

In Supabase SQL Editor, run:
1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_functions.sql`

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
opportunity-radar/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # All authenticated pages
│   │   │   ├── dashboard/        # Main dashboard with stats + charts
│   │   │   ├── opportunities/    # Opportunity feed + detail pages
│   │   │   ├── companies/        # Company pages with timeline
│   │   │   ├── search/           # AI natural language search
│   │   │   ├── digest/           # Daily intelligence briefing
│   │   │   ├── saved/            # Saved opportunities
│   │   │   └── settings/         # Configuration
│   │   └── api/                  # REST API routes
│   ├── components/               # Reusable UI components
│   ├── lib/
│   │   ├── openai/               # AI analysis + search parsing
│   │   ├── scrapers/             # RSS, HN, Reddit, GitHub scrapers
│   │   └── supabase/             # Database client
│   └── types/                    # TypeScript types + constants
├── scripts/jobs.js               # Background job scheduler
├── supabase/migrations/          # Database schema + functions
├── Dockerfile                    # Production Docker image
└── docker-compose.yml            # Full stack deployment
```

---

## Data Sources

| Source | Type | Status |
|--------|------|--------|
| Hacker News | API | ✅ Active |
| TechCrunch | RSS | ✅ Active |
| VentureBeat | RSS | ✅ Active |
| Product Hunt | RSS | ✅ Active |
| Reddit r/entrepreneur | RSS | ✅ Active |
| Reddit r/startups | RSS | ✅ Active |
| GitHub Trending | Scraper | ✅ Active |
| Y Combinator | RSS | ✅ Active |
| Reuters Business | RSS | ✅ Active |
| EU Funding Portal | RSS | ✅ Active |
| Crunchbase | API | 🔑 Key needed |
| LinkedIn | Manual | 🔜 Planned |

---

## AI Analysis

Every article is analyzed with GPT-4o-mini. Extracted fields:

- **Opportunity type** (funding, hiring, expansion, tender, etc.)
- **Company & industry** extraction
- **Geographic location**
- **5 AI scores**: Opportunity, Growth, Sales Potential, Urgency, Confidence
- **Why it matters** — business context
- **Suggested action** — what to do in next 48h
- **Cold email template** — ready to send
- **LinkedIn message** — personalized outreach
- **Target roles** — who to contact
- **Services to offer** — what to pitch

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/opportunities` | List opportunities with filters |
| GET | `/api/opportunities/:id` | Get single opportunity |
| GET | `/api/companies` | List companies |
| GET | `/api/companies/:id` | Get company + timeline |
| GET | `/api/search?q=...` | AI natural language search |
| GET | `/api/digest` | Get daily digest |
| POST | `/api/digest` | Generate digest (cron) |
| POST | `/api/scrape` | Trigger scraping (cron) |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/health` | Health check |

---

## Deployment

### Docker

```bash
cp .env.example .env
# fill in .env

docker-compose up -d
```

### Vercel

```bash
vercel deploy
```

Set all env vars in Vercel dashboard. Add cron jobs via Vercel Cron:

```json
// vercel.json
{
  "crons": [
    { "path": "/api/scrape", "schedule": "0 */2 * * *" },
    { "path": "/api/digest", "schedule": "0 7 * * *" }
  ]
}
```

---

## Opportunity Types

| Type | Description |
|------|-------------|
| `funding` | Company received investment |
| `hiring` | Aggressive hiring signals |
| `expansion` | Geographic or market expansion |
| `construction` | New facilities being built |
| `government_tender` | Public procurement opportunity |
| `acquisition` | M&A activity |
| `investment` | Company investing capital |
| `factory_expansion` | Manufacturing scale-up |
| `new_product` | Product launch signals |
| `technology_adoption` | Digital transformation |
| `energy_project` | Renewable/energy infrastructure |
| `digital_transformation` | IT modernization |
| `partnership` | Strategic alliances |
| `ipo` | IPO preparations |

---

## Target Users

- **Sales teams** — find warm leads before competitors
- **Agencies** — identify companies about to need services
- **Solar/energy companies** — find infrastructure projects
- **Recruiters** — spot companies about to hire
- **Consultants** — identify transformation projects
- **Investors** — track where capital is flowing

---

## License

MIT
