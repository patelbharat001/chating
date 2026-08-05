# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a landing page for chating.ai that showcases features and drives traffic to the chat application.

**Architecture:** Move the current chat application from `index.html` to `chat.html`, then create a new `index.html` landing page with hero section, feature highlights, and CTA button. Both pages reuse the existing dark theme and gradient color scheme for brand consistency.

**Tech Stack:** HTML5, CSS3 (vanilla), JavaScript (minimal, no frameworks)

## Global Constraints

- Reuse existing color scheme: dark bg (#0f1117), panels (#171a23), gradients (blue-purple: #5b8cff to #7c5bff)
- Mobile-first responsive design: 1 col on mobile, 2-col grid on tablet+
- Fast load time: minimal external dependencies, no heavy animations
- Landing page text: "Chat Without the Tracking" (hero), 4 feature cards (Private, Instant, Video, Lightweight)
- Navigation: "Enter Chat" button links to `/chat.html`

---

## Task 1: Move Current Chat App to chat.html

**Files:**
- Create: `docs/chat.html`
- Delete (or archive): `docs/index.html` (after copying to chat.html)

**Interfaces:**
- Consumes: Current `docs/index.html` (entire file, 735 lines)
- Produces: `docs/chat.html` with identical chat application code

- [ ] **Step 1: Copy current index.html to chat.html**

Run: `cp docs/index.html docs/chat.html` (or use PowerShell: `Copy-Item docs/index.html docs/chat.html`)

- [ ] **Step 2: Update chat.html to work as standalone page**

Open `docs/chat.html` and verify the title is still accurate. No code changes needed — the chat app is self-contained. Confirm file exists and is readable (375 KB).

- [ ] **Step 3: Test chat.html in browser**

Navigate to `http://localhost:5173/chat.html` (or your dev server). Verify:
- Name input screen appears ✓
- Can enter a name and proceed to lobby ✓
- No 404 errors in console ✓

- [ ] **Step 4: Commit**

```bash
git add docs/chat.html
git commit -m "feat: move chat app to chat.html for multi-page architecture"
```

---

## Task 2: Create Landing Page index.html with Hero Section

**Files:**
- Create: `docs/index.html` (new file)

**Interfaces:**
- Consumes: Existing color scheme from chat app (CSS variables)
- Produces: `docs/index.html` landing page with HTML structure, hero markup, and shared CSS reset

- [ ] **Step 1: Create new index.html with DOCTYPE and head**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>chating.ai — private peer-to-peer chat</title>

<style>
  :root{
    --bg:#0f1117; --panel:#171a23; --panel2:#1e2230; --border:#2a2f3f;
    --text:#e8eaf0; --dim:#8b90a3; --accent:#5b8cff; --accent2:#7c5bff;
  }
  *{box-sizing:border-box;}
  body{
    margin:0; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background:radial-gradient(1200px 600px at 50% -10%, #1b2030, var(--bg));
    color:var(--text); min-height:100vh; display:flex; flex-direction:column; align-items:center;
  }
  .wrap{ width:100%; max-width:820px; padding:32px 16px; }
</style>
</head>
<body>
<div class="wrap">
  <!-- Hero section goes here in next task -->
</div>
</body>
</html>
```

- [ ] **Step 2: Add hero section markup inside .wrap**

Replace the `<!-- Hero section goes here in next task -->` comment with:

```html
<div class="hero">
  <h1>Chat Without the <span class="gradient-text">Tracking</span></h1>
  <p class="subtitle">No accounts. No servers logging your messages. Just you and them.</p>
  <button class="cta-button" onclick="window.location.href='/chat.html';">Enter Chat</button>
</div>
```

- [ ] **Step 3: Add hero CSS styling to `<style>` block**

Add before closing `</style>`:

```css
  .hero{
    text-align:center; margin-bottom:48px; padding-top:32px;
  }
  .hero h1{
    font-size:28px; margin:0 0 16px; letter-spacing:.5px; font-weight:600;
  }
  .gradient-text{
    background:linear-gradient(90deg,var(--accent),var(--accent2));
    -webkit-background-clip:text; background-clip:text; color:transparent;
  }
  .subtitle{
    font-size:15px; color:var(--dim); margin:0 0 24px; line-height:1.6; max-width:500px; margin-left:auto; margin-right:auto;
  }
  .cta-button{
    cursor:pointer; border:none; border-radius:10px; padding:14px 32px; font-size:15px;
    font-weight:600; background:linear-gradient(90deg,var(--accent),var(--accent2)); color:#fff;
    width:80%; max-width:300px; display:inline-block;
  }
  .cta-button:hover{ opacity:.9; }
  @media (max-width:640px){
    .hero h1{ font-size:24px; }
    .subtitle{ font-size:14px; }
    .cta-button{ width:85%; }
  }
```

- [ ] **Step 4: Test hero section in browser**

Navigate to `http://localhost:5173/`. Verify:
- Title "chating.ai" appears ✓
- Headline "Chat Without the Tracking" visible (gradient on "Tracking") ✓
- Subtitle text visible ✓
- "Enter Chat" button visible and clickable ✓
- Mobile view: button full-width with padding ✓

- [ ] **Step 5: Commit**

```bash
git add docs/index.html
git commit -m "feat: create landing page with hero section"
```

---

## Task 3: Add Feature Cards Section

**Files:**
- Modify: `docs/index.html`

**Interfaces:**
- Consumes: Hero section from Task 2, `.card` and `.wrap` CSS
- Produces: Features section with 4 cards (Private, Instant, Video, Lightweight)

- [ ] **Step 1: Add features section HTML before closing .wrap**

Add before `</div>` (the closing of .wrap):

```html
<div class="features-section">
  <div class="features-grid">
    <div class="card">
      <div class="card-icon">🔒</div>
      <h3 class="card-title">Private by Design</h3>
      <p class="card-desc">Messages stay between you. Peer-to-peer means no server logs.</p>
    </div>
    
    <div class="card">
      <div class="card-icon">⚡</div>
      <h3 class="card-title">Instant Access</h3>
      <p class="card-desc">No signup. No email. Pick a name and start chatting.</p>
    </div>
    
    <div class="card">
      <div class="card-icon">📹</div>
      <h3 class="card-title">Video Built-In</h3>
      <p class="card-desc">Switch to video calls without leaving the room.</p>
    </div>
    
    <div class="card">
      <div class="card-icon">💨</div>
      <h3 class="card-title">Fast & Lightweight</h3>
      <p class="card-desc">WebRTC mesh network. Nothing bloated, nothing stored.</p>
    </div>
  </div>
</div>

<div class="footer-text">chating.ai · peer-to-peer, no accounts, nothing saved</div>
```

- [ ] **Step 2: Add features CSS to `<style>` block**

Add before closing `</style>`:

```css
  .features-section{ margin-top:40px; }
  .features-grid{
    display:grid; grid-template-columns:1fr; gap:16px;
  }
  @media (min-width:641px){
    .features-grid{ grid-template-columns:repeat(2, 1fr); }
  }
  .card{
    background:var(--panel); border:1px solid var(--border); border-radius:14px;
    padding:24px; border-left:4px solid var(--accent); box-shadow:0 4px 12px rgba(0,0,0,.2);
  }
  .card:nth-child(2){ border-left-color:var(--accent2); }
  .card:nth-child(3){ border-left-color:var(--accent); }
  .card:nth-child(4){ border-left-color:var(--accent2); }
  .card-icon{ font-size:32px; margin-bottom:12px; display:block; }
  .card-title{ font-size:16px; margin:12px 0 8px; font-weight:600; }
  .card-desc{ font-size:14px; color:var(--dim); line-height:1.6; margin:0; }
  .footer-text{
    text-align:center; color:var(--dim); font-size:12px; margin-top:40px; padding-top:24px;
    border-top:1px solid var(--border);
  }
```

- [ ] **Step 3: Test features section in browser**

Navigate to `http://localhost:5173/`. Verify:
- 4 feature cards visible below hero ✓
- Icons render (🔒⚡📹💨) ✓
- Card titles and descriptions visible ✓
- Mobile view: cards stack vertically (1 column) ✓
- Tablet/desktop view: cards in 2×2 grid ✓
- Border colors alternate (blue-purple) ✓
- Footer text appears at bottom ✓

- [ ] **Step 4: Commit**

```bash
git add docs/index.html
git commit -m "feat: add feature cards section to landing page"
```

---

## Task 4: Test Responsive Design

**Files:**
- Test: `docs/index.html`
- Test: `docs/chat.html`

**Interfaces:**
- Consumes: Landing page from Task 3, chat app from Task 1
- Produces: Verified responsive behavior on mobile, tablet, desktop

- [ ] **Step 1: Test mobile view (375px width)**

Open browser DevTools (F12 → Toggle device toolbar). Set viewport to mobile (375×667).
Verify:
- Hero text centers and fits ✓
- "Enter Chat" button is ~85% width ✓
- Feature cards stack vertically (1 col) ✓
- Text is readable, no overflow ✓
- Footer text visible ✓
- No horizontal scroll ✓

- [ ] **Step 2: Test tablet view (768px width)**

Set viewport to 768×1024 (iPad size).
Verify:
- Feature cards display in 2×2 grid ✓
- Spacing is balanced ✓
- Button width is reasonable (~300px max-width) ✓
- All text readable ✓

- [ ] **Step 3: Test desktop view (1280px width)**

Set viewport to 1280×800 (desktop).
Verify:
- Hero section centered and prominent ✓
- Feature cards in 2×2 grid with proper spacing ✓
- Max-width (820px) respected, centered on screen ✓
- CTA button visually prominent ✓

- [ ] **Step 4: Test chat.html responsiveness**

Navigate to `http://localhost:5173/chat.html`. Verify chat app still works on:
- Mobile (375px): lobby/chat layout responsive ✓
- Tablet (768px): layout adapts correctly ✓
- Desktop (1280px): full layout visible ✓

- [ ] **Step 5: Test button navigation**

On landing page, click "Enter Chat" button.
Verify:
- Navigates to `/chat.html` without error ✓
- Chat app loads (name entry screen appears) ✓
- No console errors ✓

- [ ] **Step 6: Commit**

```bash
git add docs/index.html docs/chat.html
git commit -m "test: verify responsive design across all breakpoints"
```

---

## Task 5: Verify Color Consistency and Visual Polish

**Files:**
- Test: `docs/index.html`
- Test: `docs/chat.html`

**Interfaces:**
- Consumes: Landing page from Task 3, chat app from Task 1
- Produces: Visual consistency verification and minor polish tweaks if needed

- [ ] **Step 1: Compare color scheme between pages**

Open landing page (`/`) and chat page (`/chat.html`) side-by-side in browser.
Verify colors match:
- Dark background (#0f1117) ✓
- Panel color (#171a23) on cards ✓
- Text color (#e8eaf0) ✓
- Dim text (#8b90a3) ✓
- Gradient (blue #5b8cff → purple #7c5bff) ✓

- [ ] **Step 2: Test gradient on "Tracking" text**

On landing page hero, verify gradient applies correctly to "Tracking" span.
Expected: "Tracking" text shows blue→purple gradient ✓

- [ ] **Step 3: Verify button hover effect**

On landing page, hover over "Enter Chat" button.
Expected: Button dims slightly (opacity: 0.9) ✓

- [ ] **Step 4: Check load time**

Open DevTools → Network tab. Reload landing page.
Verify:
- Total load time < 1 second ✓
- No missing resources (404s) ✓
- CSS loads inline (no external stylesheet needed) ✓

- [ ] **Step 5: Test accessibility**

Run browser accessibility check (DevTools → Lighthouse → Accessibility).
Verify:
- Heading hierarchy correct (h1, h3) ✓
- Color contrast passes AA standard ✓
- Button is keyboard-accessible (Tab key) ✓

- [ ] **Step 6: Commit**

```bash
git add docs/index.html
git commit -m "polish: verify color consistency and accessibility"
```

---

## Task 6: Final Integration Test and Documentation

**Files:**
- Test: `docs/index.html`
- Test: `docs/chat.html`
- Test: Root directory files

**Interfaces:**
- Consumes: Complete landing page + chat app from all previous tasks
- Produces: Verified working system, documentation, and final commit

- [ ] **Step 1: Full user flow test**

1. Navigate to `http://localhost:5173/` (landing page)
2. Verify landing page displays correctly ✓
3. Click "Enter Chat" → navigates to `/chat.html` ✓
4. Enter a name, proceed to lobby ✓
5. Create or join a room, send a message ✓
6. Test video toggle (if desired) ✓
7. Leave room, return to chat app ✓

- [ ] **Step 2: Test URL navigation directly**

Visit `http://localhost:5173/chat.html` directly (bypass landing page).
Verify: Chat app loads and works independently ✓

- [ ] **Step 3: Verify git history**

Run: `git log --oneline docs/ | head -10`

Expected output shows:
- "feat: move chat app to chat.html for multi-page architecture"
- "feat: create landing page with hero section"
- "feat: add feature cards section to landing page"
- "test: verify responsive design across all breakpoints"
- "polish: verify color consistency and accessibility"

- [ ] **Step 4: Check file sizes**

Run: `ls -lh docs/index.html docs/chat.html`

Expected:
- `index.html` (landing page): ~2-3 KB
- `chat.html` (chat app): ~35+ KB

- [ ] **Step 5: Create or update README for landing page (optional)**

If `docs/README.md` exists, add a section describing the new architecture:

```markdown
## Architecture

**Multi-page structure:**
- `index.html` — Landing page with feature highlights and CTA to chat app
- `chat.html` — Peer-to-peer chat application with WebRTC video support
- Future: index.html to become hub for additional serverless tools
```

- [ ] **Step 6: Final commit**

```bash
git add docs/
git commit -m "feat: complete landing page integration and testing"
```

---

## Success Criteria Verification Checklist

Before marking complete, verify all criteria from the design spec:

- [ ] Landing page loads fast (< 1s, mobile-first)
- [ ] Clear value prop visible within 2 seconds on any device
- [ ] "Enter Chat" CTA is obvious and prominent (button, gradient, large)
- [ ] Responsive on mobile (375px), tablet (768px), desktop (1280px)
- [ ] Consistent with chating.ai brand (dark, gradient, minimal aesthetic)
- [ ] Navigation flow works: landing page → chat app via button click
- [ ] No console errors on either page
- [ ] Color scheme matches existing chat app exactly
