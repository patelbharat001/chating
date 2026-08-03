# Analytics Metrics Reference

Key metrics to monitor for chating.ai growth and optimization.

---

## 📊 Core Metrics by Category

### Traffic Metrics

| Metric | What It Measures | Good Target | How to Improve |
|--------|------------------|-------------|----------------|
| **Daily Active Users (DAU)** | Unique users per day | Growing 10%+ MoM | Increase marketing, referrals |
| **Monthly Active Users (MAU)** | Unique users per month | Growing 20%+ YoY | Improve retention, go viral |
| **Page Views** | Total landing page views | 1000s per day | SEO, paid ads, social |
| **Sessions** | User sessions per day | Growing 15%+ MoM | Better onboarding, features |
| **Bounce Rate** | Users leaving without action | <40% | Improve landing page copy |

### Engagement Metrics

| Metric | What It Measures | Good Target | Action If Low |
|--------|------------------|-------------|----------------|
| **Click-through Rate (CTR)** | % clicking "Enter Chat" | >15% | Improve hero, CTA button |
| **Conversion Rate** | % landing → room creation | >5% | Easier onboarding |
| **Avg Session Duration** | Minutes per session | >5 min | Add features, improve UX |
| **Messages per Session** | Avg messages per user | >10 | Encourage participation |
| **Video Adoption Rate** | % users enabling video | >20% | Promote video features |

### Room Metrics

| Metric | What It Measures | Insights |
|--------|------------------|----------|
| **Rooms Created/Day** | New rooms daily | Platform growth |
| **Avg Room Size** | Users per room | Community dynamics |
| **Room Duration** | Minutes in room | Engagement depth |
| **Repeat Room Visits** | Users in same room | Loyalty, communities |
| **Peak Room Size** | Max participants | Infrastructure needs |

### Feature Usage

| Feature | How to Track | Good Rate | Action If Low |
|---------|-------------|----------|----------------|
| **Video Calls** | `video_enabled` events | >20% | Tutorial, improve UX |
| **Message Sending** | `message_sent` events | >80% of users | Encourage chat |
| **Room Creation** | `room_created` events | >30% create own | Easier creation |
| **Long Sessions** | Session duration | >50% stay >10min | More engaging |

---

## 🎯 Conversion Funnel

```
Landing Page Views:        100%
     ↓ (Bounce Rate)
User Clicks "Enter Chat":   40-50%
     ↓
Creates/Joins Room:         20-30%
     ↓
Sends First Message:        15-20%
     ↓
Enables Video:              3-5%
     ↓
Returns Next Day (DAU):      10-15%
```

**Optimization focus:** Improve weakest funnel step

---

## 📍 Geographic & Device Metrics

### By Device Type
```
Desktop:  60-70% of users
Mobile:   25-30% of users
Tablet:   5-10% of users
```

**Action:** Optimize mobile experience if <50% on mobile

### By Geography
- **Track by country** to identify key markets
- **Monitor time zones** for peak activity
- **Localize** for top 3-5 countries

### By Browser
- Chrome: ~60-70%
- Safari: ~15-20%
- Firefox: ~5-10%
- Others: ~5%

**Action:** Test compatibility, prioritize top browsers

---

## 🔄 Retention Metrics

| Metric | Definition | Good Target | Meaning |
|--------|-----------|------------|---------|
| **Day 1 Retention** | Users back day 2 | >40% | First impression good |
| **Day 7 Retention** | Users back day 8 | >20% | Habit formation |
| **Day 30 Retention** | Users back day 31 | >10% | Long-term engagement |
| **Churn Rate** | Users who stop using | <5% per week | Product satisfaction |

---

## 💰 Traffic Source Metrics

### Analyze by Source

| Source | Volume | Conversion | Quality |
|--------|--------|-----------|---------|
| **Organic Search** | Track in GA4 | Usually 3-5% | High intent |
| **Direct** | Returning users | 10-15% | Very high intent |
| **Social Media** | Twitter, Reddit, etc | 1-3% | Medium quality |
| **Referrals** | Other sites | 2-4% | Variable |
| **Paid Ads** | If running ads | 2-5% | Depends on targeting |

**Strategy:** Double down on highest-converting sources

---

## 🚨 Health Check Metrics

