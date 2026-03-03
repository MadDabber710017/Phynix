import AsyncStorage from "@react-native-async-storage/async-storage";

const GAMIFICATION_KEY = "phynix_gamification_v1";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  xp: number;
  condition: string;
  unlockedAt?: string;
}

export interface GrowProfile {
  xp: number;
  level: number;
  title: string;
  achievements: Achievement[];
  stats: {
    totalGrows: number;
    completedGrows: number;
    totalLogs: number;
    totalPhotos: number;
    totalAnalyses: number;
    communityPosts: number;
    daysActive: number;
    firstGrowDate: string | null;
    totalWaterings: number;
    totalNutrientFeedings: number;
    totalHarvests: number;
    longestStreak: number;
    currentStreak: number;
    totalComments: number;
    totalLikes: number;
    uniqueStrains: number;
  };
}

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Sprout" },
  { level: 2, xp: 100, title: "Seedling" },
  { level: 3, xp: 300, title: "Sapling" },
  { level: 4, xp: 600, title: "Gardener" },
  { level: 5, xp: 1000, title: "Cultivator" },
  { level: 6, xp: 1500, title: "Grower" },
  { level: 7, xp: 2200, title: "Farmer" },
  { level: 8, xp: 3000, title: "Botanist" },
  { level: 9, xp: 4000, title: "Horticulturist" },
  { level: 10, xp: 5500, title: "Master Grower" },
  { level: 11, xp: 7500, title: "Cannabis Sage" },
  { level: 12, xp: 10000, title: "Green Wizard" },
  { level: 13, xp: 13000, title: "Plant Whisperer" },
  { level: 14, xp: 17000, title: "Legendary Grower" },
  { level: 15, xp: 22000, title: "Grow God" },
  { level: 16, xp: 27000, title: "Chlorophyll King" },
  { level: 17, xp: 33000, title: "Trichome Titan" },
  { level: 18, xp: 40000, title: "Root Shaman" },
  { level: 19, xp: 47000, title: "Canopy Commander" },
  { level: 20, xp: 55000, title: "Terp Alchemist" },
  { level: 21, xp: 63000, title: "Phenotype Hunter" },
  { level: 22, xp: 72000, title: "Living Soil Sage" },
  { level: 23, xp: 80000, title: "Harvest Oracle" },
  { level: 24, xp: 85000, title: "Garden Architect" },
  { level: 25, xp: 88000, title: "Bloom Overlord" },
  { level: 26, xp: 91000, title: "Resin Royalty" },
  { level: 27, xp: 94000, title: "Eternal Cultivator" },
  { level: 28, xp: 96000, title: "Mythic Grower" },
  { level: 29, xp: 98000, title: "Ascended Botanist" },
  { level: 30, xp: 100000, title: "Phynix Immortal" },
];

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "grow_1", name: "First Seed", description: "Start your first grow", icon: "leaf-outline", color: "#66bb6a", xp: 25, condition: "totalGrows >= 1" },
  { id: "grow_3", name: "Triple Threat", description: "Start 3 grows", icon: "leaf", color: "#57a05a", xp: 50, condition: "totalGrows >= 3" },
  { id: "grow_5", name: "Serial Grower", description: "Start 5 grows", icon: "leaf", color: "#4caf50", xp: 100, condition: "totalGrows >= 5" },
  { id: "grow_10", name: "Grow Farm", description: "Start 10 grows", icon: "apps-outline", color: "#2e7d32", xp: 200, condition: "totalGrows >= 10" },
  { id: "grow_25", name: "Quarter Century", description: "Start 25 grows", icon: "grid-outline", color: "#1b5e20", xp: 400, condition: "totalGrows >= 25" },
  { id: "grow_50", name: "Grow Factory", description: "Start 50 grows", icon: "business-outline", color: "#004d40", xp: 750, condition: "totalGrows >= 50" },
  { id: "grow_100", name: "Centurion Grower", description: "Start 100 grows", icon: "planet-outline", color: "#00695c", xp: 1500, condition: "totalGrows >= 100" },

  { id: "harvest_1", name: "Harvest Day", description: "Complete your first grow", icon: "cut-outline", color: "#ffa726", xp: 50, condition: "completedGrows >= 1" },
  { id: "harvest_3", name: "Hat Trick Harvest", description: "Complete 3 grows", icon: "cut-outline", color: "#fb8c00", xp: 100, condition: "completedGrows >= 3" },
  { id: "harvest_5", name: "Seasoned Harvester", description: "Complete 5 grows", icon: "cut", color: "#ef6c00", xp: 200, condition: "completedGrows >= 5" },
  { id: "harvest_10", name: "Harvest Master", description: "Complete 10 grows", icon: "ribbon-outline", color: "#e65100", xp: 400, condition: "completedGrows >= 10" },
  { id: "harvest_25", name: "Golden Sickle", description: "Complete 25 grows", icon: "trophy-outline", color: "#bf360c", xp: 800, condition: "completedGrows >= 25" },
  { id: "harvest_50", name: "Eternal Harvester", description: "Complete 50 grows", icon: "trophy", color: "#8d6e63", xp: 1500, condition: "completedGrows >= 50" },

  { id: "log_1", name: "Diary Entry", description: "Add your first grow log", icon: "document-text-outline", color: "#42a5f5", xp: 15, condition: "totalLogs >= 1" },
  { id: "log_5", name: "Note Taker", description: "Add 5 grow logs", icon: "document-text-outline", color: "#2196f3", xp: 30, condition: "totalLogs >= 5" },
  { id: "log_10", name: "Detailed Logger", description: "Add 10 grow logs", icon: "document-text", color: "#1e88e5", xp: 50, condition: "totalLogs >= 10" },
  { id: "log_25", name: "Grow Chronicler", description: "Add 25 grow logs", icon: "book-outline", color: "#1976d2", xp: 100, condition: "totalLogs >= 25" },
  { id: "log_50", name: "Grow Journalist", description: "Add 50 grow logs", icon: "newspaper-outline", color: "#1565c0", xp: 150, condition: "totalLogs >= 50" },
  { id: "log_100", name: "Encyclopedia", description: "Add 100 grow logs", icon: "library-outline", color: "#0d47a1", xp: 300, condition: "totalLogs >= 100" },
  { id: "log_250", name: "Obsessive Logger", description: "Add 250 grow logs", icon: "file-tray-stacked-outline", color: "#283593", xp: 600, condition: "totalLogs >= 250" },
  { id: "log_500", name: "Data Archivist", description: "Add 500 grow logs", icon: "server-outline", color: "#1a237e", xp: 1000, condition: "totalLogs >= 500" },
  { id: "log_1000", name: "Legendary Scribe", description: "Add 1000 grow logs", icon: "server", color: "#0d1b3e", xp: 2000, condition: "totalLogs >= 1000" },

  { id: "photo_1", name: "Shutterbug", description: "Upload your first grow photo", icon: "camera-outline", color: "#ab47bc", xp: 15, condition: "totalPhotos >= 1" },
  { id: "photo_5", name: "Snap Happy", description: "Upload 5 grow photos", icon: "camera-outline", color: "#9c27b0", xp: 30, condition: "totalPhotos >= 5" },
  { id: "photo_10", name: "Plant Paparazzi", description: "Upload 10 grow photos", icon: "camera", color: "#8e24aa", xp: 50, condition: "totalPhotos >= 10" },
  { id: "photo_25", name: "Photo Gallery", description: "Upload 25 grow photos", icon: "images-outline", color: "#7b1fa2", xp: 100, condition: "totalPhotos >= 25" },
  { id: "photo_50", name: "Photo Album", description: "Upload 50 grow photos", icon: "images", color: "#6a1b9a", xp: 200, condition: "totalPhotos >= 50" },
  { id: "photo_100", name: "Visual Historian", description: "Upload 100 grow photos", icon: "albums-outline", color: "#4a148c", xp: 400, condition: "totalPhotos >= 100" },
  { id: "photo_250", name: "Grow Cinematographer", description: "Upload 250 grow photos", icon: "film-outline", color: "#311b92", xp: 800, condition: "totalPhotos >= 250" },
  { id: "photo_500", name: "Lens Legend", description: "Upload 500 grow photos", icon: "videocam-outline", color: "#1a0066", xp: 1500, condition: "totalPhotos >= 500" },

  { id: "analysis_1", name: "AI Curious", description: "Analyze your first plant", icon: "search-outline", color: "#26c6da", xp: 20, condition: "totalAnalyses >= 1" },
  { id: "analysis_5", name: "Scan Enthusiast", description: "Analyze 5 plants", icon: "search", color: "#00bcd4", xp: 50, condition: "totalAnalyses >= 5" },
  { id: "analysis_10", name: "Plant Doctor", description: "Analyze 10 plants", icon: "medkit-outline", color: "#00acc1", xp: 75, condition: "totalAnalyses >= 10" },
  { id: "analysis_25", name: "Diagnostic Pro", description: "Analyze 25 plants", icon: "pulse-outline", color: "#0097a7", xp: 150, condition: "totalAnalyses >= 25" },
  { id: "analysis_50", name: "AI Whisperer", description: "Analyze 50 plants", icon: "hardware-chip-outline", color: "#00838f", xp: 300, condition: "totalAnalyses >= 50" },
  { id: "analysis_100", name: "Neural Botanist", description: "Analyze 100 plants", icon: "analytics-outline", color: "#006064", xp: 600, condition: "totalAnalyses >= 100" },

  { id: "post_1", name: "Community Member", description: "Share your first community post", icon: "people-outline", color: "#66bb6a", xp: 25, condition: "communityPosts >= 1" },
  { id: "post_5", name: "Active Contributor", description: "Share 5 community posts", icon: "chatbubbles-outline", color: "#4caf50", xp: 50, condition: "communityPosts >= 5" },
  { id: "post_10", name: "Social Grower", description: "Share 10 community posts", icon: "people", color: "#43a047", xp: 100, condition: "communityPosts >= 10" },
  { id: "post_25", name: "Community Pillar", description: "Share 25 community posts", icon: "megaphone-outline", color: "#388e3c", xp: 200, condition: "communityPosts >= 25" },
  { id: "post_50", name: "Content Creator", description: "Share 50 community posts", icon: "create-outline", color: "#2e7d32", xp: 400, condition: "communityPosts >= 50" },
  { id: "post_100", name: "Community Legend", description: "Share 100 community posts", icon: "star", color: "#1b5e20", xp: 800, condition: "communityPosts >= 100" },

  { id: "comment_1", name: "First Reply", description: "Leave your first comment", icon: "chatbubble-outline", color: "#7986cb", xp: 15, condition: "totalComments >= 1" },
  { id: "comment_10", name: "Conversationalist", description: "Leave 10 comments", icon: "chatbubble-ellipses-outline", color: "#5c6bc0", xp: 50, condition: "totalComments >= 10" },
  { id: "comment_25", name: "Discussion Leader", description: "Leave 25 comments", icon: "chatbubbles-outline", color: "#3f51b5", xp: 100, condition: "totalComments >= 25" },
  { id: "comment_50", name: "Comment King", description: "Leave 50 comments", icon: "chatbubbles", color: "#3949ab", xp: 200, condition: "totalComments >= 50" },
  { id: "comment_100", name: "Voice of the Community", description: "Leave 100 comments", icon: "megaphone-outline", color: "#303f9f", xp: 400, condition: "totalComments >= 100" },

  { id: "like_1", name: "First Like", description: "Give your first like", icon: "heart-outline", color: "#ef5350", xp: 10, condition: "totalLikes >= 1" },
  { id: "like_10", name: "Generous Heart", description: "Give 10 likes", icon: "heart-half-outline", color: "#e53935", xp: 30, condition: "totalLikes >= 10" },
  { id: "like_50", name: "Love Spreader", description: "Give 50 likes", icon: "heart", color: "#d32f2f", xp: 100, condition: "totalLikes >= 50" },
  { id: "like_100", name: "Heart of Gold", description: "Give 100 likes", icon: "heart-circle-outline", color: "#c62828", xp: 200, condition: "totalLikes >= 100" },

  { id: "streak_3", name: "Threepeat", description: "3-day activity streak", icon: "flame-outline", color: "#ff7043", xp: 30, condition: "currentStreak >= 3" },
  { id: "streak_7", name: "Week Warrior", description: "7-day activity streak", icon: "flame-outline", color: "#ff5722", xp: 75, condition: "currentStreak >= 7" },
  { id: "streak_14", name: "Fortnight Force", description: "14-day activity streak", icon: "flame", color: "#f4511e", xp: 150, condition: "currentStreak >= 14" },
  { id: "streak_30", name: "Monthly Machine", description: "30-day activity streak", icon: "flame", color: "#e64a19", xp: 300, condition: "currentStreak >= 30" },
  { id: "streak_60", name: "Iron Will", description: "60-day activity streak", icon: "bonfire-outline", color: "#d84315", xp: 600, condition: "currentStreak >= 60" },
  { id: "streak_90", name: "Unstoppable", description: "90-day activity streak", icon: "bonfire-outline", color: "#bf360c", xp: 1000, condition: "currentStreak >= 90" },
  { id: "streak_180", name: "Half Year Hero", description: "180-day activity streak", icon: "bonfire", color: "#b71c1c", xp: 2000, condition: "currentStreak >= 180" },
  { id: "streak_365", name: "Year of Fire", description: "365-day activity streak", icon: "bonfire", color: "#880e4f", xp: 5000, condition: "currentStreak >= 365" },

  { id: "active_7", name: "Dedicated", description: "Be active for 7 days", icon: "calendar-outline", color: "#ff7043", xp: 50, condition: "daysActive >= 7" },
  { id: "active_14", name: "Consistent", description: "Be active for 14 days", icon: "calendar-outline", color: "#f4511e", xp: 75, condition: "daysActive >= 14" },
  { id: "active_30", name: "Committed", description: "Be active for 30 days", icon: "calendar", color: "#e64a19", xp: 150, condition: "daysActive >= 30" },
  { id: "active_60", name: "Loyal Grower", description: "Be active for 60 days", icon: "calendar", color: "#d84315", xp: 250, condition: "daysActive >= 60" },
  { id: "active_90", name: "Veteran", description: "Be active for 90 days", icon: "trophy-outline", color: "#ffd54f", xp: 300, condition: "daysActive >= 90" },
  { id: "active_180", name: "Half Year Veteran", description: "Be active for 180 days", icon: "trophy-outline", color: "#ffca28", xp: 500, condition: "daysActive >= 180" },
  { id: "active_365", name: "Annual Legend", description: "Be active for 365 days", icon: "trophy", color: "#ffc107", xp: 1000, condition: "daysActive >= 365" },

  { id: "strain_3", name: "Strain Explorer", description: "Grow 3 unique strains", icon: "flask-outline", color: "#81c784", xp: 50, condition: "uniqueStrains >= 3" },
  { id: "strain_5", name: "Variety Seeker", description: "Grow 5 unique strains", icon: "flask-outline", color: "#66bb6a", xp: 100, condition: "uniqueStrains >= 5" },
  { id: "strain_10", name: "Strain Collector", description: "Grow 10 unique strains", icon: "flask", color: "#4caf50", xp: 200, condition: "uniqueStrains >= 10" },
  { id: "strain_25", name: "Genetic Library", description: "Grow 25 unique strains", icon: "fitness-outline", color: "#388e3c", xp: 500, condition: "uniqueStrains >= 25" },

  { id: "water_1", name: "First Watering", description: "Water your plants for the first time", icon: "water-outline", color: "#4fc3f7", xp: 10, condition: "totalWaterings >= 1" },
  { id: "water_10", name: "Hydration Station", description: "Water your plants 10 times", icon: "water-outline", color: "#29b6f6", xp: 30, condition: "totalWaterings >= 10" },
  { id: "water_50", name: "Rain Maker", description: "Water your plants 50 times", icon: "water", color: "#03a9f4", xp: 100, condition: "totalWaterings >= 50" },
  { id: "water_100", name: "Aqua Master", description: "Water your plants 100 times", icon: "water", color: "#0288d1", xp: 200, condition: "totalWaterings >= 100" },

  { id: "nutrient_1", name: "First Feeding", description: "Feed nutrients for the first time", icon: "nutrition-outline", color: "#aed581", xp: 10, condition: "totalNutrientFeedings >= 1" },
  { id: "nutrient_10", name: "Nutrient Mixer", description: "Feed nutrients 10 times", icon: "nutrition-outline", color: "#9ccc65", xp: 30, condition: "totalNutrientFeedings >= 10" },
  { id: "nutrient_50", name: "Fertigation Pro", description: "Feed nutrients 50 times", icon: "nutrition", color: "#8bc34a", xp: 100, condition: "totalNutrientFeedings >= 50" },
  { id: "nutrient_100", name: "Nutrient Alchemist", description: "Feed nutrients 100 times", icon: "nutrition", color: "#7cb342", xp: 200, condition: "totalNutrientFeedings >= 100" },
];

