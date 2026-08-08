# Prompt Library MVP — Deployment Guide

**Status:** Frontend code ready ✅ | Backend code ready ✅ | Deployment pending ⏳

This guide walks you through deploying the Prompt Library MVP to production.

---

## **PHASE 1: Supabase Configuration**

### Step 1.1: Apply Database Migrations

**Goal:** Create the database schema (tables, indexes, seed data)

1. Go to [Supabase Dashboard](https://console.supabase.com)
2. Select your project: `chating` (or your Supabase project)
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New query**
5. Copy and paste the entire contents of:
   - File: `supabase/migrations/001-create-prompt-library.sql`
   - (This file is in your GitHub repo)
6. Click **Run**
7. Verify success: You should see "Query executed successfully"
8. Repeat for migration 2:
   - File: `supabase/migrations/002-add-prompts-unique-constraint.sql`
   - Click **Run** again

**Verification:**
- Go to **Table Editor** (left sidebar)
- You should see:
  - `categories` table with 4 rows (Writing, Coding, Analysis, Marketing)
  - `prompts` table (empty, will populate after aggregation)

---

### Step 1.2: Deploy Edge Functions

**Goal:** Deploy the aggregation functions to Supabase

**Prerequisites:**
- Supabase CLI installed: `npm install -g supabase`
- GitHub repo cloned locally

**Steps:**

1. Open terminal in your local repo root:
   ```bash
   cd D:\Projects\chating-ai\chating
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```
   - Browser will open, authenticate with your Supabase account

3. Link to your project:
   ```bash
   supabase link --project-ref tsvgxlmrgqlfkyijnllj
   ```
   - Use your actual Supabase project ref (find in Settings → General)

4. Deploy the Edge Function:
   ```bash
   supabase functions deploy aggregate-prompts
   ```
   - Wait for completion message

**Verification:**
- Go to Supabase Dashboard → **Functions** (left sidebar)
- You should see `aggregate-prompts` function listed with status "Active"

---

### Step 1.3: Test Edge Function (Manual Trigger)

**Goal:** Run aggregation manually to verify it works

1. In Supabase Dashboard, click on **Functions** → **aggregate-prompts**
2. Click **Invoke** button
3. Wait for response (should take 30-60 seconds)
4. You should see response:
   ```json
   {
     "status": "completed",
     "total_aggregated": <number>,
     "errors": null
   }
   ```

**If you get errors:**
- Check **Logs** tab in the function details
- Most common: missing environment variables or API auth issues
- The function uses public GitHub APIs, should work without auth

---

### Step 1.4: Schedule Hourly Aggregation

**Goal:** Set up automated aggregation to run every 6 hours

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Paste this SQL:
   ```sql
   SELECT cron.schedule(
     'aggregate-prompts-6h',
     '0 */6 * * *',
     http_post(
       'https://tsvgxlmrgqlfkyijnllj.supabase.co/functions/v1/aggregate-prompts',
       '{}',
       'application/json'
     )
   );
   ```
   **Replace** `tsvgxlmrgqlfkyijnllj` with your project ref

4. Click **Run**
5. You should see: Query executed successfully

**Verification:**
- Go to **SQL Editor** → run this query:
  ```sql
  SELECT * FROM cron.job WHERE jobname = 'aggregate-prompts-6h';
  ```
- You should see one row with your job scheduled

---

### Step 1.5: Verify Data in Database

**Goal:** Check that prompts were aggregated and saved

1. Go to Supabase Dashboard → **Table Editor**
2. Click on **prompts** table
3. You should see rows of prompts from GitHub and OpenAI sources
4. Check counts:
   ```sql
   SELECT COUNT(*) as total, source, COUNT(DISTINCT category_id) as categories
   FROM prompts
   GROUP BY source;
   ```
5. Should show something like:
   - github: 45 prompts, 4 categories
   - openai: 32 prompts, 4 categories

---

## **PHASE 2: Frontend Deployment**

### Step 2.1: Deploy to GitHub Pages

**Goal:** Make frontend publicly accessible at your domain

**Prerequisites:**
- GitHub repo with latest code pushed to `main`
- GitHub Pages enabled for your repo

**Steps:**

1. Go to your GitHub repo: https://github.com/patelbharat001/chating
2. Click **Settings** (top right)
3. Click **Pages** (left sidebar)
4. Under "Build and deployment":
   - **Source:** Deploy from a branch
   - **Branch:** main
   - **Folder:** / (root) or /docs (depending on your setup)
5. Click **Save**
6. GitHub will deploy automatically (takes 1-2 minutes)
7. You'll see a green checkmark when done
8. **Your site URL:** Will be shown at the top (e.g., `https://patelbharat001.github.io/chating/`)

**Note:** If using a custom domain (chating.ai):
- Update DNS records to point to GitHub Pages
- Configure in Settings → Pages → Custom domain

---

### Step 2.2: Access Your Prompt Library

**URL:** `https://patelbharat001.github.io/chating/prompt-library/`

Or if using custom domain: `https://chating.ai/prompt-library/`

**Test functionality:**
1. ✅ Categories load in sidebar
2. ✅ Search works (try "blog", "code")
3. ✅ Copy button works
4. ✅ Load More works
5. ✅ Category filtering works

---

## **PHASE 3: Integration with chating.ai Hub**

### Step 3.1: Add Navigation Link to Hub

**Goal:** Make Prompt Library discoverable from chating.ai homepage

**Option A: Update index.html** (if hub exists)
```html
<a href="./prompt-library/" class="hub-tile">
  📚 Prompt Library
  <p>Search AI prompts from GitHub & OpenAI</p>
</a>
```

**Option B: Create hub landing page**
- You previously designed a "collage" hub page
- Add Prompt Library as one of the tiles
- Link: `./prompt-library/`

---

## **PHASE 4: Verification & Testing**

### Checklist Before Going Live

- [ ] **Database:**
  - [ ] Migrations applied (categories + prompts tables exist)
  - [ ] Unique constraint on (source_url, category_id)
  - [ ] Seed data visible (4 categories in categories table)

- [ ] **Backend:**
  - [ ] Edge Function deployed (shows "Active" in Functions)
  - [ ] Manual aggregation test passed (got >0 prompts)
  - [ ] Scheduled job created (visible in cron.job query)

- [ ] **Frontend:**
  - [ ] Deployed to GitHub Pages (accessible at URL)
  - [ ] Categories load from API ✅
  - [ ] Search works (try keyword search) ✅
  - [ ] Copy button works ✅
  - [ ] Pagination works (load more button) ✅
  - [ ] Responsive design works (test mobile) ✅
  - [ ] No console errors (DevTools → Console) ✅

- [ ] **Integration:**
  - [ ] Hub navigation link added (if using hub)
  - [ ] Link points to correct URL ✅
  - [ ] Link is discoverable from main chating.ai page ✅

---

## **PHASE 5: Going Live**

### Deployment Sequence

**If everything above checks out:**

1. ✅ Frontend already deployed to GitHub Pages
2. ✅ Backend deployed and tested
3. ✅ Database configured and populated
4. ✅ Scheduling active

**You're live!** Users can now:
- Visit `chating.ai/prompt-library/` (or your GitHub Pages URL)
- Search prompts from GitHub and OpenAI
- Copy prompts to clipboard
- Browse by category
- New prompts automatically added every 6 hours

---

## **TROUBLESHOOTING**

### Issue: Edge Function Returns 401 Unauthorized

**Cause:** Missing environment variables or API auth issues

**Fix:**
1. Check function logs in Supabase dashboard
2. Verify the function code has correct API endpoints
3. Restart the aggregation

### Issue: No Prompts Showing in Database

**Cause:** Aggregation hasn't run yet or failed

**Steps to fix:**
1. Run manual aggregation (Step 1.3)
2. Check function logs for errors
3. Verify GitHub API is accessible from Supabase edge functions

### Issue: Frontend Shows "Error Loading Categories"

**Cause:** API credentials issue or CORS problem

**Fix:**
1. Check browser DevTools → Network tab
2. Look for failed API calls
3. Verify Supabase URL and key in app.js match your project
4. Confirm categories table has data (check Supabase dashboard)

### Issue: Copy Button Doesn't Work

**Cause:** Browser security restriction

**Fix:**
1. Some browsers require HTTPS for clipboard API
2. If using GitHub Pages custom domain, ensure HTTPS is enabled
3. Test in a different browser

---

## **NEXT STEPS AFTER LAUNCH**

### Monitoring
- Check aggregation logs weekly (Supabase → Functions → aggregate-prompts → Logs)
- Monitor prompt count (SQL query in Phase 1.5)

### Monetization (Future)
- Track user analytics (searches, copy counts)
- Plan premium features (API access, advanced filters)
- Consider content creation suite integration

### Expansion
- Add more sources (HuggingFace, community submissions)
- Implement user favorites/collections
- Add ratings and reviews

---

## **SUPPORT**

**Questions?**
- Check the implementation plan: `docs/superpowers/plans/2026-08-06-prompt-library-implementation.md`
- Check the design spec: `docs/superpowers/specs/2026-08-06-prompt-library-design.md`
- Review git commits for what changed: `git log --oneline | head -10`

---

**Status:** Ready to ship! 🚀

Execute Phases 1-4 above, verify everything works, and you're live! The MVP is complete and production-ready.
