-- ============================================================
-- RPC FUNCTIONS for dashboard stats
-- ============================================================

CREATE OR REPLACE FUNCTION count_by_type()
RETURNS TABLE(type TEXT, count BIGINT)
LANGUAGE SQL STABLE AS $$
  SELECT type::TEXT, COUNT(*) as count
  FROM opportunities
  GROUP BY type
  ORDER BY count DESC;
$$;

CREATE OR REPLACE FUNCTION count_by_country()
RETURNS TABLE(country TEXT, count BIGINT)
LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
  FROM opportunities
  WHERE country IS NOT NULL
  GROUP BY country
  ORDER BY count DESC
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION count_by_industry()
RETURNS TABLE(industry TEXT, count BIGINT)
LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(industry, 'Other') as industry, COUNT(*) as count
  FROM opportunities
  WHERE industry IS NOT NULL
  GROUP BY industry
  ORDER BY count DESC
  LIMIT 15;
$$;

CREATE OR REPLACE FUNCTION opportunities_timeline(days INTEGER DEFAULT 30)
RETURNS TABLE(date TEXT, count BIGINT)
LANGUAGE SQL STABLE AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('day', published_at), 'YYYY-MM-DD') as date,
    COUNT(*) as count
  FROM opportunities
  WHERE published_at >= NOW() - INTERVAL '1 day' * days
  GROUP BY DATE_TRUNC('day', published_at)
  ORDER BY DATE_TRUNC('day', published_at) ASC;
$$;