Monitor these daily to catch issues:

```
✅ Daily Active Users:     [Target: >100]
✅ Bounce Rate:            [Target: <50%]
✅ Avg Session Duration:   [Target: >3 min]
✅ Room Creation Rate:     [Target: >10/day]
✅ Video Adoption:         [Target: >15%]
✅ Error Rate:             [Target: <1%]
```

**Automated alerts:** Set up GA4 alerts for anomalies

---

## 📈 Growth Benchmarks

### Week 1-4 (Launch)
- Focus on bug fixes, feature completeness
- DAU: 50-200
- CTR: >15%
- Sessions: Growing

### Month 2-3 (Early Growth)
- Focus on user retention
- DAU: 200-1,000
- Retention Day 7: >15%
- Feature adoption: 10%+

### Month 4-6 (Acceleration)
- Focus on viral loops
- DAU: 1,000-5,000+
- Retention Day 7: >20%
- Video adoption: >20%

### Month 6+ (Scaling)
- Focus on monetization
- DAU: 5,000+
- Retention Day 30: >10%
- Revenue per user: $X

---

## 🎓 Useful GA4 Reports

### Pre-built Reports
1. **Realtime** → See live traffic
2. **User Acquisition** → How users find you
3. **Engagement** → How users interact
4. **Retention** → Return user behavior
5. **Monetization** → Revenue metrics (if applicable)

### Custom Reports to Create
- **Conversion Funnel** (landing → chat → message)
- **Video Adoption Over Time**
- **Room Size Distribution**
- **Geographic Heatmap**
- **Device Performance**

---

## 🔍 Segments to Create

**Analyze user groups separately:**

1. **New vs Returning**
   - New users: First time on site
   - Returning: Visited before
   - Compare conversion rates

2. **By Device**
   - Desktop users
   - Mobile users
   - Tablet users

3. **By Geography**
   - USA
   - Europe
   - Asia
   - Other

4. **By Behavior**
   - Video adopters
   - Room creators
   - Chat heavy users

---

## 📊 Weekly Review Checklist

Every Monday, check:

- [ ] DAU trending? (up/down/flat)
- [ ] Any traffic spikes? (What drove them?)
- [ ] Bounce rate stable? (>50% = problem)
- [ ] Conversion rate stable? (>5% = good)
- [ ] Video adoption growing?
- [ ] Retention improving?
- [ ] Any errors/issues?
- [ ] Top traffic sources?
- [ ] Device split?
- [ ] Geographic trends?

**Action items:** What to improve this week?

---

## 🚀 Data-Driven Decisions

Use your analytics to answer:

1. **What features do users love?**
   - High usage = Keep and improve
   - Low usage = Remove or redesign

2. **Where do users drop off?**
   - Landing page → Chat (low CTR?)
   - Join room → First message (friction?)
   - Video button → Enabled (technical issue?)

3. **Who are our power users?**
   - Desktop? Mobile?
   - From which country?
   - How often do they return?

4. **What's our go-to-market strategy?**
   - Organic? Paid? Viral?
   - Best performing channel?

5. **What should we build next?**
   - What do users want more of?
   - What's missing?
   - Unused features to remove?

---

## 🎯 Monthly Goals Template

```
GOAL: Grow DAU by 50% and improve retention

Metrics:
- DAU: 100 → 150
- CTR: 15% → 20%
- Day 7 Retention: 15% → 20%
- Video Adoption: 10% → 15%

Actions:
- [ ] Improve landing page hero
- [ ] Add video tutorial
- [ ] Fix mobile UX
- [ ] Marketing push

Results:
- DAU: 100 → 140 (+40%) 🟡
- CTR: 15% → 18% (+3%) 🟡
- Day 7 Retention: 15% → 18% (+3%) 🟡
- Video Adoption: 10% → 12% (+2%) 🟡

Next Month:
- Why didn't we hit 50%? User acquisition or retention?
- Double down on mobile optimization
- Invest in video marketing
```

---

## 📱 Analytics Tools

**Primary:** Google Analytics 4  
**Secondary:** Google Search Console (SEO data)  
**Optional:** Hotjar (user heatmaps), Mixpanel (advanced funnels)

---

Start tracking, analyze weekly, iterate fast! 🚀
