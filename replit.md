# Phynix — Cannabis Growing App

## Overview
A comprehensive cannabis growing mobile app built with Expo React Native. Covers everything from germination to harvest, with AI-powered plant analysis, gamification, and social community.

## Tech Stack
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js (TypeScript), PostgreSQL
- **Font**: Nunito (Google Fonts)
- **AI**: OpenAI gpt-5.2 via Replit AI Integrations (vision model for plant analysis)
- **State**: AsyncStorage for local persistence, React Query for API calls
- **Icons**: @expo/vector-icons (Ionicons)

## App Features

### 5 Tabs:
1. **Home** — Daily grow tips, quick reference stats, growth cycle overview, environment targets, gamification level/XP/achievements
2. **Guides** — Complete grow guides + encyclopedia (segment toggle: Guides / Encyclopedia)
3. **My Grows** — Track unlimited grows with stages, notes/log, equipment wizard, photo uploads, light schedules
4. **Analyze** — AI plant analyzer: take/upload photo -> AI identifies stage, health score, issues, nutrients, recommendations
5. **Community** — Social feed (likes, comments, follows, shares), post creation with photos, Everyone/Following filter

## Gamification
- 15 levels (Sprout -> Grow God)
- 19 achievements across grows, logs, photos, analyses, community posts, and activity streaks
- XP awarded: start grow (+20), add log (+10), upload photo (+5), community post (+15)
- Stored in AsyncStorage under "phynix_gamification_v1"

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
    grows.tsx          # My Grows tracker (AsyncStorage)
    analyze.tsx        # AI plant analyzer
    community.tsx      # Social community feed
server/
  index.ts             # Express server setup
  routes.ts            # API endpoints (analyze, community)
  db.ts                # PostgreSQL connection pool
lib/
  gamification.ts      # XP, levels, achievements system
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
- `phynix_last_active` — Daily activity tracking
