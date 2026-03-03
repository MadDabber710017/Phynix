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
];

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_grow", name: "First Seed", description: "Start your first grow", icon: "leaf-outline", color: "#66bb6a", xp: 25, condition: "totalGrows >= 1" },
  { id: "five_grows", name: "Serial Grower", description: "Start 5 grows", icon: "leaf", color: "#4caf50", xp: 100, condition: "totalGrows >= 5" },
  { id: "ten_grows", name: "Grow Farm", description: "Start 10 grows", icon: "apps-outline", color: "#2e7d32", xp: 200, condition: "totalGrows >= 10" },
  { id: "first_complete", name: "Harvest Day", description: "Complete your first grow", icon: "cut-outline", color: "#ffa726", xp: 50, condition: "completedGrows >= 1" },
  { id: "five_complete", name: "Seasoned Harvester", description: "Complete 5 grows", icon: "cut", color: "#ef6c00", xp: 200, condition: "completedGrows >= 5" },
  { id: "first_log", name: "Diary Entry", description: "Add your first grow log", icon: "document-text-outline", color: "#42a5f5", xp: 15, condition: "totalLogs >= 1" },
  { id: "ten_logs", name: "Detailed Logger", description: "Add 10 grow logs", icon: "document-text", color: "#1e88e5", xp: 50, condition: "totalLogs >= 10" },
  { id: "fifty_logs", name: "Grow Journalist", description: "Add 50 grow logs", icon: "newspaper-outline", color: "#1565c0", xp: 150, condition: "totalLogs >= 50" },
  { id: "hundred_logs", name: "Encyclopedia", description: "Add 100 grow logs", icon: "library-outline", color: "#0d47a1", xp: 300, condition: "totalLogs >= 100" },
  { id: "first_photo", name: "Shutterbug", description: "Upload your first grow photo", icon: "camera-outline", color: "#ab47bc", xp: 15, condition: "totalPhotos >= 1" },
  { id: "ten_photos", name: "Plant Paparazzi", description: "Upload 10 grow photos", icon: "camera", color: "#8e24aa", xp: 50, condition: "totalPhotos >= 10" },
  { id: "fifty_photos", name: "Photo Album", description: "Upload 50 grow photos", icon: "images-outline", color: "#6a1b9a", xp: 150, condition: "totalPhotos >= 50" },
  { id: "first_analysis", name: "AI Curious", description: "Analyze your first plant", icon: "search-outline", color: "#26c6da", xp: 20, condition: "totalAnalyses >= 1" },
  { id: "ten_analyses", name: "Plant Doctor", description: "Analyze 10 plants", icon: "medkit-outline", color: "#00acc1", xp: 75, condition: "totalAnalyses >= 10" },
  { id: "first_post", name: "Community Member", description: "Share your first community post", icon: "people-outline", color: "#66bb6a", xp: 25, condition: "communityPosts >= 1" },
  { id: "ten_posts", name: "Social Grower", description: "Share 10 community posts", icon: "people", color: "#43a047", xp: 100, condition: "communityPosts >= 10" },
  { id: "week_active", name: "Dedicated", description: "Be active for 7 days", icon: "flame-outline", color: "#ff7043", xp: 50, condition: "daysActive >= 7" },
  { id: "month_active", name: "Committed", description: "Be active for 30 days", icon: "flame", color: "#e64a19", xp: 150, condition: "daysActive >= 30" },
  { id: "three_months", name: "Veteran", description: "Be active for 90 days", icon: "trophy-outline", color: "#ffd54f", xp: 300, condition: "daysActive >= 90" },
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
  const today = new Date().toDateString();
  const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
  if (lastActive !== today) {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, today);
    const profile = await loadProfile();
    profile.stats.daysActive = (profile.stats.daysActive || 0) + 1;
    await saveProfile(profile);
  }
}
