-- Categories table (configuration-driven)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  prompt_count INT DEFAULT 0,
  sources JSONB DEFAULT '{
    "github": { "enabled": true, "keywords": [], "min_stars": 10, "max_results": 50 },
    "openai": { "enabled": true, "path": "" },
    "huggingface": { "enabled": false }
  }'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  author TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  view_count INT DEFAULT 0
);

-- Full-text search index
CREATE INDEX idx_prompts_fts ON prompts
  USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(content, '')));

-- Other indexes
CREATE INDEX idx_prompts_category ON prompts(category_id);
CREATE INDEX idx_prompts_source ON prompts(source);
CREATE INDEX idx_prompts_created_at ON prompts(created_at DESC);

-- Enable RLS (public read, no inserts/updates for now)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "prompts_public_read" ON prompts FOR SELECT USING (true);

-- Seed initial categories
INSERT INTO categories (name, description, icon, sources) VALUES
  ('Writing', 'Blog posts, emails, social media content', '✍️', '{"github": {"enabled": true, "keywords": ["blog-prompt", "writing-prompt", "email-prompt"], "min_stars": 5, "max_results": 50}, "openai": {"enabled": true, "path": "examples"}}'::jsonb),
  ('Coding', 'Code generation, debugging, documentation', '💻', '{"github": {"enabled": true, "keywords": ["code-prompt", "programming-prompt", "dev-prompt"], "min_stars": 10, "max_results": 50}, "openai": {"enabled": true, "path": "examples"}}'::jsonb),
  ('Analysis', 'Data analysis, research, insights', '📊', '{"github": {"enabled": true, "keywords": ["analysis-prompt", "research-prompt", "data-prompt"], "min_stars": 5, "max_results": 30}, "openai": {"enabled": true, "path": "examples"}}'::jsonb),
  ('Marketing', 'Copywriting, campaigns, content strategy', '📢', '{"github": {"enabled": true, "keywords": ["marketing-prompt", "copywriting-prompt", "seo-prompt"], "min_stars": 5, "max_results": 30}, "openai": {"enabled": true, "path": "examples"}}'::jsonb);
