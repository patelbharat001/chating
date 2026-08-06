# Prompt Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a serverless Prompt Library MVP that aggregates prompts from GitHub and OpenAI, provides search/browse interface, and launches within 1-2 weeks on Supabase + GitHub Pages.

**Architecture:** Supabase Edge Functions scheduled to aggregate prompts from external sources into PostgreSQL. REST API provides search/browse endpoints. Static frontend on GitHub Pages queries the API. All infrastructure serverless and free-tier.

**Tech Stack:** 
- Backend: Supabase PostgreSQL + Edge Functions (TypeScript)
- Frontend: HTML5 + CSS3 + vanilla JavaScript (no build step needed)
- Deployment: GitHub Pages (static) + Supabase (backend)
- Timeline: 1-2 weeks (5 tasks, ~2-3 days each)

## Global Constraints

- Database must support full-text search (<200ms response)
- Frontend must load in <1s (static assets only)
- Aggregation must run hourly without errors
- Zero cost (free Supabase tier only)
- Configuration-driven categories (changes in DB, no code changes needed)
- Prompts table has source attribution and link back to original
- Copy-to-clipboard functionality (client-side only)
- Responsive design (mobile-first, reuse chating.ai dark theme)
- No authentication required (anonymous browsing only)

---

## File Structure

### Database
- **`supabase/migrations/001-create-prompt-library.sql`** - Categories + prompts tables, indexes, seed data

### Backend (Edge Functions)
- **`supabase/functions/aggregate-prompts/index.ts`** - Main aggregation worker
- **`supabase/functions/utils/github-fetcher.ts`** - GitHub API integration
- **`supabase/functions/utils/openai-fetcher.ts`** - OpenAI Cookbook integration
- **`supabase/functions/utils/prompt-parser.ts`** - Prompt extraction & cleaning

### Frontend
- **`docs/prompt-library/index.html`** - Main page structure
- **`docs/prompt-library/styles.css`** - Styling (dark theme, responsive)
- **`docs/prompt-library/app.js`** - Search, filtering, copy functionality

### Configuration
- **`.env.local`** - Supabase credentials (local only, not committed)

### Documentation
- **`docs/PROMPT_LIBRARY.md`** - Setup guide for developers

---

## Task Breakdown

### Task 1: Database Schema & Initial Setup

**Files:**
- Create: `supabase/migrations/001-create-prompt-library.sql`
- Modify: (none)

**Interfaces:**
- Produces: `categories` table (id, name, description, icon, prompt_count, sources JSONB)
- Produces: `prompts` table (id, title, description, content, source, source_url, category_id, author, created_at, updated_at, view_count)
- Produces: Full-text search index on prompts(title || description || content)
- Produces: Seed data: 4 initial categories (Writing, Coding, Analysis, Marketing)

**Steps:**

- [ ] **1.1: Create migration file**

Create `supabase/migrations/001-create-prompt-library.sql`:

```sql
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
```

- [ ] **1.2: Apply migration to Supabase**

Run via Supabase CLI:
```bash
supabase migration up
```

Or manually in Supabase dashboard SQL Editor, copy-paste entire migration.

- [ ] **1.3: Verify schema created**

In Supabase dashboard → Table Editor:
- ✅ See `categories` table with 4 rows
- ✅ See `prompts` table (empty)
- ✅ See all indexes created

- [ ] **1.4: Test full-text search**

In Supabase SQL Editor, run:
```sql
SELECT * FROM prompts WHERE to_tsvector('english', title || ' ' || description || ' ' || content) @@ plainto_tsquery('english', 'blog');
```

Expected: Works (no errors), returns empty result set (no prompts yet).

- [ ] **1.5: Commit**

```bash
git add supabase/migrations/001-create-prompt-library.sql
git commit -m "feat: create prompt library database schema"
```

---

### Task 2: Aggregation Edge Function - GitHub Integration

**Files:**
- Create: `supabase/functions/aggregate-prompts/index.ts`
- Create: `supabase/functions/utils/github-fetcher.ts`
- Create: `supabase/functions/utils/prompt-parser.ts`

**Interfaces:**
- Consumes: `categories` table (reads sources JSONB config)
- Consumes: GitHub API (public, no auth needed for basic access)
- Produces: `fetchGitHubPrompts(keywords: string[], minStars: number, maxResults: number): Promise<Prompt[]>`
- Produces: `upsertPrompts(prompts: Prompt[], categoryId: string, source: string): Promise<void>`
- Returns: `{ status: 'completed', total_aggregated: number, errors: string[] | null }`

