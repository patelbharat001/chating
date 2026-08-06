# Prompt Library Design — chating.ai Hub

**Date:** 2026-08-06  
**Goal:** Build a serverless Prompt Library section for chating.ai hub — aggregate prompts from GitHub and OpenAI, provide search/browse interface, and monetize later based on usage data.

---

## Overview

**What:** Prompt Library is a standalone discovery platform within chating.ai where users can search, browse, and copy AI prompts from curated sources (GitHub, OpenAI Cookbook).

**Why:** 
- Attract AI/LLM developers and content creators to chating.ai ecosystem
- Establish configuration-driven system for easy source integration
- Revenue potential: monitor usage, monetize strategically later (API access, premium features)
- Serverless MVP: launch in 1-2 weeks with Supabase

**Target Users:** AI/LLM developers, content creators, prompt engineers

---

## Architecture

### System Diagram
```
GitHub + OpenAI Cookbook
         ↓
  [Supabase Edge Function]
    (Aggregation Worker)
         ↓
  [Supabase PostgreSQL DB]
    (prompts + categories)
         ↓
  [Supabase REST API]
         ↓
[Frontend - GitHub Pages]
  (Search + Browse UI)
         ↓
[chating.ai Hub]
  (Navigation to Prompt Library)
```

### Tech Stack
- **Aggregation:** Supabase Edge Functions (scheduled via pg_cron)
- **Database:** Supabase PostgreSQL with full-text search
- **API:** Supabase REST API + custom edge functions
- **Frontend:** Static HTML/CSS/JS (GitHub Pages)
- **Deployment:** GitHub Pages for static content, Supabase for backend
- **Cost:** $0 (free tier covers everything for MVP)

---

## Database Schema

### Categories Table
Configuration-driven approach — each category controls its own sources.

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,        -- 'Writing', 'Coding', 'Analysis', etc.
  description TEXT,                  -- Brief description of category
  icon TEXT,                          -- Emoji or icon name (e.g., '✍️', '💻')
  prompt_count INT DEFAULT 0,         -- Denormalized for quick display
  sources JSONB,                      -- Source configuration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Example sources JSONB:**
```json
{
  "github": {
    "enabled": true,
    "keywords": ["blog-prompt", "writing-prompt"],
    "min_stars": 10,
    "max_results": 50
  },
  "openai": {
    "enabled": true,
    "path": "examples/writing"
  },
  "huggingface": {
    "enabled": false
  }
}
```

### Prompts Table
Stores aggregated prompts with metadata and source attribution.

```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,               -- Prompt title
  description TEXT,                  -- Brief description
  content TEXT NOT NULL,              -- Actual prompt text
  source TEXT NOT NULL,               -- 'github' | 'openai' | 'huggingface'
  source_url TEXT,                    -- Link back to original source
  category_id UUID NOT NULL REFERENCES categories(id),
  author TEXT,                        -- Original author/creator
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  view_count INT DEFAULT 0            -- Track popularity
);

-- Full-text search index
CREATE INDEX idx_prompts_fts ON prompts 
  USING GIN (to_tsvector('english', title || ' ' || description || ' ' || content));

-- Indexes for common queries
CREATE INDEX idx_prompts_category ON prompts(category_id);
CREATE INDEX idx_prompts_source ON prompts(source);
```

---

## API Design

### Search Endpoint
```
GET /api/prompts/search
  ?q=<query string>
  &category_id=<uuid optional>
  &limit=20
  &offset=0
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "Blog Post Outline Generator",
      "description": "Generate a structured outline for blog posts",
      "content": "You are a professional blog writer assistant...",
      "source": "github",
      "source_url": "https://github.com/user/prompts/blob/main/blog-outline.md",
      "category": "Writing",
      "author": "john-doe",
      "created_at": "2026-08-01T10:00:00Z"
    },
    ...
  ],
  "total": 245,
  "categories": [
    { "id": "uuid", "name": "Writing", "count": 45 },
    { "id": "uuid", "name": "Coding", "count": 78 },
    { "id": "uuid", "name": "Analysis", "count": 32 }
  ]
}
```

