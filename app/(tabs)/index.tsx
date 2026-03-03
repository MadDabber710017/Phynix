import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const PhynixLogo = require("@/assets/images/phynix-logo.png");
import {
  loadProfile,
  trackDailyActivity,
  type GrowProfile,
  LEVEL_THRESHOLDS,
  getNextLevel,
  ALL_ACHIEVEMENTS,
  type Achievement,
} from "@/lib/gamification";

const C = Colors.dark;

const DAILY_TIPS = [
  "Check your pH before every watering. Cannabis thrives at 6.0-7.0 in soil and 5.5-6.5 in hydro.",
  "Less is more with nutrients. Start at 25% of the recommended dose to avoid nutrient burn.",
  "Darkness is sacred during the 12/12 flowering cycle. Even a small light leak can cause hermaphroditism.",
  "Train your plants early! LST (Low Stress Training) during veg can double your yield.",
  "Flush your plants with plain pH'd water for the last 1-2 weeks before harvest to improve taste.",
  "Overwatering is the #1 beginner mistake. Let soil dry out between waterings.",
  "VPD matters. Seedlings: 0.4-0.8 kPa, Veg: 0.8-1.2 kPa, Flower: 1.2-1.6 kPa.",
  "Harvest trichomes when 70% are cloudy and 30% are amber for a balanced high.",
  "Airflow prevents mold and strengthens stems. Aim for gentle leaf movement at all times.",
  "Keep grow room temperatures between 70-85F during lights-on.",
  "CalMag deficiency is extremely common with LED lights, coco coir, and RO water.",
  "Defoliation in flower (week 1 and week 5) improves light penetration to lower bud sites.",
  "Root health is everything. Healthy roots = healthy plant. Check runoff pH and EC regularly.",
  "Don't chase runoff — 15-20% runoff is ideal for soil/coco to prevent salt buildup.",
  "Genetics are 50% of your final result. Invest in quality seeds from reputable breeders.",
];

const QUICK_FACTS = [
  { icon: "water-outline", label: "Watering", value: "Every 2-3 days", color: "#42a5f5" },
  { icon: "thermometer-outline", label: "Temp", value: "70-85F", color: "#ef5350" },
  { icon: "sunny-outline", label: "Veg Light", value: "18/6 hrs", color: "#ffa726" },
  { icon: "moon-outline", label: "Flower Light", value: "12/12 hrs", color: "#ab47bc" },
];

const GROWTH_STAGES = [
  { name: "Germination", days: "1-7 days", icon: "ellipse-outline" },
  { name: "Seedling", days: "1-3 weeks", icon: "leaf-outline" },
  { name: "Vegetative", days: "3-16 weeks", icon: "flower-outline" },
  { name: "Flowering", days: "8-11 weeks", icon: "star-outline" },
  { name: "Harvest", days: "When ready", icon: "cut-outline" },
  { name: "Curing", days: "2-8 weeks", icon: "archive-outline" },
];

