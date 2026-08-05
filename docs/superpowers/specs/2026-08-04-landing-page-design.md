# Landing Page Design — chating.ai

**Date:** 2026-08-04  
**Goal:** Create an attractive entry point landing page to drive traffic to chating.ai, showcasing core value props before users enter the chat app.

---

## Architecture

**Page structure:**
- `index.html` → New landing page (hero + features + CTA)
- `chat.html` → Current chat codebase (moved from index.html)
- Future: index.html becomes hub for multiple serverless tools

**Entry flow:** User lands on index.html → Sees landing page → Clicks "Enter Chat" → Navigates to chat.html

---

## Design

### Hero Section
- **Headline:** Bold, gradient-accented text. Example: "Chat Without the Tracking"
- **Subheading:** 1-2 lines explaining peer-to-peer privacy. Example: "No accounts. No servers logging your messages. Just you and them."
- **Visual:** Minimal illustration or subtle animated gradient background (keep mobile load time low)
- **CTA Button:** Prominent "Enter Chat" button, gradient background (blue-purple), navigates to `/chat.html`
- **Mobile:** Full-width, centered, button ~80% width with padding

### Features Section
Four feature cards (vertical stack on mobile, 2×2 grid on tablet+):

1. **🔒 Private by Design**
   - "Messages stay between you. Peer-to-peer means no server logs."

2. **⚡ Instant Access**
   - "No signup. No email. Pick a name and start chatting."

3. **📹 Video Built-In**
   - "Switch to video calls without leaving the room."

4. **💨 Fast & Lightweight**
   - "WebRTC mesh network. Nothing bloated, nothing stored."

**Card styling:** Dark panel (reuse `.card` from chat app), gradient left border (accent color), icon, title, description. Consistent with existing design system.

### Footer
- Small text: "chating.ai · peer-to-peer, no accounts, nothing saved"
- Optional future: Links to how-it-works or privacy info

---

## Visual Style

**Reuse from existing chat app:**
- Dark theme (bg: #0f1117, panels: #171a23)
- Gradient accents (blue-purple: #5b8cff to #7c5bff)
- Typography, spacing, border radius (10-14px radius)
- Same font stack ('Segoe UI', Roboto, etc.)

**Mobile-first:** 
- Full-width hero on small screens
- Card grid adapts: 1 col mobile, 2 col tablet+
- Sticky footer or hero CTA for easy conversion

---

## Implementation Tasks

1. Move current index.html code to chat.html
2. Create new index.html with landing page HTML/CSS
3. Add feature card markup and styling
4. Test responsive design (mobile, tablet, desktop)
5. Link "Enter Chat" button to chat.html
6. Verify existing color scheme matches

---

## Success Criteria

- Landing page loads fast (mobile-first, minimal images/animations)
- Clear value prop visible within 2 seconds
- "Enter Chat" CTA is obvious and prominent
- Responsive on mobile, tablet, desktop
- Consistent with chating.ai brand (dark, gradient, minimal)
- Drives users to chat.html with high conversion
