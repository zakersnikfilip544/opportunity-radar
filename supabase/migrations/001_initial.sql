-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE opportunity_type AS ENUM (
  'funding',
  'hiring',
  'expansion',
  'construction',
  'government_tender',
  'acquisition',
  'investment',
  'factory_expansion',
  'new_product',
  'technology_adoption',
  'energy_project',
  'digital_transformation',
  'partnership',
  'ipo',
  'other'
);

CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE source_type AS ENUM (
  'rss',
  'google_news',
  'hacker_news',
  'reddit',
  'github_trending',
  'product_hunt',
  'eu_funding',
  'government_tender',
  'press_release',
  'linkedin',
  'crunchbase',
  'ycombinator',
  'manual'
);

-- ============================================================
-- COMPANIES
-- ============================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  description TEXT,
  industry TEXT,
  sub_industry TEXT,
  country TEXT,
  city TEXT,
  founded_year INTEGER,
  employee_count_range TEXT,
  website TEXT,
  linkedin_url TEXT,
  logo_url TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);

-- ============================================================
-- SOURCES
-- ============================================================

CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type source_type NOT NULL,
  url TEXT NOT NULL,
  feed_url TEXT,
  country TEXT,
  industry_focus TEXT,
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  scrape_interval_minutes INTEGER DEFAULT 60,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RAW ARTICLES
-- ============================================================

CREATE TABLE raw_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  external_id TEXT,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT UNIQUE NOT NULL,
  published_at TIMESTAMPTZ,
  author TEXT,
  raw_html TEXT,
  is_processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_raw_articles_source ON raw_articles(source_id);
CREATE INDEX idx_raw_articles_processed ON raw_articles(is_processed);
CREATE INDEX idx_raw_articles_published ON raw_articles(published_at DESC);

-- ============================================================
-- OPPORTUNITIES
-- ============================================================

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_analysis TEXT,

  -- Classification
  type opportunity_type NOT NULL DEFAULT 'other',
  industry TEXT,
  sub_type TEXT,

  -- Scores (0-100)
  opportunity_score INTEGER CHECK (opportunity_score BETWEEN 0 AND 100),
  growth_score INTEGER CHECK (growth_score BETWEEN 0 AND 100),
  sales_potential INTEGER CHECK (sales_potential BETWEEN 0 AND 100),
  urgency_score INTEGER CHECK (urgency_score BETWEEN 0 AND 100),
  competition_level INTEGER CHECK (competition_level BETWEEN 0 AND 100),
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),

  urgency urgency_level DEFAULT 'medium',

  -- Geography
  country TEXT,
  city TEXT,
  region TEXT,

  -- Value estimation
  estimated_value_min BIGINT,
  estimated_value_max BIGINT,
  estimated_value_currency TEXT DEFAULT 'EUR',

  -- Relations
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  raw_article_id UUID REFERENCES raw_articles(id) ON DELETE SET NULL,
  source_url TEXT,

  -- AI outputs
  why_it_matters TEXT,
  potential_buyers TEXT[],
  potential_sellers TEXT[],
  suggested_action TEXT,
  cold_email TEXT,
  linkedin_message TEXT,
  target_roles TEXT[],
  services_to_offer TEXT[],

  -- Tags
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,

  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_country ON opportunities(country);
CREATE INDEX idx_opportunities_industry ON opportunities(industry);
CREATE INDEX idx_opportunities_published ON opportunities(published_at DESC);
CREATE INDEX idx_opportunities_scores ON opportunities(opportunity_score DESC);
CREATE INDEX idx_opportunities_urgency ON opportunities(urgency);
CREATE INDEX idx_opportunities_company ON opportunities(company_id);
CREATE INDEX idx_opportunities_tags ON opportunities USING gin(tags);
CREATE INDEX idx_opportunities_title_trgm ON opportunities USING gin(title gin_trgm_ops);
CREATE INDEX idx_opportunities_summary_trgm ON opportunities USING gin(summary gin_trgm_ops);

