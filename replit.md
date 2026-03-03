# Phynix — Cannabis Growing App

## Overview
A comprehensive cannabis growing mobile app built with Expo React Native. Covers everything from germination to harvest with drying/curing tracking, AI-powered comprehensive plant diagnostics, gamification with virtual plants, and a full social community.

## Tech Stack
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js (TypeScript), PostgreSQL
- **Font**: Nunito (Google Fonts)
- **AI**: OpenAI gpt-5.2 via Replit AI Integrations (vision model for comprehensive plant diagnostics)
- **State**: AsyncStorage for local persistence, React Query for API calls
- **Icons**: @expo/vector-icons (Ionicons)

## App Features

### 5 Tabs:
1. **Home** — Daily grow tips, quick reference stats, growth cycle overview, environment targets, gamification level/XP/achievements (78 achievements, 30 levels)
2. **Guides** — Complete grow guides + encyclopedia (segment toggle: Guides / Encyclopedia)
3. **My Grows** — Track unlimited grows with stages, notes/log, equipment wizard, multi-photo uploads, light schedules, virtual plant companion, quick action buttons (water/nutrients/transplant/node/bud), harvest/drying/curing tracking with progress bars and burp schedule
4. **Analyze** — Comprehensive AI plant diagnostics: sex identification, 12-nutrient analysis, pest/disease detection, water/light/root health, trichome staging, training techniques, troubleshooting guide
5. **Community** — Social feed (likes, comments, follows, shares, reposts), grower profiles, profile pictures (real photos), user search, Everyone/Following filter

## AI Plant Analyzer (Comprehensive Diagnostics)
The analyzer provides exhaustive plant diagnostics:
- **Sex Identification**: Male/Female/Hermaphrodite detection with confidence level and visual indicators
- **12-Nutrient Analysis**: N, P, K, Ca, Mg, Fe, S, Zn, Mn, B, Cu, Mo — each with status (Deficient/Low/Optimal/High/Excess/Lockout), symptoms, and fixes
- **Pest Detection**: Spider mites, fungus gnats, aphids, thrips, whiteflies, caterpillars, broad mites
- **Disease Detection**: Powdery mildew, bud rot, root rot, fusarium, septoria, TMV
- **Water Status**: Overwatered/Underwatered/Optimal with indicators
- **Light Status**: Too Much/Too Little/Optimal with foxtailing/stretching detection
- **Root Health**: Healthy/Concern/Problem with visible indicators
- **Trichome Status**: Clear/Cloudy/Mixed/Amber with harvest readiness
- **Training Observed**: Topping, FIM, LST, HST, defoliation, lollipopping, supercropping
- **Overall Diagnosis**: Comprehensive paragraph summary
- **Troubleshooting Guide**: Priority-based action items based on detected issues
- Response uses max 4000 tokens for detailed analysis

## Gamification
- 30 levels (Sprout -> Phynix Immortal) up to 100,000 XP
- 78 achievements across 13 categories
- XP awarded: start grow (+20), add log (+10), upload photo (+5), community post (+15), analysis (+15), harvest (+50)
- Daily streak tracking
- Stored in AsyncStorage under "phynix_gamification_v1"

## Virtual Plant System
- Realistic cannabis plant visualization with 10 distinct stages
- Cannabis fan leaves with pointed leaflets, bud clusters with pistil hairs and trichome dots
- Grow action effects: watering darkens soil, nutrients darken leaves, transplant enlarges pot, node/bud counts
- Health indicator based on care frequency
- Animated with react-native-reanimated

## Harvest/Drying/Curing System
- **Harvest**: Auto-records date, prompts for wet weight, awards 50 XP
- **Drying Tracker**: Progress bar (days/target), optimal conditions reminder, quick logs (snap test, trim, environment), dry weight input, "Move to Curing" button
- **Curing Tracker**: Progress bar, milestone markers (2w smokeable, 4w good, 8w excellent, 12w premium), burping schedule (changes by week), burp counter with last-burp time, humidity pack tracking, final weight input
- **Done Summary**: Trophy card with total days, wet/dry/cured weights, weight loss %, cure time

## Grow Action Tracking
- Quick action buttons: Water, Nutrients, Transplant, Node, Bud
- Each auto-logs tagged entry and increments counter
- Multi-photo selection per log entry
- All counters feed into VirtualPlant

## Community Features
- Profile pictures (real photos from library)
- Grower profile modals, search growers
- Comments, likes, follows, native shares
- Repost/share-to-feed with attribution

## API Endpoints
- `POST /api/analyze-plant` — Comprehensive AI plant diagnostics (50mb limit, 4000 token response)
- `GET /api/community/posts` — Get community posts
- `POST /api/community/posts` — Create post (supports shared_from for reposts)
- `POST /api/community/posts/:id/like` — Toggle like
- `DELETE /api/community/posts/:id` — Delete own post
- `GET/POST /api/community/posts/:id/comments` — Get/add comments
- `GET /api/community/follows` — Get followed grower names
- `POST /api/community/follow` — Toggle follow
- `GET /api/community/grower/:name` — Get grower profile
- `GET /api/community/search` — Search posts by grower name

## Design System
- Dark green theme (#0a130b background, #4caf50 accent)
- Nunito font family throughout
- Consistent card-based UI with gradient headers

## File Structure
```
app/
  (tabs)/
    index.tsx          # Home dashboard + gamification
    guides.tsx         # Growing guides + encyclopedia
    grows.tsx          # Grows + virtual plant + harvest/dry/cure tracking
    analyze.tsx        # Comprehensive AI plant diagnostics
    community.tsx      # Social feed + profiles + repost
components/
  VirtualPlant.tsx     # Realistic cannabis plant (10 stages)
server/
  index.ts             # Express server (50mb body limit)
  routes.ts            # API endpoints (comprehensive analyzer prompt)
  db.ts                # PostgreSQL
lib/
  gamification.ts      # XP, levels, achievements
  query-client.ts      # React Query + API helpers
```

## Storage Keys (AsyncStorage)
- `phynix_grows_v2` — Grow data (includes harvest/drying/curing fields)
- `phynix_gamification_v1` — XP/level/achievements
- `phynix_device_id` — Anonymous device ID
- `phynix_grower_name` — Grower name for community
- `phynix_profile_pic` — Profile picture base64
- `phynix_last_active` — Daily activity tracking

## Server Limits
- Body parser: 50mb (for base64 images)
- AI response: max 4000 tokens
- Image quality: 0.3 for analyzer/posts, 0.5 for profile pics