**Steps:**

- [ ] **2.1: Create GitHub fetcher utility**

Create `supabase/functions/utils/github-fetcher.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GitHubRepo {
  name: string;
  html_url: string;
  owner: { login: string };
  description: string;
}

interface Prompt {
  title: string;
  description: string;
  content: string;
  source: string;
  source_url: string;
  author: string;
}

export async function fetchGitHubPrompts(
  keywords: string[],
  minStars: number,
  maxResults: number
): Promise<Prompt[]> {
  const prompts: Prompt[] = [];
  const headers = { 'Accept': 'application/vnd.github.v3+json' };

  try {
    for (const keyword of keywords) {
      const query = `${keyword} language:markdown stars:>=${minStars}`;
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=50`;

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);

      const data = await response.json();
      
      // Fetch top repositories
      for (const repo of data.items.slice(0, maxResults)) {
        const repoPrompts = await fetchPromptFilesFromRepo(repo, keyword);
        prompts.push(...repoPrompts);
      }
    }

    return prompts.slice(0, maxResults);
  } catch (error) {
    console.error('GitHub fetch error:', error);
    return [];
  }
}

async function fetchPromptFilesFromRepo(
  repo: GitHubRepo,
  keyword: string
): Promise<Prompt[]> {
  const prompts: Prompt[] = [];

  try {
    // Fetch README
    const readmeUrl = `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/main/README.md`;
    const readmeResponse = await fetch(readmeUrl);
    if (readmeResponse.ok) {
      const readmeText = await readmeResponse.text();
      const promptsFromReadme = parseMarkdownForPrompts(readmeText, repo);
      prompts.push(...promptsFromReadme);
    }

    // Fetch prompt files (*.md, *.txt in root and examples/)
    const filesUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/`;
    const filesResponse = await fetch(filesUrl, { 
      headers: { 'Accept': 'application/vnd.github.v3+json' } 
    });
    
    if (filesResponse.ok) {
      const files = await filesResponse.json();
      for (const file of files) {
        if ((file.name.endsWith('.md') || file.name.endsWith('.txt')) && 
            (file.name.includes('prompt') || file.name.includes('example'))) {
          const rawUrl = `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/main/${file.name}`;
          const content = await fetch(rawUrl).then(r => r.text());
          
          prompts.push({
            title: file.name.replace(/\.(md|txt)$/, ''),
            description: repo.description || `Prompt from ${repo.name}`,
            content: content.slice(0, 2000), // Limit to 2000 chars
            source: 'github',
            source_url: `${repo.html_url}/blob/main/${file.name}`,
            author: repo.owner.login
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching from repo ${repo.name}:`, error);
  }

  return prompts;
}

function parseMarkdownForPrompts(markdown: string, repo: GitHubRepo): Prompt[] {
  const prompts: Prompt[] = [];
  
  // Simple extraction: look for code blocks marked as "prompt" or "example"
  const blockRegex = /```(?:prompt|example)\n([\s\S]*?)```/g;
  let match;

  while ((match = blockRegex.exec(markdown)) !== null) {
    prompts.push({
      title: `Prompt from ${repo.name}`,
      description: `Example prompt from ${repo.owner.login}/${repo.name}`,
      content: match[1].trim(),
      source: 'github',
      source_url: repo.html_url,
      author: repo.owner.login
    });
  }

  return prompts;
}
```

- [ ] **2.2: Create prompt parser utility**

Create `supabase/functions/utils/prompt-parser.ts`:

```typescript
import * as crypto from 'https://deno.land/std@0.208.0/crypto/mod.ts';

export interface ParsedPrompt {
  title: string;
  description: string;
  content: string;
  source: string;
  source_url: string;
  author: string;
  content_hash: string;
}