-- Full text search
ALTER TABLE opportunities ADD COLUMN search_vector TSVECTOR;
CREATE INDEX idx_opportunities_fts ON opportunities USING gin(search_vector);

CREATE OR REPLACE FUNCTION update_opportunities_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.why_it_matters, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opportunities_search_vector_trigger
  BEFORE INSERT OR UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_opportunities_search_vector();

-- ============================================================
-- COMPANY EVENTS (timeline)
-- ============================================================

CREATE TABLE company_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_events_company ON company_events(company_id);
CREATE INDEX idx_company_events_date ON company_events(event_date DESC);

-- ============================================================
-- DAILY DIGESTS
-- ============================================================

CREATE TABLE daily_digests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  digest_date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  opportunity_ids UUID[] DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_digests_date ON daily_digests(digest_date DESC);

-- ============================================================
-- USER SAVED OPPORTUNITIES
-- ============================================================

CREATE TABLE saved_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

CREATE INDEX idx_saved_opportunities_user ON saved_opportunities(user_id);

-- ============================================================
-- SCRAPE LOGS
-- ============================================================

CREATE TABLE scrape_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  articles_found INTEGER DEFAULT 0,
  articles_new INTEGER DEFAULT 0,
  opportunities_created INTEGER DEFAULT 0,
  error TEXT,
  status TEXT DEFAULT 'running'
);

CREATE INDEX idx_scrape_logs_source ON scrape_logs(source_id);
CREATE INDEX idx_scrape_logs_started ON scrape_logs(started_at DESC);

-- ============================================================
-- DEFAULT SOURCES
-- ============================================================

INSERT INTO sources (name, type, url, feed_url, country, language) VALUES
  ('Hacker News', 'hacker_news', 'https://news.ycombinator.com', 'https://hnrss.org/newest?points=50', 'US', 'en'),
  ('TechCrunch', 'rss', 'https://techcrunch.com', 'https://techcrunch.com/feed/', 'US', 'en'),
  ('VentureBeat', 'rss', 'https://venturebeat.com', 'https://feeds.feedburner.com/venturebeat/SZYF', 'US', 'en'),
  ('EU Funding Opportunities', 'eu_funding', 'https://ec.europa.eu/info/funding-tenders', NULL, 'EU', 'en'),
  ('Product Hunt', 'product_hunt', 'https://producthunt.com', 'https://www.producthunt.com/feed', 'US', 'en'),
  ('Reddit r/entrepreneur', 'reddit', 'https://reddit.com/r/entrepreneur', 'https://www.reddit.com/r/entrepreneur/.rss', 'US', 'en'),
  ('Reddit r/startups', 'reddit', 'https://reddit.com/r/startups', 'https://www.reddit.com/r/startups/.rss', 'US', 'en'),
  ('GitHub Trending', 'github_trending', 'https://github.com/trending', NULL, 'US', 'en'),
  ('Y Combinator News', 'ycombinator', 'https://www.ycombinator.com/blog', 'https://www.ycombinator.com/blog/rss/', 'US', 'en'),
  ('Reuters Business', 'rss', 'https://reuters.com/business', 'https://feeds.reuters.com/reuters/businessNews', 'US', 'en'),
  ('Bloomberg Technology', 'rss', 'https://bloomberg.com/technology', 'https://feeds.bloomberg.com/technology/news.rss', 'US', 'en'),
  ('Forbes Entrepreneurs', 'rss', 'https://forbes.com/entrepreneurs', 'https://www.forbes.com/feeds/entrepreneurs/index.xml', 'US', 'en');

-- ============================================================
-- UPDATED AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS (Row Level Security) - enable for production
-- ============================================================

ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;

-- Allow users to manage only their own saved opportunities
CREATE POLICY "saved_opportunities_user_policy" ON saved_opportunities
  FOR ALL USING (auth.uid()::text = user_id::text);
