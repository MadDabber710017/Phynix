import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const C = Colors.dark;

const DAILY_TIPS = [
  "Check your pH before every watering. Cannabis thrives at 6.0–7.0 in soil and 5.5–6.5 in hydro.",
  "Less is more with nutrients. Start at 25% of the recommended dose to avoid nutrient burn.",
  "Darkness is sacred during the 12/12 flowering cycle. Even a small light leak can cause hermaphroditism.",
  "Train your plants early! LST (Low Stress Training) during veg can double your yield.",
  "Flush your plants with plain pH'd water for the last 1–2 weeks before harvest to improve taste.",
  "Overwatering is the #1 beginner mistake. Let soil dry out between waterings — lift the pot to feel the weight.",
  "VPD (Vapor Pressure Deficit) matters. Seedlings: 0.4–0.8 kPa, Veg: 0.8–1.2 kPa, Flower: 1.2–1.6 kPa.",
  "Harvest trichomes when 70% are cloudy and 30% are amber for a balanced high.",
  "Airflow prevents mold and strengthens stems. Aim for gentle leaf movement at all times.",
  "Keep grow room temperatures between 70–85°F (21–29°C) during lights-on.",
];

const QUICK_FACTS = [
  { icon: "water-outline", label: "Watering", value: "Every 2–3 days", color: "#42a5f5" },
  { icon: "thermometer-outline", label: "Temp", value: "70–85°F", color: "#ef5350" },
  { icon: "sunny-outline", label: "Veg Light", value: "18/6 hrs", color: "#ffa726" },
  { icon: "moon-outline", label: "Flower Light", value: "12/12 hrs", color: "#ab47bc" },
];

const GROWTH_STAGES = [
  { name: "Germination", days: "1–7 days", icon: "ellipse-outline" },
  { name: "Seedling", days: "1–3 weeks", icon: "leaf-outline" },
  { name: "Vegetative", days: "3–16 weeks", icon: "flower-outline" },
  { name: "Flowering", days: "8–11 weeks", icon: "star-outline" },
  { name: "Harvest", days: "When ready", icon: "cut-outline" },
  { name: "Curing", days: "2–8 weeks", icon: "archive-outline" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [currentTip, setCurrentTip] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const tipIndex = Math.floor(Math.random() * DAILY_TIPS.length);
    setCurrentTip(tipIndex);
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? bottomPad + 84 : 100 }}
      >
        <LinearGradient
          colors={["#0d2410", "#0a130b"]}
          style={[styles.header, { paddingTop: topPad + 20 }]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}, Grower</Text>
              <Text style={styles.appName}>CannaGrow</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="leaf" size={32} color={C.tint} />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.tipCard}>
            <LinearGradient
              colors={["#1a3d1c", "#162318"]}
              style={styles.tipGradient}
            >
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
                  {index < GROWTH_STAGES.length - 1 && (
                    <View style={styles.stageLine} />
                  )}
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
              { phase: "Seedling", temp: "68–77°F", rh: "65–70%", light: "18/6" },
              { phase: "Vegetative", temp: "70–85°F", rh: "40–70%", light: "18/6" },
              { phase: "Early Flower", temp: "65–80°F", rh: "40–50%", light: "12/12" },
              { phase: "Late Flower", temp: "65–75°F", rh: "30–40%", light: "12/12" },
            ].map((env, i) => (
              <View
                key={env.phase}
                style={[styles.envRow, i < 3 && styles.envRowBorder]}
              >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  appName: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 30,
    color: C.text,
    marginTop: 2,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  content: { padding: 16, gap: 16 },
  tipCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  tipGradient: { padding: 16 },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  tipLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: C.accent,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tipText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: C.text,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: C.text,
    marginTop: 4,
  },
  quickFactsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  factCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "flex-start",
  },
  factLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: C.textMuted,
  },
  factValue: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: C.text,
  },
  stagesContainer: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  stageRow: { flexDirection: "row", gap: 14, minHeight: 48 },
  stageTimeline: { alignItems: "center", width: 28 },
  stageDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stageLine: {
    width: 2,
    flex: 1,
    backgroundColor: C.cardBorder,
    marginVertical: 4,
  },
  stageInfo: { flex: 1, paddingTop: 4, paddingBottom: 8 },
  stageName: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: C.text,
  },
  stageDays: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  envCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },
  envRow: { padding: 14 },
  envRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  envPhase: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: C.text,
    marginBottom: 8,
  },
  envValues: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  envTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.backgroundTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  envTagText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: C.textSecondary,
  },
});