### Browse Categories Endpoint
```
GET /api/categories

Response:
[
  {
    "id": "uuid",
    "name": "Writing",
    "icon": "✍️",
    "description": "Blog posts, emails, social media content",
    "prompt_count": 45
  },
  {
    "id": "uuid",
    "name": "Coding",
    "icon": "💻",
    "description": "Code generation, debugging, documentation",
    "prompt_count": 78
  },
  ...
]
```

### Get Prompt Details
```
GET /api/prompts/:id

Response:
{
  "id": "uuid",
  "title": "Blog Post Outline Generator",
  "description": "Generate a structured outline for blog posts",
  "content": "You are a professional blog writer assistant...",
  "source": "github",
  "source_url": "https://github.com/user/prompts/blob/main/blog-outline.md",
  "category": "Writing",
  "author": "john-doe",
  "created_at": "2026-08-01T10:00:00Z",
  "view_count": 156
}
```

---

## Frontend UI

### Layout
```
┌─────────────────────────────────────────┐
│ [Logo] Prompt Library   [← Back to Hub]  │
├─────────────────────────────────────────┤
│  Search box: "Search prompts..."         │
│  [Search Button]                        │
└─────────────────────────────────────────┘

┌──────────────┬──────────────────────────┐
│ Categories   │ Results                  │
│ (Sidebar)    │ (Main Content)           │
│              │                          │
│ ✍️ Writing   │ 1. Blog Post Outline    │
│   (45)       │    Generate a structured │
│              │    outline for blogs     │
│ 💻 Coding    │    [Copy Prompt]         │
│   (78)       │                          │
│              │ 2. API Documentation    │
│ 📊 Analysis  │    Write API docs...     │
│   (32)       │    [Copy Prompt]         │
│              │                          │
│ [Show All]   │ [Load More]              │
└──────────────┴──────────────────────────┘
```

### Key Features
- **Prominent search box:** Dark theme, gradient accent (matching chating.ai design)
- **Category sidebar:** Shows all categories with prompt counts, clickable to filter
- **Result cards:** Title, description, source attribution, copy button
- **Copy to clipboard:** One-click to copy full prompt text
- **Responsive:** Sidebar collapses on mobile, full-width results
- **Loading states:** Show spinner while fetching results
- **Mobile-first:** Optimized for mobile, scales up to desktop