function AchievementsModal({ profile, onClose }: { profile: GrowProfile; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const unlockedIds = new Set(profile.achievements.map(a => a.id));

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[achStyles.container, { backgroundColor: C.background }]}>
        <View style={[achStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={achStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <Text style={achStyles.title}>Achievements</Text>
          <Text style={achStyles.subtitle}>
            {profile.achievements.length} / {ALL_ACHIEVEMENTS.length} unlocked
          </Text>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[achStyles.list, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40 }]}
        >
          {ALL_ACHIEVEMENTS.map((ach) => {
            const unlocked = unlockedIds.has(ach.id);
            return (
              <View key={ach.id} style={[achStyles.card, !unlocked && achStyles.cardLocked]}>
                <View style={[achStyles.iconWrap, { backgroundColor: unlocked ? ach.color + "22" : C.backgroundTertiary }]}>
                  <Ionicons name={ach.icon as any} size={24} color={unlocked ? ach.color : C.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[achStyles.achName, !unlocked && { color: C.textMuted }]}>{ach.name}</Text>
                  <Text style={achStyles.achDesc}>{ach.description}</Text>
                </View>
                <View style={achStyles.xpBadge}>
                  <Text style={[achStyles.xpText, { color: unlocked ? ach.color : C.textMuted }]}>+{ach.xp} XP</Text>
                </View>
                {unlocked && (
                  <Ionicons name="checkmark-circle" size={20} color={ach.color} />
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [currentTip, setCurrentTip] = useState(0);
  const [profile, setProfile] = useState<GrowProfile | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    setCurrentTip(Math.floor(Math.random() * DAILY_TIPS.length));
    trackDailyActivity();
  }, []);

  useFocusEffect(useCallback(() => {
    loadProfile().then(setProfile);
  }, []));

  const nextLevel = profile ? getNextLevel(profile.xp) : null;
  const currentThreshold = profile ? LEVEL_THRESHOLDS.find(t => t.level === profile.level) : null;
  const progressPercent = profile && nextLevel && currentThreshold
    ? Math.min(100, ((profile.xp - currentThreshold.xp) / (nextLevel.xpNeeded - currentThreshold.xp)) * 100)
    : 100;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 118 : 100 }}
      >
        <LinearGradient
          colors={["#0d2410", "#0a130b"]}
          style={[styles.header, { paddingTop: topPad + 20 }]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}, Grower</Text>
              <Text style={styles.appName}>Phynix</Text>
            </View>
            <View style={styles.headerIcon}>
              <Image source={PhynixLogo} style={styles.logoImage} resizeMode="contain" />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {profile && (
            <Pressable onPress={() => setShowAchievements(true)}>
              <LinearGradient colors={["#1a3d1c", "#162318"]} style={styles.levelCard}>
                <View style={styles.levelTop}>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelNum}>{profile.level}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.levelTitle}>{profile.title}</Text>
                    <Text style={styles.xpText}>{profile.xp} XP</Text>
                  </View>
                  <View style={styles.achCount}>
                    <Ionicons name="trophy" size={16} color="#ffd54f" />
                    <Text style={styles.achCountText}>{profile.achievements.length}</Text>
                  </View>
                </View>
                {nextLevel && (
                  <View style={styles.xpBar}>
                    <View style={styles.xpTrack}>
                      <View style={[styles.xpFill, { width: `${progressPercent}%` as any }]} />
                    </View>
                    <Text style={styles.xpNext}>{nextLevel.xpToNext} XP to Level {nextLevel.nextLevel}</Text>
                  </View>
                )}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{profile.stats.totalGrows}</Text>
                    <Text style={styles.statLabel}>Grows</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{profile.stats.totalLogs}</Text>
                    <Text style={styles.statLabel}>Logs</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{profile.stats.totalPhotos}</Text>
                    <Text style={styles.statLabel}>Photos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{profile.stats.daysActive}</Text>
                    <Text style={styles.statLabel}>Days</Text>
                  </View>
                </View>

                {profile.achievements.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentAch}>
                    {profile.achievements.slice(-5).reverse().map((ach) => (
                      <View key={ach.id} style={[styles.achPill, { backgroundColor: ach.color + "22", borderColor: ach.color + "44" }]}>
                        <Ionicons name={ach.icon as any} size={13} color={ach.color} />
                        <Text style={[styles.achPillText, { color: ach.color }]}>{ach.name}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </LinearGradient>
            </Pressable>
          )}

          <View style={styles.tipCard}>
            <LinearGradient colors={["#1a3d1c", "#162318"]} style={styles.tipGradient}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb" size={18} color={C.accent} />
                <Text style={styles.tipLabel}>Daily Grower Tip</Text>
              </View>
              <Text style={styles.tipText}>{DAILY_TIPS[currentTip]}</Text>
            </LinearGradient>
          </View>

          <Text style={styles.sectionTitle}>Quick Reference</Text>
          <View style={styles.quickFactsGrid}>
            {QUICK_FACTS.map((fact) => (
              <View key={fact.label} style={styles.factCard}>
                <Ionicons name={fact.icon as any} size={22} color={fact.color} />
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue}>{fact.value}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Growth Cycle</Text>
          <View style={styles.stagesContainer}>
            {GROWTH_STAGES.map((stage, index) => (
              <View key={stage.name} style={styles.stageRow}>
                <View style={styles.stageTimeline}>
                  <View style={[styles.stageDot, { backgroundColor: C.tint }]}>
                    <Ionicons name={stage.icon as any} size={12} color="#fff" />
                  </View>
                  {index < GROWTH_STAGES.length - 1 && <View style={styles.stageLine} />}
                </View>
                <View style={styles.stageInfo}>
                  <Text style={styles.stageName}>{stage.name}</Text>
                  <Text style={styles.stageDays}>{stage.days}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Environment Targets</Text>
          <View style={styles.envCard}>
            {[
              { phase: "Seedling", temp: "68-77F", rh: "65-70%", light: "18/6" },
              { phase: "Vegetative", temp: "70-85F", rh: "40-70%", light: "18/6" },
              { phase: "Early Flower", temp: "65-80F", rh: "40-50%", light: "12/12" },
              { phase: "Late Flower", temp: "65-75F", rh: "30-40%", light: "12/12" },
            ].map((env, i) => (
              <View key={env.phase} style={[styles.envRow, i < 3 && styles.envRowBorder]}>
                <Text style={styles.envPhase}>{env.phase}</Text>
                <View style={styles.envValues}>
                  <View style={styles.envTag}>
                    <Ionicons name="thermometer-outline" size={12} color={C.textMuted} />
                    <Text style={styles.envTagText}>{env.temp}</Text>
                  </View>
                  <View style={styles.envTag}>
                    <Ionicons name="water-outline" size={12} color={C.textMuted} />
                    <Text style={styles.envTagText}>{env.rh}</Text>
                  </View>
                  <View style={styles.envTag}>
                    <Ionicons name="sunny-outline" size={12} color={C.textMuted} />
                    <Text style={styles.envTagText}>{env.light}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {showAchievements && profile && (
        <AchievementsModal profile={profile} onClose={() => setShowAchievements(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary },
  appName: { fontFamily: "Nunito_800ExtraBold", fontSize: 30, color: C.text, marginTop: 2 },
  headerIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.backgroundTertiary,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.cardBorder,
    overflow: "hidden" as const,
  },
  logoImage: { width: 48, height: 48 },
  content: { padding: 16, gap: 16 },
  levelCard: {
    borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden",
  },
  levelTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  levelBadge: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: C.tint,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.tint + "88",
  },
  levelNum: { fontFamily: "Nunito_800ExtraBold", fontSize: 20, color: "#fff" },
  levelTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 18, color: C.text },
  xpText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textSecondary },
  achCount: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ffd54f18", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  achCountText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: "#ffd54f" },
  xpBar: { gap: 6 },
  xpTrack: { height: 6, borderRadius: 3, backgroundColor: C.backgroundTertiary, overflow: "hidden" },
  xpFill: { height: 6, borderRadius: 3, backgroundColor: C.tint },
  xpNext: { fontFamily: "Nunito_400Regular", fontSize: 11, color: C.textMuted },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontFamily: "Nunito_800ExtraBold", fontSize: 18, color: C.text },
  statLabel: { fontFamily: "Nunito_400Regular", fontSize: 11, color: C.textMuted },
  recentAch: { marginTop: 2 },
  achPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, marginRight: 6, borderWidth: 1 },
  achPillText: { fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  tipCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  tipGradient: { padding: 16 },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  tipLabel: { fontFamily: "Nunito_700Bold", fontSize: 12, color: C.accent, letterSpacing: 0.5, textTransform: "uppercase" as const },
  tipText: { fontFamily: "Nunito_400Regular", fontSize: 15, color: C.text, lineHeight: 22 },
  sectionTitle: { fontFamily: "Nunito_700Bold", fontSize: 18, color: C.text, marginTop: 4 },
  quickFactsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  factCard: {
    flex: 1, minWidth: "45%" as any, backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 6,
    borderWidth: 1, borderColor: C.cardBorder, alignItems: "flex-start",
  },
  factLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted },
  factValue: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text },
  stagesContainer: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  stageRow: { flexDirection: "row", gap: 14, minHeight: 48 },
  stageTimeline: { alignItems: "center", width: 28 },
  stageDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stageLine: { width: 2, flex: 1, backgroundColor: C.cardBorder, marginVertical: 4 },
  stageInfo: { flex: 1, paddingTop: 4, paddingBottom: 8 },
  stageName: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text },
  stageDays: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  envCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden" },
  envRow: { padding: 14 },
  envRowBorder: { borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  envPhase: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.text, marginBottom: 8 },
  envValues: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  envTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.backgroundTertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  envTagText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textSecondary },
});

const achStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  closeBtn: { alignSelf: "flex-end", marginBottom: 8 },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: C.text },
  subtitle: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  list: { padding: 16, gap: 8 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  cardLocked: { opacity: 0.5 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  achName: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.text },
  achDesc: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted, marginTop: 1 },
  xpBadge: { backgroundColor: C.backgroundTertiary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  xpText: { fontFamily: "Nunito_700Bold", fontSize: 11 },
});