function getLevelForXP(xp: number): { level: number; title: string } {
  let result = LEVEL_THRESHOLDS[0];
  for (const t of LEVEL_THRESHOLDS) {
    if (xp >= t.xp) result = t;
    else break;
  }
  return result;
}

export function getNextLevel(xp: number): { nextLevel: number; xpNeeded: number; xpToNext: number } | null {
  const current = getLevelForXP(xp);
  const next = LEVEL_THRESHOLDS.find(t => t.level === current.level + 1);
  if (!next) return null;
  return { nextLevel: next.level, xpNeeded: next.xp, xpToNext: next.xp - xp };
}

function checkCondition(condition: string, stats: GrowProfile["stats"]): boolean {
  const match = condition.match(/(\w+)\s*>=\s*(\d+)/);
  if (!match) return false;
  const [, field, value] = match;
  const statValue = (stats as any)[field];
  return typeof statValue === "number" && statValue >= parseInt(value);
}

export async function loadProfile(): Promise<GrowProfile> {
  try {
    const stored = await AsyncStorage.getItem(GAMIFICATION_KEY);
    if (stored) {
      const profile = JSON.parse(stored) as GrowProfile;
      const { level, title } = getLevelForXP(profile.xp);
      profile.stats = {
        totalGrows: profile.stats.totalGrows ?? 0,
        completedGrows: profile.stats.completedGrows ?? 0,
        totalLogs: profile.stats.totalLogs ?? 0,
        totalPhotos: profile.stats.totalPhotos ?? 0,
        totalAnalyses: profile.stats.totalAnalyses ?? 0,
        communityPosts: profile.stats.communityPosts ?? 0,
        daysActive: profile.stats.daysActive ?? 1,
        firstGrowDate: profile.stats.firstGrowDate ?? null,
        totalWaterings: profile.stats.totalWaterings ?? 0,
        totalNutrientFeedings: profile.stats.totalNutrientFeedings ?? 0,
        totalHarvests: profile.stats.totalHarvests ?? 0,
        longestStreak: profile.stats.longestStreak ?? 0,
        currentStreak: profile.stats.currentStreak ?? 0,
        totalComments: profile.stats.totalComments ?? 0,
        totalLikes: profile.stats.totalLikes ?? 0,
        uniqueStrains: profile.stats.uniqueStrains ?? 0,
      };
      return { ...profile, level, title };
    }
  } catch {}
  return {
    xp: 0,
    level: 1,
    title: "Sprout",
    achievements: [],
    stats: {
      totalGrows: 0,
      completedGrows: 0,
      totalLogs: 0,
      totalPhotos: 0,
      totalAnalyses: 0,
      communityPosts: 0,
      daysActive: 1,
      firstGrowDate: null,
      totalWaterings: 0,
      totalNutrientFeedings: 0,
      totalHarvests: 0,
      longestStreak: 0,
      currentStreak: 0,
      totalComments: 0,
      totalLikes: 0,
      uniqueStrains: 0,
    },
  };
}