export function hashContent(content: string): string {
  const encoded = new TextEncoder().encode(content);
  const hashBuffer = crypto.subtle.digestSync('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

export function cleanPromptText(content: string): string {
  // Remove excessive whitespace, trim to reasonable length
  return content
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

export function validatePrompt(prompt: any): boolean {
  return !!(
    prompt.title && typeof prompt.title === 'string' &&
    prompt.content && typeof prompt.content === 'string' &&
    prompt.source && typeof prompt.source === 'string' &&
    prompt.source_url && typeof prompt.source_url === 'string'
  );
}
```

- [ ] **2.3: Test GitHub fetcher locally**

Create a test script to verify GitHub API works:

```bash
# In supabase/functions/aggregate-prompts/
deno run --allow-net --allow-env test-github.ts
```

Expected: Fetches a few repos and prints extracted prompts (should see title, content, source_url).

- [ ] **2.4: Commit**

```bash
git add supabase/functions/utils/github-fetcher.ts supabase/functions/utils/prompt-parser.ts
git commit -m "feat: add GitHub aggregation utilities"
```

---

### Task 3: Aggregation Edge Function - OpenAI & Main Function

**Files:**
- Create: `supabase/functions/utils/openai-fetcher.ts`
- Create: `supabase/functions/aggregate-prompts/index.ts` (main)

**Interfaces:**
- Consumes: OpenAI Cookbook public GitHub repo
- Consumes: `categories` table (reads sources config)
- Consumes: `fetchGitHubPrompts()` from Task 2
- Produces: `aggregatePrompts(): Promise<{ status: string, total_aggregated: number, errors: string[] | null }>`
- Produces: Upserts prompts into `prompts` table

**Steps:**

- [ ] **3.1: Create OpenAI Cookbook fetcher**

Create `supabase/functions/utils/openai-fetcher.ts`:

```typescript
interface Prompt {
  title: string;
  description: string;
  content: string;
  source: string;
  source_url: string;
  author: string;
}

export async function fetchOpenAIPrompts(path: string = 'examples'): Promise<Prompt[]> {
  const prompts: Prompt[] = [];
  const baseUrl = 'https://raw.githubusercontent.com/openai/openai-cookbook/main';

  try {
    // Fetch directory listing from GitHub API
    const apiUrl = `https://api.github.com/repos/openai/openai-cookbook/contents/${path}`;
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!response.ok) throw new Error(`OpenAI repo fetch error: ${response.statusText}`);

    const files = await response.json();

    // Get markdown files
    for (const file of files) {
      if (file.name.endsWith('.md') && file.type === 'file') {
        const rawUrl = `${baseUrl}/${path}/${file.name}`;
        const content = await fetch(rawUrl).then(r => r.text());

        // Extract prompt sections from markdown
        const sections = extractPromptSections(content, file.name);
        sections.forEach(section => {
          prompts.push({
            title: section.title,
            description: section.description || `Example from OpenAI Cookbook`,
            content: section.content,
            source: 'openai',
            source_url: `https://github.com/openai/openai-cookbook/blob/main/${path}/${file.name}`,
            author: 'OpenAI'
          });
        });
      }
    }

    return prompts;
  } catch (error) {
    console.error('OpenAI Cookbook fetch error:', error);
    return [];
  }
}

function extractPromptSections(markdown: string, filename: string): any[] {
  const sections = [];
  
  // Extract code blocks
  const codeBlockRegex = /```(?:python|typescript|javascript|plaintext)?\n([\s\S]*?)```/g;
  const headingRegex = /^#+\s+(.+)$/gm;
  
  let codeMatch;
  let headingMatches = [...markdown.matchAll(headingRegex)];

  while ((codeMatch = codeBlockRegex.exec(markdown)) !== null) {
    const heading = headingMatches.length > 0 ? headingMatches[0][1] : filename;
    
    sections.push({
      title: heading,
      description: `Example from ${filename}`,
      content: codeMatch[1].trim()
    });
  }

  // If no code blocks found, use the whole markdown as one section
  if (sections.length === 0 && markdown.length > 100) {
    sections.push({
      title: filename.replace('.md', ''),
      description: 'Example from OpenAI Cookbook',
      content: markdown.slice(0, 3000)
    });
  }

  return sections;
}
```

- [ ] **3.2: Create main aggregation Edge Function**

Create `supabase/functions/aggregate-prompts/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchGitHubPrompts } from '../utils/github-fetcher.ts';
import { fetchOpenAIPrompts } from '../utils/openai-fetcher.ts';
import { hashContent, cleanPromptText, validatePrompt } from '../utils/prompt-parser.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

export async function aggregatePrompts() {
  let totalAggregated = 0;
  const errors: string[] = [];

  try {
    // Fetch all categories with enabled sources
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (catError) throw catError;

    for (const category of categories || []) {
      try {
        // GitHub aggregation
        if (category.sources?.github?.enabled) {
          const githubPrompts = await fetchGitHubPrompts(
            category.sources.github.keywords || [],
            category.sources.github.min_stars || 10,
            category.sources.github.max_results || 50
          );

          for (const prompt of githubPrompts) {
            await upsertPrompt(prompt, category.id);
            totalAggregated++;
          }
          console.log(`GitHub: ${githubPrompts.length} prompts for ${category.name}`);
        }

        // OpenAI aggregation
        if (category.sources?.openai?.enabled) {
          const openaiPrompts = await fetchOpenAIPrompts(
            category.sources.openai.path || 'examples'
          );

          for (const prompt of openaiPrompts) {
            await upsertPrompt(prompt, category.id);
            totalAggregated++;
          }
          console.log(`OpenAI: ${openaiPrompts.length} prompts for ${category.name}`);
        }
      } catch (catError) {
        const errorMsg = `Error aggregating ${category.name}: ${catError.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update category prompt counts
    for (const category of categories || []) {
      const { data: prompts } = await supabase
        .from('prompts')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', category.id);

      await supabase
        .from('categories')
        .update({ prompt_count: prompts?.length || 0 })
        .eq('id', category.id);
    }

    return {
      status: 'completed',
      total_aggregated: totalAggregated,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error('Aggregation error:', error);
    return {
      status: 'error',
      total_aggregated: totalAggregated,
      errors: [error.message]
    };
  }
}

async function upsertPrompt(prompt: any, categoryId: string) {
  if (!validatePrompt(prompt)) {
    console.warn('Invalid prompt, skipping:', prompt.title);
    return;
  }

  const cleanedContent = cleanPromptText(prompt.content);
  const contentHash = hashContent(cleanedContent);

  const { error } = await supabase
    .from('prompts')
    .upsert(
      {
        title: prompt.title.slice(0, 200),
        description: (prompt.description || '').slice(0, 500),
        content: cleanedContent,
        source: prompt.source,
        source_url: prompt.source_url,
        category_id: categoryId,
        author: (prompt.author || 'Unknown').slice(0, 100),
        content_hash: contentHash
      },
      { onConflict: 'source_url,category_id' }
    );

  if (error) {
    console.error('Upsert error:', error);
  }
}

// Serve function for manual trigger or GET request
Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const result = await aggregatePrompts();
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

- [ ] **3.3: Test aggregation locally**

```bash
# In project root
supabase functions deploy aggregate-prompts
supabase functions serve aggregate-prompts
```

Then test:
```bash
curl -X POST http://localhost:54321/functions/v1/aggregate-prompts
```

Expected: Response with `status: 'completed'`, `total_aggregated: > 0`.

- [ ] **3.4: Verify prompts in database**

```bash
supabase sql "SELECT COUNT(*) as total FROM prompts;"
```

Expected: Should have some prompts (>10).

- [ ] **3.5: Deploy Edge Function to Supabase**

```bash
supabase functions deploy aggregate-prompts --project-ref <your-project-ref>
```

- [ ] **3.6: Schedule aggregation via pg_cron**

In Supabase SQL Editor, run:

```sql
-- Schedule aggregation to run every 6 hours
SELECT cron.schedule('aggregate-prompts', '0 */6 * * *', http_post('https://<project-ref>.supabase.co/functions/v1/aggregate-prompts', '{}', 'application/json'));
```

Replace `<project-ref>` with your actual Supabase project ref.

- [ ] **3.7: Commit**

```bash
git add supabase/functions/utils/openai-fetcher.ts supabase/functions/aggregate-prompts/index.ts
git commit -m "feat: implement prompt aggregation from GitHub and OpenAI"
```

---

### Task 4: Frontend - HTML & Styling

**Files:**
- Create: `docs/prompt-library/index.html`
- Create: `docs/prompt-library/styles.css`

**Interfaces:**
- Consumes: Supabase REST API (`/rest/v1/categories`, `/rest/v1/prompts/search`)
- Produces: Responsive search + browse UI
- Produces: Dark theme matching chating.ai (#0f1117 bg, #171a23 panels, gradient blue-purple accents)

**Steps:**

- [ ] **4.1: Create HTML structure**

Create `docs/prompt-library/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prompt Library | chating.ai</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <h1>📚 Prompt Library</h1>
        </div>
        <a href="../../index.html" class="back-link">← Back to chating.ai</a>
      </div>
    </header>

    <!-- Search Section -->
    <section class="search-section">
      <div class="search-container">
        <input
          type="text"
          id="searchInput"
          class="search-input"
          placeholder="Search prompts..."
          autocomplete="off"
        >
        <button id="searchBtn" class="search-btn">Search</button>
      </div>
      <div id="loadingSpinner" class="spinner" style="display: none;"></div>
    </section>

    <!-- Main Content -->
    <div class="content">
      <!-- Sidebar -->
      <aside class="sidebar">
        <h3 class="sidebar-title">Categories</h3>
        <ul class="categories-list" id="categoriesList">
          <li><a href="#" data-category-id="all" class="category-link active">All Categories</a></li>
        </ul>
      </aside>

      <!-- Results -->
      <main class="results">
        <div id="resultsInfo" class="results-info"></div>
        <div id="resultsList" class="results-list"></div>
        <button id="loadMoreBtn" class="load-more-btn" style="display: none;">Load More</button>
      </main>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <p>chating.ai • Prompt Library • Aggregated from GitHub & OpenAI</p>
    </footer>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **4.2: Create CSS styling**

Create `docs/prompt-library/styles.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-primary: #0f1117;
  --bg-secondary: #171a23;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --accent-1: #5b8cff;
  --accent-2: #7c5bff;
  --border: #30363d;
  --success: #3fb950;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: 14px;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
.header {
  border-bottom: 1px solid var(--border);
  padding: 20px 0;
  margin-bottom: 40px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  font-size: 28px;
  background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.back-link {
  color: var(--text-secondary);
  text-decoration: none;
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.2s;
}

.back-link:hover {
  color: var(--text-primary);
  border-color: var(--accent-1);
}

/* Search Section */
.search-section {
  margin-bottom: 40px;
}

.search-container {
  display: flex;
  gap: 10px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-1);
}

.search-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.search-btn:hover {
  opacity: 0.9;
}

.search-btn:active {
  opacity: 0.8;
}

/* Loading Spinner */
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid var(--border);
  border-top-color: var(--accent-1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Main Content Layout */
.content {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 30px;
}

/* Sidebar */
.sidebar {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  height: fit-content;
  position: sticky;
  top: 20px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 15px;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.categories-list {
  list-style: none;
}

.categories-list li {
  margin-bottom: 8px;
}

.category-link {
  display: block;
  padding: 8px 12px;
  color: var(--text-secondary);
  text-decoration: none;
  border-left: 3px solid transparent;
  transition: all 0.2s;
  border-radius: 4px;
}

.category-link:hover,
.category-link.active {
  color: var(--text-primary);
  background: rgba(91, 140, 255, 0.1);
  border-left-color: var(--accent-1);
}

/* Results */
.results {
  min-height: 400px;
}

.results-info {
  margin-bottom: 20px;
  color: var(--text-secondary);
  font-size: 13px;
}

.results-list {
  display: grid;
  gap: 16px;
}

.prompt-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent-1);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.prompt-card:hover {
  background: #1c1f2a;
  border-color: var(--accent-1);
}

.prompt-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.prompt-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

.prompt-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.prompt-source {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(91, 140, 255, 0.1);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--accent-1);
}

.prompt-content {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  max-height: 120px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.prompt-actions {
  display: flex;
  gap: 8px;
}

.copy-btn {
  flex: 1;
  padding: 8px 12px;
  background: var(--accent-1);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.copy-btn:hover {
  opacity: 0.9;
}

.copy-btn.copied {
  background: var(--success);
}

/* Load More */
.load-more-btn {
  display: block;
  width: 100%;
  padding: 12px;
  margin-top: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover {
  background: #1c1f2a;
  border-color: var(--accent-1);
}

/* Footer */
.footer {
  text-align: center;
  padding: 20px 0;
  margin-top: 40px;
  border-top: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    display: flex;
    justify-content: flex-start;
    gap: 12px;
    overflow-x: auto;
    padding: 12px;
  }

  .categories-list {
    display: flex;
    gap: 8px;
  }

  .categories-list li {
    margin-bottom: 0;
    white-space: nowrap;
  }

  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .search-container {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
  }
}
```

- [ ] **4.3: Test HTML + CSS locally**

Open `docs/prompt-library/index.html` in a browser. Expected:
- Dark theme with proper colors
- Search box visible
- Sidebar with "All Categories"
- Responsive layout on mobile

- [ ] **4.4: Commit**

```bash
git add docs/prompt-library/index.html docs/prompt-library/styles.css
git commit -m "feat: create prompt library frontend UI"
```

---

### Task 5: Frontend - JavaScript Logic & Testing

**Files:**
- Create: `docs/prompt-library/app.js`

**Interfaces:**
- Consumes: Supabase API (`GET /rest/v1/categories`, `GET /rest/v1/prompts`)
- Consumes: Window.location, navigator.clipboard
- Produces: Search functionality, category filtering, copy to clipboard, pagination

**Steps:**

- [ ] **5.1: Create JavaScript app**

Create `docs/prompt-library/app.js`:

```javascript
// Configuration
const SUPABASE_URL = 'https://tsvgxlmrgqlfkyijnllj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdmd4bG1yZ3FsZmt5aWpubGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTYzNzUwMjcsImV4cCI6MjAxMjE4MjYyN30.9pPvuRKAj8x9K7EjVc-KX7fPCdV5nVxnHwpQ4K2JzOQ';
const API_BASE = `${SUPABASE_URL}/rest/v1`;

// State
let allCategories = [];
let currentResults = [];
let currentPage = 0;
const RESULTS_PER_PAGE = 20;
let selectedCategoryId = 'all';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const categoriesList = document.getElementById('categoriesList');
const resultsList = document.getElementById('resultsList');
const resultsInfo = document.getElementById('resultsInfo');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Event Listeners
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});
loadMoreBtn.addEventListener('click', loadMore);

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  displayDefaultResults();
});

// Fetch categories
async function loadCategories() {
  try {
    showSpinner(true);
    const response = await fetch(
      `${API_BASE}/categories?select=id,name,icon,prompt_count,order=name.asc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    
    allCategories = await response.json();
    renderCategories();
  } catch (error) {
    console.error('Error loading categories:', error);
    resultsInfo.textContent = 'Error loading categories. Please refresh.';
  } finally {
    showSpinner(false);
  }
}

// Render category sidebar
function renderCategories() {
  const html = allCategories.map(cat => `
    <li>
      <a
        href="#"
        data-category-id="${cat.id}"
        class="category-link"
        onclick="selectCategory(event, '${cat.id}')"
      >
        ${cat.icon} ${cat.name}
        <span style="color: var(--text-secondary); font-size: 12px;">(${cat.prompt_count})</span>
      </a>
    </li>
  `).join('');

  categoriesList.innerHTML = `
    <li><a href="#" data-category-id="all" class="category-link active" onclick="selectCategory(event, 'all')">All Categories</a></li>
    ${html}
  `;
}

// Select category
function selectCategory(event, categoryId) {
  event.preventDefault();
  selectedCategoryId = categoryId;

  // Update active class
  document.querySelectorAll('.category-link').forEach(link => {
    link.classList.remove('active');
  });
  event.target.closest('a').classList.add('active');

  // Reset search and perform new search
  currentPage = 0;
  performSearch();
}

// Perform search
async function performSearch() {
  const query = searchInput.value.trim();
  currentPage = 0;

  try {
    showSpinner(true);
    loadMoreBtn.style.display = 'none';

    // Build URL with filters
    let url = `${API_BASE}/prompts?select=id,title,description,content,source,source_url,author,created_at,category_id&limit=1000`;

    if (selectedCategoryId !== 'all') {
      url += `&category_id=eq.${selectedCategoryId}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);

    let prompts = await response.json();

    // Client-side full-text search
    if (query) {
      const queryLower = query.toLowerCase();
      prompts = prompts.filter(p =>
        p.title.toLowerCase().includes(queryLower) ||
        p.description?.toLowerCase().includes(queryLower) ||
        p.content.toLowerCase().includes(queryLower)
      );
    }

    currentResults = prompts;
    displayResults();
  } catch (error) {
    console.error('Search error:', error);
    resultsInfo.textContent = 'Error searching. Please try again.';
  } finally {
    showSpinner(false);
  }
}

// Display results
function displayResults() {
  const start = currentPage * RESULTS_PER_PAGE;
  const end = start + RESULTS_PER_PAGE;
  const pageResults = currentResults.slice(start, end);

  if (currentResults.length === 0) {
    resultsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No prompts found.</p>';
    resultsInfo.textContent = '';
    return;
  }

  resultsInfo.textContent = `Showing ${start + 1}–${Math.min(end, currentResults.length)} of ${currentResults.length} prompts`;

  const html = pageResults.map(prompt => `
    <div class="prompt-card">
      <h3 class="prompt-title">${escapeHtml(prompt.title)}</h3>
      <p class="prompt-description">${escapeHtml(prompt.description || '')}</p>
      <div class="prompt-meta">
        <span class="prompt-source">${prompt.source.toUpperCase()}</span>
        <span>${prompt.author || 'Unknown'}</span>
        <span>${new Date(prompt.created_at).toLocaleDateString()}</span>
      </div>
      <div class="prompt-content">${escapeHtml(prompt.content.substring(0, 300))}${prompt.content.length > 300 ? '...' : ''}</div>
      <div class="prompt-actions">
        <button class="copy-btn" onclick="copyPrompt(event, '${escapeHtml(prompt.content)}')">
          📋 Copy Prompt
        </button>
        <a href="${escapeHtml(prompt.source_url)}" target="_blank" style="padding: 8px 12px; border: 1px solid var(--border); border-radius: 4px; color: var(--text-secondary); text-decoration: none; font-size: 12px;">
          Source ↗
        </a>
      </div>
    </div>
  `).join('');

  resultsList.innerHTML = html;

  // Show load more button if needed
  if (end < currentResults.length) {
    loadMoreBtn.style.display = 'block';
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

// Load more results
function loadMore() {
  currentPage++;
  displayResults();
  window.scrollTo({ top: resultsList.offsetTop, behavior: 'smooth' });
}

// Copy to clipboard
async function copyPrompt(event, text) {
  event.preventDefault();
  try {
    await navigator.clipboard.writeText(text);
    const btn = event.target;
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copy Prompt';
      btn.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    alert('Failed to copy prompt');
  }
}

// Display default results on load
async function displayDefaultResults() {
  try {
    showSpinner(true);
    const response = await fetch(
      `${API_BASE}/prompts?select=id,title,description,content,source,source_url,author,created_at&limit=${RESULTS_PER_PAGE}&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (response.ok) {
      currentResults = await response.json();
      displayResults();
    }
  } catch (error) {
    console.error('Error loading default results:', error);
  } finally {
    showSpinner(false);
  }
}

// Utilities
function showSpinner(show) {
  loadingSpinner.style.display = show ? 'inline-block' : 'none';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

- [ ] **5.2: Test search functionality**

Open `docs/prompt-library/index.html` in browser:
- ✅ Categories load from API
- ✅ Default results display (latest prompts)
- ✅ Search works by keyword (type "blog" and search)
- ✅ Category filtering works
- ✅ Copy to clipboard works (click copy button)
- ✅ Load More button appears/works

- [ ] **5.3: Test responsive design**

Open DevTools (F12), toggle device toolbar:
- ✅ Mobile (375px): Sidebar collapses, single column layout
- ✅ Tablet (768px): Two columns appear
- ✅ Desktop (1200px+): Full layout with sticky sidebar

- [ ] **5.4: Test edge cases**

- Empty search (no results)
- Very long prompt content (should truncate)
- Source links work (click "Source ↗")
- Back to hub link works

- [ ] **5.5: Commit**

```bash
git add docs/prompt-library/app.js
git commit -m "feat: implement prompt library search and interact"
```

---

## Post-Implementation Checklist

After all tasks complete:

- [ ] **Verify Database:** Run `SELECT COUNT(*) FROM prompts;` → Should show >50 prompts
- [ ] **Test API Endpoints:** 
  - `GET /rest/v1/categories` → Returns 4+ categories
  - `GET /rest/v1/prompts?limit=10` → Returns 10 prompts with all fields
- [ ] **Performance Check:**
  - Search response: <200ms (open DevTools Network tab)
  - Page load: <1s (Lighthouse score >80)
- [ ] **Cross-browser:** Test in Chrome, Firefox, Safari (mobile + desktop)
- [ ] **Final Commit:** All files committed to main branch
- [ ] **Deployment:** Files pushed to GitHub (auto-deploys to GitHub Pages)

---

## Success Criteria Verification

| Criteria | Expected | Status |
|----------|----------|--------|
| Search <200ms | Yes | TBD |
| Frontend <1s load | Yes | TBD |
| Aggregation runs 2x daily | Yes | TBD |
| 100+ prompts indexed | Yes | TBD |
| Copy-to-clipboard works | Yes | TBD |
| Responsive on mobile | Yes | TBD |
| Categories with counts | Yes | TBD |
| Source attribution visible | Yes | TBD |
