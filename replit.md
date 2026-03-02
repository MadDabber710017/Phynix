# CannaGrow — Cannabis Growing App

## Overview
A comprehensive cannabis growing mobile app built with Expo React Native. Covers everything from germination to harvest, with AI-powered plant analysis.

## Tech Stack
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js (TypeScript)
- **Font**: Nunito (Google Fonts)
- **AI**: OpenAI gpt-5.2 via Replit AI Integrations (vision model for plant analysis)
- **State**: AsyncStorage for local persistence, React Query for API calls
- **Icons**: @expo/vector-icons (Ionicons)

## App Features

### 5 Tabs:
1. **Home** — Daily grow tips, quick reference stats, growth cycle overview, environment targets
2. **Guides** — Complete grow guides (Germination, Seedling, Veg, Flowering, Harvest, Drying/Curing, Legal Notice)
3. **My Grows** — Track unlimited grows with stages, notes/log, growing medium
4. **Analyze** — AI plant analyzer: take/upload photo → AI identifies stage, health score, issues, nutrients, recommendations
5. **Learn** — Encyclopedia: Common Problems, Nutrients, Techniques, Environment, Glossary

## API Endpoints
- `POST /api/analyze-plant` — Accepts base64 image, returns full AI plant analysis JSON

## Design System
- Dark green theme (`#0a130b` background, `#4caf50` accent)
- Nunito font family throughout
- Consistent card-based UI with gradient headers

## File Structure
```
app/
  _layout.tsx          # Root layout with QueryClient, font loading
  (tabs)/
    _layout.tsx        # NativeTabs (iOS 26) + Classic Tabs fallback
    index.tsx          # Home dashboard
    guides.tsx         # Growing guides with modal detail view
    grows.tsx          # My Grows tracker (AsyncStorage)
    analyze.tsx        # AI plant analyzer
    learn.tsx          # Encyclopedia
server/
  index.ts             # Express server setup
  routes.ts            # /api/analyze-plant endpoint
constants/
  colors.ts            # Dark green theme colors
```

## Environment
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Auto-set by Replit OpenAI integration
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Auto-set by Replit OpenAI integration
- `EXPO_PUBLIC_DOMAIN` — Set by Expo workflow for API routing