### Design System (Reuse from chating.ai)
- **Dark theme:** Background #0f1117, panels #171a23
- **Accents:** Gradient blue-purple (#5b8cff to #7c5bff)
- **Typography:** 'Segoe UI', Roboto, sans-serif
- **Spacing:** 10-14px border radius, consistent padding
- **Icons:** Emoji-based category icons

---

## Aggregation System

### Edge Function: Aggregate Prompts
Scheduled to run hourly via Supabase pg_cron.

```typescript
// supabase/functions/aggregate-prompts/index.ts

export async function aggregatePrompts() {
  const categories = await fetchAllCategories();
  let totalAggregated = 0;
  let errors: string[] = [];

  for (const category of categories) {
    try {
      // GitHub aggregation
      if (category.sources.github.enabled) {
        const prompts = await fetchGitHubPrompts(
          category.sources.github.keywords,
          category.sources.github.min_stars,
          category.sources.github.max_results
        );
        await upsertPrompts(prompts, category.id, 'github');
        totalAggregated += prompts.length;
      }

      // OpenAI Cookbook aggregation
      if (category.sources.openai.enabled) {
        const prompts = await fetchOpenAIPrompts(
          category.sources.openai.path
        );
        await upsertPrompts(prompts, category.id, 'openai');
        totalAggregated += prompts.length;
      }

      // Future: HuggingFace, custom sources, etc.
    } catch (error) {
      errors.push(`Error aggregating ${category.name}: ${error.message}`);
    }
  }

  // Update category prompt counts
  await updateCategoryCounts();

  return {
    status: 'completed',
    total_aggregated: totalAggregated,
    errors: errors.length > 0 ? errors : null
  };
}
```

### Aggregation Flow
1. **Read category config** from database
2. **Fetch from enabled sources:**
   - GitHub: Search repos by keywords, parse README/files
   - OpenAI: Fetch from public cookbook repo
3. **Parse & clean:** Extract title, description, full prompt text
4. **Categorize:** Assign to category based on source configuration
5. **Upsert to DB:** Insert new prompts, update existing (avoid duplicates)
6. **Update counts:** Increment category `prompt_count`
7. **Log & alert:** Record completion, alert on failures

### Error Handling
- **Retry logic:** Exponential backoff for failed API calls (3 retries max)
- **Logging:** All aggregation events logged to Supabase logs
- **Alerts:** If no prompts aggregated in 24h, log warning
- **Graceful degradation:** If one source fails, continue with others

### Duplicate Prevention
- **Content hash:** Hash prompt text to detect duplicates across sources
- **Upsert strategy:** INSERT ON CONFLICT for source_url unique constraint

---

## Deployment & Scaling

### Hosting
- **Frontend:** GitHub Pages (static HTML/CSS/JS)
- **Backend:** Supabase (Edge Functions + PostgreSQL)
- **Domain:** Under chating.ai hub (e.g., chating.ai/prompt-library)

### Infrastructure
- **Edge Functions:** Scheduled via Supabase (pg_cron extension)
- **Database:** Supabase PostgreSQL with full-text search indexes
- **API:** Supabase REST endpoints (auto-generated)
- **DNS:** Points to GitHub Pages CNAME

### Cost (Free Tier v1)
- Supabase: $0 (free tier includes 500MB DB, 2GB realtime/month)
- GitHub Pages: $0
- Domain: Existing chating.ai domain
- **Total: $0**

### Scaling Path
- **v1 (MVP):** Up to ~5,000 prompts (free tier comfortable)
- **v2 (Growth):** 5,000-10,000 prompts (add Supabase Pro $25/month)
- **v3 (Scale):** 10,000+ prompts (consider caching, CDN, read replicas)

### Performance
- **Search response:** <200ms (full-text index on PostgreSQL)
- **Frontend load:** <1s (static HTML, API calls in parallel)
- **Aggregation:** ~2-5min per run (depends on source size)

---

## Timeline (1-2 Weeks)

### Week 1 — Foundation
- **Day 1-2:** Database schema setup + Supabase configuration
- **Day 3-4:** Edge Function for GitHub/OpenAI aggregation
- **Day 5:** API endpoints (search, categories) + basic testing

### Week 2 — Frontend & Launch
- **Day 1-2:** Frontend UI (search, browse, copy functionality)
- **Day 3:** Deploy to GitHub Pages + connect to Supabase API
- **Day 4:** Integration into chating.ai hub navigation
- **Day 5:** Testing across devices, bug fixes, launch

---

## Success Criteria

✅ **Technical:**
- Search responds in <200ms
- Aggregation runs daily without errors
- API handles 100+ concurrent requests
- Frontend loads in <1s
- Full-text search works across title + description + content

✅ **User Experience:**
- Users can find prompts by keyword in <10 seconds
- Category filtering works smoothly
- Copy-to-clipboard is one-click
- Responsive on mobile, tablet, desktop
- Attribution to original source visible

✅ **Business:**
- Drives users to chating.ai ecosystem
- Collects usage data to inform monetization
- Extensible architecture for new sources
- Easy to add Content Suite integration later

---

## Future Considerations

1. **Content Creation Suite:** Integrate prompts into content creator workflow
2. **Prompt Versioning:** Track prompt changes over time
3. **User Collections:** Authenticated users can save favorites
4. **Community Features:** Ratings, reviews, discussions
5. **Monetization:** Premium API tier, advanced filters, offline sync
6. **More Sources:** HuggingFace, community submissions, custom integrations

---

## Success Metrics to Track

Once launched, measure:
- Daily active users (unique searches)
- Most searched keywords
- Category popularity
- Most copied prompts
- Average time in app
- Bounce rate
- Conversion to chat (if linked)

Use these metrics to inform Content Suite design and future monetization strategy.
