-- Add unique constraint for upsert operations
-- Ensures no duplicate prompts from the same source_url in the same category
ALTER TABLE prompts ADD CONSTRAINT unique_source_url_category
  UNIQUE (source_url, category_id);
