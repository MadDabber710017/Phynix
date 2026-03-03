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
3. **My Grows** — Track unlimited grows with stages, notes/log, equipment wizard, photo uploads, light schedules, virtual plant companion
4. **Analyze** — AI plant analyzer: take/upload photo -> AI identifies stage, health score, issues, nutrients, recommendations (uses base64 from picker, not FileSystem)
5. **Community** — Social feed (likes, comments, follows, shares), grower profiles, avatar icons, user search, Everyone/Following filter

## Gamification
- 30 levels (Sprout -> Phynix Immortal) up to 100,000 XP
- 78 achievements across 13 categories: growing, harvesting, logging, photography, analysis, community posts, comments, likes, streaks, activity days, strains, waterings, nutrient feedings
- XP awarded: start grow (+20), add log (+10), upload photo (+5), community post (+15), analysis (+15)
- Daily streak tracking with consecutive day tracking
- Stored in AsyncStorage under "phynix_gamification_v1"

## Virtual Plant System
- Each grow has an interactive virtual plant (`components/VirtualPlant.tsx`)
- Plant appearance driven by real grow data: stage determines shape, log entries affect fullness, recent care affects health color, photos add sparkle effects
- 6 visual stages: Seed, Sprout, Seedling, Vegetative, Flowering, Harvest Ready
- Health indicator (Thriving/Healthy/Needs Care/Wilting) based on care frequency
- Built from styled React Native Views with react-native-reanimated animations

## Community Features
- Avatar icon selection (20 preset plant-themed icons)
- Grower profile modal (tap name to view: posts, join date, follow)
- Search growers functionality
- Comments, likes, follows, shares

## API Endpoints
- `POST /api/analyze-plant` — Accepts base64 image, returns full AI plant analysis JSON
- `GET /api/community/posts` — Get community posts
- `POST /api/community/posts` — Create community post
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
    grows.tsx          # My Grows tracker + virtual plant (AsyncStorage)
    analyze.tsx        # AI plant analyzer
    community.tsx      # Social community feed + profiles + search
components/
  VirtualPlant.tsx     # Interactive virtual plant component
server/
  index.ts             # Express server setup
  routes.ts            # API endpoints (analyze, community, profiles, search)
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
- `phynix_grows_v2` — Grow data
- `phynix_gamification_v1` — XP/level/achievements profile
- `phynix_device_id` — Anonymous device identifier
- `phynix_grower_name` — User's grower name for community
- `phynix_avatar_icon` — Selected avatar icon name
- `phynix_last_active` — Daily activity tracking
