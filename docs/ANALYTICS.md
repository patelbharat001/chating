# Analytics Setup for chating.ai

Track user behavior, traffic, and feature usage across your landing page and chat application using **Google Analytics 4 (GA4)**.

---

## 🚀 Quick Start

### Step 1: Create Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Click **"Create"** → **"Property"**
3. Fill in:
   - **Property name:** chating.ai
   - **Reporting timezone:** Your timezone
   - **Currency:** USD (or your currency)
4. Click **"Create"**

### Step 2: Get Your Measurement ID

After creating the property:
1. Go to **Admin** (gear icon) → **Property Settings**
2. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 3: Configure Tracking

Replace `G-XXXXXXXXXX` in both files with your actual Measurement ID:

**Landing Page** (`docs/index.html`):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR-ID-HERE"></script>
```

**Chat App** (`docs/chat.html`):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR-ID-HERE"></script>
```

### Step 4: Verify Tracking

1. Deploy your site
2. Visit your landing page
3. Open Google Analytics → **Realtime** → **Overview**
4. You should see your visitor activity in real-time ✓

---

## 📊 Tracked Events

### Landing Page (`index.html`)

| Event | Triggers When |
|-------|-------------|
| `page_view` | User lands on landing page |
| `enter_chat_clicked` | User clicks "Enter Chat" button |

### Chat App (`chat.html`)

| Event | Data Tracked |
|-------|-------------|
| `room_created` | User creates a new room | Room name, Room ID |
| `room_joined` | User joins existing room | Room name, Room ID |
| `message_sent` | User sends a chat message | Message length, Is host? |
| `video_enabled` | User turns on camera/mic | Participant count |
| `room_left` | User leaves the room | Was they a host? |

---

## 📈 Key Metrics to Monitor

### Traffic & Engagement
- **Landing page views** — How many visitors see your landing page
- **Click-through rate** — % of visitors who click "Enter Chat"
- **Session duration** — How long users stay in chat rooms

### Feature Usage
- **Room creation rate** — How many people create rooms vs join
- **Video adoption** — % of users who enable video
- **Message volume** — Average messages per room
- **Room size** — Average participants per room

### Conversion Funnel
```
Landing Page Views
    ↓
Enter Chat Clicks
    ↓
Create/Join Room
    ↓
Send Messages
    ↓
Video Engagement
```

---

## 🎯 Custom Reports to Create

### 1. Traffic Overview
**Reports** → **Create custom report**
- Users over time
- Device type (mobile vs desktop)
- Geographic location
- Traffic source (direct, referral, search)

### 2. Feature Adoption
- Room creation vs joining
- Video call usage rate
- Average room size
- Message frequency

### 3. User Journey
- Landing page → Chat app conversion
- Room creation flow
- Average session duration

### 4. Traffic Sources
- Where users find you (social, search, direct)
- Referral sources
- Marketing channel effectiveness

---

## 🔍 Google Analytics Dashboard

### Recommended Dashboard Widgets

```
[Daily Active Users]  [Traffic Sources]
[Room Creation Rate]  [Video Adoption %]
[Conversion Funnel]   [Geographic Map]
[Device Breakdown]    [Feature Usage]
```

### How to Create Dashboard
1. Go to **Reports** → **Dashboard**
2. Click **"Create dashboard"**
3. Add cards for each metric above
4. Save and monitor daily

---

## 💡 Insights to Look For

### Growth Signals
- ✅ Increasing daily users
- ✅ Higher "enter chat" click rate
- ✅ More rooms being created
- ✅ Longer session durations

### Warning Signs
- ⚠️ High bounce rate on landing page (>60%)
- ⚠️ Low click-through to chat (<5%)
- ⚠️ Users joining but not messaging
- ⚠️ Dropping daily active users

### Optimization Opportunities
- 📊 Track which features users ignore
- 📊 Identify mobile vs desktop usage patterns
- 📊 Monitor geographic trends
- 📊 Test landing page changes

---

## 🛠️ Advanced Setup

### Add More Events

To track additional events, add this pattern:

```javascript
// Analytics: Track custom event
if(typeof gtag !== 'undefined'){
  gtag('event', 'event_name', {
    'event_category': 'category',
    'event_label': 'label',
    'value': number
  });
}
```

### Examples

**Track room size**
```javascript
gtag('event', 'room_size', {
  'event_category': 'chat_action',
  'participant_count': currentRoster.length
});
```

**Track message type**
```javascript
gtag('event', 'message_sent', {
  'event_category': 'chat_action',
  'message_type': 'text', // or 'emoji', 'link', etc
  'has_mention': text.includes('@')
});
```

---

## 📱 Mobile Analytics

GA4 automatically tracks:
- Device type (mobile, tablet, desktop)
- Operating system
- Browser type
- Screen size
- App version

**View mobile traffic:**
Reports → Insights → Compare → Device category

---

## 🔐 Privacy & GDPR

The tracking code includes:
```javascript
'anonymize_ip': true
```

This anonymizes user IP addresses for GDPR compliance.

**Additional steps:**
1. Add privacy policy mentioning analytics
2. Consider cookie banner if needed
3. Provide opt-out option (optional)

---

## 🚀 Next Steps

1. **Set up GA4 property** (Step 1-2 above)
2. **Add your Measurement ID** to code
3. **Deploy to production**
4. **Wait 24 hours** for data to appear in GA4
5. **Create custom reports** to monitor metrics
6. **Set up alerts** for key metrics

---

## 📚 Resources

- [Google Analytics 4 Docs](https://support.google.com/analytics/answer/10089681)
- [GA4 Events Guide](https://support.google.com/analytics/answer/9322688)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)

---

## 💬 Questions?

Monitor your analytics dashboard regularly to understand:
- **What features do users love?**
- **Where do users drop off?**
- **Which traffic sources convert best?**
- **What devices do most users use?**
- **How can we improve engagement?**

Use these insights to drive your product decisions! 🚀
