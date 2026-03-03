# Phynix — Cannabis Growing App

## Overview
A comprehensive cannabis growing mobile app built with Expo React Native. Covers everything from germination to harvest, with AI-powered plant analysis, gamification with virtual plants, and a full social community.

## Tech Stack
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js (TypeScript), PostgreSQL
- **Font**: Nunito (Google Fonts)
- **AI**: OpenAI gpt-5.2 via Replit AI Integrations (vision model for plant analysis)
- **State**: AsyncStorage for local persistence, React Query for API calls
- **Icons**: @expo/vector-icons (Ionicons)

## App Features

### 5 Tabs:
1. **Home** — Daily grow tips, quick reference stats, growth cycle overview, environment targets, gamification level/XP/achievements (78 achievements, 30 levels)
2. **Guides** — Complete grow guides + encyclopedia (segment toggle: Guides / Encyclopedia)
3. **My Grows** — Track unlimited grows with stages, notes/log, equipment wizard, multi-photo uploads, light schedules, virtual plant companion, quick action buttons (water/nutrients/transplant/node/bud)
4. **Analyze** — AI plant analyzer: take/upload photo -> AI identifies stage, health score, issues, nutrients, recommendations (uses base64 from picker at quality 0.3)
5. **Community** — Social feed (likes, comments, follows, shares, reposts), grower profiles, profile pictures (real photos), user search, Everyone/Following filter

## Gamification
- 30 levels (Sprout -> Phynix Immortal) up to 100,000 XP
- 78 achievements across 13 categories: growing, harvesting, logging, photography, analysis, community posts, comments, likes, streaks, activity days, strains, waterings, nutrient feedings
- XP awarded: start grow (+20), add log (+10), upload photo (+5), community post (+15), analysis (+15)
- Daily streak tracking with consecutive day tracking
- Stored in AsyncStorage under "phynix_gamification_v1"

## Virtual Plant System
- Each grow has an interactive virtual plant (`components/VirtualPlant.tsx`)
- Realistic cannabis plant visualization with 10 distinct stages: Germination (cracking seed), Seedling (cotyledons), Early Veg (3-finger leaves), Late Veg (5-7 finger fan leaves + branches), Pre-Flower (pistil hairs), Early/Mid/Late Flower (bud clusters + trichomes), Harvest Ready, Harvested (hanging to dry)
- Cannabis fan leaves built from multiple pointed leaflets radiating from center
- Bud clusters with pistil hairs and trichome dots
- Grow action effects: watering darkens soil, nutrients darken leaves, transplant enlarges pot, node/bud counts control visible nodes and bud sites
- Health indicator (Thriving/Healthy/Needs Care/Wilting) based on care frequency
- Built from styled React Native Views with react-native-reanimated animations

## Grow Action Tracking
- Quick action buttons in grow log: Water, Nutrients, Transplant, Node, Bud
- Each action auto-logs a tagged entry and increments the corresponding counter
- Counters: waterings, nutrientFeedings, transplants, nodeCount, budCount
- All counters feed into VirtualPlant for realistic visual updates
- Multi-photo selection: can attach multiple photos per log entry

## Community Features
- Profile picture support (real photos from library, stored as base64)
- Grower profile modal (tap name to view: posts, join date, follow)
- Search growers functionality
- Comments, likes, follows, native shares
- Repost/share-to-feed: share another grower's post to your feed with attribution ("Shared from @name")

## API Endpoints
- `POST /api/analyze-plant` — Accepts base64 image, returns full AI plant analysis JSON
- `GET /api/community/posts` — Get community posts
- `POST /api/community/posts` — Create community post (supports shared_from, original_post_id for reposts)
- `POST /api/community/posts/:id/like` — Toggle like
- `DELETE /api/community/posts/:id` — Delete own post
- `GET /api/community/posts/:id/comments` — Get comments
- `POST /api/community/posts/:id/comments` — Add comment
- `GET /api/community/follows` — Get followed grower names
- `POST /api/community/follow` — Toggle follow
- `GET /api/community/grower/:name` — Get grower profile and posts
- `GET /api/community/search?q=term&deviceId=id` — Search posts by grower name

## Design System
- Dark green theme (`#0a130b` background, `#4caf50` accent)
- Nunito font family throughout
- Consistent card-based UI with gradient headers
- Logo: Phynix green flame/leaf icon (assets/images/phynix-logo.png)

## File Structure
```
app/
  _layout.tsx          # Root layout with QueryClient, font loading
  (tabs)/
    _layout.tsx        # NativeTabs (iOS 26) + Classic Tabs fallback
    index.tsx          # Home dashboard + gamification
    guides.tsx         # Growing guides + encyclopedia (segment toggle)
    grows.tsx          # My Grows tracker + virtual plant + quick actions + multi-photo
    analyze.tsx        # AI plant analyzer (quality 0.3)
    community.tsx      # Social community feed + profiles + search + repost
components/
  VirtualPlant.tsx     # Realistic cannabis virtual plant (10 stages, grow action-driven)
server/
  index.ts             # Express server setup (50mb body limit)
  routes.ts            # API endpoints (50mb bodyParser, analyze, community, profiles, search, repost)
  db.ts                # PostgreSQL connection pool
lib/
  gamification.ts      # XP, 30 levels, 78 achievements system
  query-client.ts      # React Query client + API helpers
constants/
  colors.ts            # Dark green theme colors
```

## Environment
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Auto-set by Replit OpenAI integration
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Auto-set by Replit OpenAI integration
- `EXPO_PUBLIC_DOMAIN` — Set by Expo workflow for API routing
- `DATABASE_URL` — PostgreSQL connection string

## Storage Keys (AsyncStorage)
- `phynix_grows_v2` — Grow data (includes waterings, nutrientFeedings, transplants, nodeCount, budCount, multi-photo notes)
- `phynix_gamification_v1` — XP/level/achievements profile
- `phynix_device_id` — Anonymous device identifier
- `phynix_grower_name` — User's grower name for community
- `phynix_profile_pic` — Profile picture base64 (replaces old phynix_avatar_icon)
- `phynix_last_active` — Daily activity tracking

## Server Limits
- Body parser limit: 50mb (for base64 image uploads)
- Image quality: 0.3 for analyzer/community posts, 0.5 for profile pics