export async function saveProfile(profile: GrowProfile): Promise<void> {
  const { level, title } = getLevelForXP(profile.xp);
  profile.level = level;
  profile.title = title;
  await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(profile));
}

export async function addXP(amount: number, statKey?: keyof GrowProfile["stats"]): Promise<{ profile: GrowProfile; newAchievements: Achievement[]; leveledUp: boolean }> {
  const profile = await loadProfile();
  const oldLevel = profile.level;
  profile.xp += amount;

  if (statKey && typeof profile.stats[statKey] === "number") {
    (profile.stats as any)[statKey] = (profile.stats[statKey] as number) + 1;
  }

  if (statKey === "currentStreak" && profile.stats.currentStreak > profile.stats.longestStreak) {
    profile.stats.longestStreak = profile.stats.currentStreak;
  }

  const unlockedIds = new Set(profile.achievements.map(a => a.id));
  const newAchievements: Achievement[] = [];

  for (const ach of ALL_ACHIEVEMENTS) {
    if (!unlockedIds.has(ach.id) && checkCondition(ach.condition, profile.stats)) {
      const unlocked = { ...ach, unlockedAt: new Date().toISOString() };
      profile.achievements.push(unlocked);
      profile.xp += ach.xp;
      newAchievements.push(unlocked);
    }
  }

  const { level, title } = getLevelForXP(profile.xp);
  profile.level = level;
  profile.title = title;

  await saveProfile(profile);
  return { profile, newAchievements, leveledUp: level > oldLevel };
}

export async function trackDailyActivity(): Promise<void> {
  const LAST_ACTIVE_KEY = "phynix_last_active";
  const STREAK_DATE_KEY = "phynix_streak_date";
  const today = new Date().toDateString();
  const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
  if (lastActive !== today) {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, today);
    const profile = await loadProfile();
    profile.stats.daysActive = (profile.stats.daysActive || 0) + 1;

    const lastStreakDate = await AsyncStorage.getItem(STREAK_DATE_KEY);
    if (lastStreakDate) {
      const lastDate = new Date(lastStreakDate);
      const todayDate = new Date(today);
      const diffMs = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        profile.stats.currentStreak = (profile.stats.currentStreak || 0) + 1;
      } else if (diffDays > 1) {
        profile.stats.currentStreak = 1;
      }
    } else {
      profile.stats.currentStreak = 1;
    }

    if (profile.stats.currentStreak > (profile.stats.longestStreak || 0)) {
      profile.stats.longestStreak = profile.stats.currentStreak;
    }

    await AsyncStorage.setItem(STREAK_DATE_KEY, today);
    await saveProfile(profile);
  }
}
