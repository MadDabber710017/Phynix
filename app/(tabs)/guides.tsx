import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const C = Colors.dark;

interface GuideStep {
  title: string;
  description: string;
  tips: string[];
  warnings?: string[];
}

interface Guide {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  steps: GuideStep[];
}

const GUIDES: Guide[] = [
  {
    id: "germination",
    title: "Germination",
    subtitle: "Starting your seeds correctly",
    icon: "ellipse-outline",
    color: "#66bb6a",
    duration: "3–7 days",
    difficulty: "Beginner",
    steps: [
      {
        title: "Paper Towel Method",
        description: "The easiest and most reliable germination method. Moisten two paper towels (not dripping wet) and place seeds between them on a plate. Cover with another plate to retain moisture and warmth.",
        tips: [
          "Keep temperature between 70–85°F (21–29°C)",
          "Check seeds every 12 hours",
          "Seeds should sprout in 24–120 hours",
          "Tap root should be at least 5mm before transplanting",
        ],
        warnings: ["Don't let paper towels dry out", "Avoid direct light during germination"],
      },
      {
        title: "Water Glass Method",
        description: "Drop seeds into a glass of room-temperature water. They should sink within 2 hours. If they float, gently tap them down. After 24–48 hours, look for a small white root tail.",
        tips: [
          "Use only plain, pH'd water at 6.0–6.5",
          "Keep in a dark, warm location",
          "Transfer to moist paper towel after 24–48 hours",
        ],
      },
      {
        title: "Direct Soil Germination",
        description: "Plant seeds directly into moist, lightly fertilized starter soil. Make a small hole 0.5–1cm deep, drop the seed in, and cover lightly. Don't pack the soil.",
        tips: [
          "Keep soil consistently moist but not wet",
          "Germinate in solo cups or small pots",
          "Seedling should emerge in 3–7 days",
          "Cover with plastic wrap to create humidity dome",
        ],
      },
    ],
  },
  {
    id: "seedling",
    title: "Seedling Stage",
    subtitle: "First weeks of life",
    icon: "leaf-outline",
    color: "#81c784",
    duration: "1–3 weeks",
    difficulty: "Beginner",
    steps: [
      {
        title: "Light Requirements",
        description: "Seedlings need gentle light to start. Use T5 fluorescents or low-power LEDs at 2–4 inches distance. Run 18–20 hours of light per day. Strong lights can stress delicate seedlings.",
        tips: [
          "Light intensity: 200–400 PPFD",
          "Keep lights 18-24 inches away for HPS/high-power LED",
          "Watch for stretching — a sign of insufficient light",
          "A slight blue-spectrum light promotes compact growth",
        ],
      },
      {
        title: "Watering Seedlings",
        description: "Water gently and sparingly. Use a spray bottle or very gentle watering can. The goal is to keep the medium moist but never waterlogged. Water around the seedling, not directly on it.",
        tips: [
          "Water in a circle around the stem to encourage root growth",
          "Let the top inch of soil dry between waterings",
          "pH water to 6.2–6.5 (soil) or 5.5–6.0 (hydro)",
          "No nutrients needed for the first 2 weeks in quality soil",
        ],
        warnings: ["Overwatering is the #1 seedling killer", "Root rot sets in fast at this stage"],
      },
      {
        title: "Environment & Humidity",
        description: "Seedlings love high humidity. Aim for 65–70% RH to reduce transpiration stress while roots are developing. Temperature should be 68–77°F. A humidity dome over small seedlings works great.",
        tips: [
          "Use a humidity dome or humidity tent",
          "Introduce gentle airflow to strengthen stems",
          "Gradually reduce humidity as the plant grows",
          "Avoid cold drafts or sudden temperature swings",
        ],
      },
    ],
  },
  {
    id: "vegetative",
    title: "Vegetative Stage",
    subtitle: "Building your plant's structure",
    icon: "flower-outline",
    color: "#42a5f5",
    duration: "3–16 weeks",
    difficulty: "Intermediate",
    steps: [
      {
        title: "Light & Schedule",
        description: "During veg, plants need 18 hours of light and 6 hours of dark (18/6). Some growers use 20/4 or even 24/0, but 18/6 is the sweet spot balancing growth speed with energy cost.",
        tips: [
          "HPS/MH 400–1000w for large grows",
          "LED full spectrum for efficiency",
          "PPFD: 400–600 during early veg, 600–900 for late veg",
          "Keep lights at the manufacturer's recommended height",
        ],
      },
      {
        title: "Nutrition & Feeding",
        description: "Vegetative plants are hungry for Nitrogen (N). Use a veg-specific nutrient formula with higher N than P or K. Start at 25% of recommended dose and increase if plants look healthy.",
        tips: [
          "Feed every other watering (feed, water, feed, water)",
          "Look for dark green, waxy leaves — sign of healthy N levels",
          "Yellowing = nitrogen deficiency, dark/clawing = excess",
          "Add CalMag if growing with RO water or LED lights",
        ],
        warnings: ["Nutrient burn shows as brown leaf tips", "Less is more — you can always add nutrients but can't remove them"],
      },
      {
        title: "Training Techniques",
        description: "Veg is the perfect time to train your plants for maximum yield. LST, topping, and FIMing all happen here. Training during veg sets up your plant's final structure.",
        tips: [
          "Top or FIM at node 3–5 for multiple main colas",
          "LST: Bend main stem and tie down to encourage horizontal growth",
          "SCROG: Set up a screen for even canopy",
          "Defoliate sparingly — remove only large fan leaves blocking light",
        ],
      },
      {
        title: "Root Zone Care",
        description: "A healthy root zone means a healthy plant. Ensure proper drainage, oxygenation, and space for root development. Roots should be white and smell fresh.",
        tips: [
          "Transplant when roots circle the bottom of the pot",
          "Final pot size: 1 gallon per 1 foot of expected height",
          "Add mycorrhizae during transplant to boost root development",
          "Healthy roots are white; brown/slimy roots indicate root rot",
        ],
      },
    ],
  },
  {
    id: "flowering",
    title: "Flowering Stage",
    subtitle: "Growing your buds",
    icon: "star-outline",
    color: "#ab47bc",
    duration: "8–11 weeks",
    difficulty: "Intermediate",
    steps: [
      {
        title: "Switching to Flower",
        description: "Switch light schedule to 12 hours on / 12 hours off to trigger flowering. The dark period must be completely uninterrupted. Even a brief light leak can stress plants and cause hermaphroditism.",
        tips: [
          "Week 1–2: Transition/stretch phase — plants may double in height",
          "Check all light leaks before switching",
          "Begin adding phosphorus-heavy flower nutrients",
          "Reduce nitrogen as flower stretch begins",
        ],
        warnings: ["NEVER interrupt the 12-hour dark period", "Check timers for proper function before the switch"],
      },
      {
        title: "Nutrient Schedule",
        description: "Flower requires a bloom-heavy nutrient schedule. Shift from high-N veg nutrients to high P/K bloom boosters. Week 1-2: mild boost. Weeks 3-6: peak feeding. Weeks 7+: begin flush.",
        tips: [
          "Use bloom boosters high in phosphorus and potassium",
          "Drop nitrogen to near zero by week 4",
          "Add terpene/resin enhancers from week 3",
          "Monitor EC/PPM closely — plants are sensitive to salt buildup",
        ],
      },
      {
        title: "Environmental Control",
        description: "Maintain strict environmental control during flower to prevent bud rot and maximize resin production. Humidity is critical — high RH in late flower invites mold.",
        tips: [
          "Temperature: 65–80°F lights on, 60–70°F lights off",
          "Humidity: 40–50% early flower, 30–40% late flower",
          "Maintain strong airflow — no stagnant air pockets",
          "Keep CO2 levels above 1000 PPM for faster growth",
        ],
      },
      {
        title: "Week-by-Week Guide",
        description: "A rough weekly breakdown of the flowering stage to help you stay on track.",
        tips: [
          "Week 1–2: Switch, pre-flowers appear, stretch begins",
          "Week 3–4: Buds forming, white hairs everywhere, full stretch",
          "Week 5–6: Buds fattening, trichomes milky, strong smell",
          "Week 7–8: Buds dense, trichomes going amber, reduce nutrients",
          "Week 9–11: Flush, monitor trichomes daily, harvest window opens",
        ],
      },
    ],
  },
  {
    id: "harvest",
    title: "Harvesting",
    subtitle: "Knowing when and how to harvest",
    icon: "cut-outline",
    color: "#ffa726",
    duration: "Varies by strain",
    difficulty: "Intermediate",
    steps: [
      {
        title: "Trichome Inspection",
        description: "Trichomes are your most accurate harvest indicator. Use a jeweler's loupe (30-100x) or digital microscope to examine them. Don't rely on pistil color alone.",
        tips: [
          "Clear trichomes = not ready, plant is still producing THC",
          "Cloudy/milky = peak THC, energetic/cerebral effect",
          "Amber trichomes = THC degrading to CBN, more sedative/body",
          "Most prefer 70–80% cloudy, 20–30% amber for balanced effect",
        ],
      },
      {
        title: "Flushing Before Harvest",
        description: "Flush your plants with plain pH'd water for the last 1–2 weeks (soil) or 5–7 days (hydro/coco). This removes residual nutrient salts and improves the taste and smoothness of final product.",
        tips: [
          "Soil: Flush 2 weeks before harvest",
          "Coco/Hydro: Flush 1 week before harvest",
          "Use only plain water with correct pH (6.0–6.5 soil)",
          "Plants will yellow and use stored nutrients — this is normal",
        ],
        warnings: ["Some growers skip flushing (controversial) — research both approaches"],
      },
      {
        title: "Harvesting Process",
        description: "Cut the plant at the base or harvest branch by branch. Work in a clean environment. Have all your tools ready: sharp scissors/shears, trays, and hang lines.",
        tips: [
          "Harvest in the morning before lights come on for max terpenes",
          "Cut at the base for whole-plant harvest or branch by branch",
          "Remove large fan leaves before drying",
          "Keep trimming area cool and clean",
        ],
      },
    ],
  },
  {
    id: "drying-curing",
    title: "Drying & Curing",
    subtitle: "The most overlooked step",
    icon: "archive-outline",
    color: "#ef5350",
    duration: "2–8 weeks",
    difficulty: "Advanced",
    steps: [
      {
        title: "Drying Basics",
        description: "Hang branches upside down or lay on drying racks in a cool, dark room. Slow drying preserves terpenes and creates a smoother product. The process takes 7–14 days depending on bud density.",
        tips: [
          "Ideal conditions: 60–65°F, 55–60% RH",
          "Keep the room dark — light degrades trichomes",
          "Gentle airflow but no direct fan on buds",
          "Ready when small stems snap (not bend) cleanly",
        ],
        warnings: ["Fast drying = harsh, hay-tasting product", "Mold can form if humidity is too high during drying"],
      },
      {
        title: "Trimming",
        description: "Trim away sugar leaves and stems after drying. Wet trim (before drying) or dry trim (after drying) — both work. Dry trimming is easier and preserves trichomes better.",
        tips: [
          "Use sharp, clean trimming scissors",
          "Trim slowly and carefully to preserve trichomes",
          "Save trim for hash or edibles — don't waste it",
          "Wear gloves to keep hands clean and reduce contamination",
        ],
      },
      {
        title: "Curing in Jars",
        description: "Place trimmed buds loosely in glass mason jars (not packed). Fill jars 75% full to allow airflow. Open jars daily for the first 2 weeks to 'burp' them and release moisture.",
        tips: [
          "Burp jars 2x daily for weeks 1–2",
          "Then once daily for weeks 3–4",
          "After 1 month, check weekly",
          "Add Boveda 62% humidity packs for precise humidity control",
        ],
      },
      {
        title: "Long-Term Curing",
        description: "The longer you cure, the better the taste, smoothness, and effect profile. A proper cure allows chlorophyll and starches to break down, resulting in a much cleaner smoke.",
        tips: [
          "Minimum: 2 weeks for decent quality",
          "Recommended: 4–8 weeks for premium quality",
          "Some strains benefit from 3–6 months of curing",
          "Properly cured cannabis can be stored 1–2 years without quality loss",
        ],
      },
    ],
  },
  {
    id: "legalnotice",
    title: "Legal Notice",
    subtitle: "Know your local laws",
    icon: "shield-outline",
    color: "#78909c",
    duration: "Always",
    difficulty: "Beginner",
    steps: [
      {
        title: "Check Your Local Laws",
        description: "Cannabis cultivation laws vary widely by country, state, and municipality. Always research and comply with your local regulations before growing. This app is for educational purposes only.",
        tips: [
          "Many US states allow 3–6 plants for personal use",
          "Some countries allow home cultivation for medical use",
          "Even in legal states, there may be local restrictions",
          "Growing without a license where required is a serious offense",
        ],
        warnings: [
          "CannaGrow is for educational purposes only",
          "Always comply with your local, state, and federal laws",
          "Consult a legal professional if you're unsure about your jurisdiction",
        ],
      },
    ],
  },
];

const DIFFICULTY_COLORS = {
  Beginner: "#66bb6a",
  Intermediate: "#ffa726",
  Advanced: "#ef5350",
};

function GuideModal({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[modalStyles.container, { backgroundColor: C.background }]}>
        <View style={[modalStyles.modalHeader, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <View style={modalStyles.headerInfo}>
            <View style={[modalStyles.iconCircle, { backgroundColor: guide.color + "22" }]}>
              <Ionicons name={guide.icon as any} size={24} color={guide.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.guideTitle}>{guide.title}</Text>
              <Text style={modalStyles.guideSubtitle}>{guide.subtitle}</Text>
            </View>
          </View>
          <View style={modalStyles.metaRow}>
            <View style={[modalStyles.badge, { backgroundColor: DIFFICULTY_COLORS[guide.difficulty] + "22" }]}>
              <Text style={[modalStyles.badgeText, { color: DIFFICULTY_COLORS[guide.difficulty] }]}>
                {guide.difficulty}
              </Text>
            </View>
            <View style={[modalStyles.badge, { backgroundColor: C.backgroundTertiary }]}>
              <Ionicons name="time-outline" size={12} color={C.textMuted} />
              <Text style={modalStyles.badgeText}>{guide.duration}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[modalStyles.content, {
            paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40,
          }]}
          showsVerticalScrollIndicator={false}
        >
          {guide.steps.map((step, index) => (
            <Pressable
              key={index}
              style={modalStyles.stepCard}
              onPress={() => setExpandedStep(expandedStep === index ? null : index)}
            >
              <View style={modalStyles.stepHeader}>
                <View style={modalStyles.stepNumber}>
                  <Text style={modalStyles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={modalStyles.stepTitle}>{step.title}</Text>
                <Ionicons
                  name={expandedStep === index ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={C.textMuted}
                />
              </View>

              {expandedStep === index && (
                <View style={modalStyles.stepContent}>
                  <Text style={modalStyles.stepDescription}>{step.description}</Text>

                  <View style={modalStyles.tipsContainer}>
                    <View style={modalStyles.tipsHeader}>
                      <Ionicons name="checkmark-circle" size={16} color={C.tint} />
                      <Text style={modalStyles.tipsLabel}>Tips & Info</Text>
                    </View>
                    {step.tips.map((tip, i) => (
                      <View key={i} style={modalStyles.tipItem}>
                        <View style={modalStyles.tipBullet} />
                        <Text style={modalStyles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>

                  {step.warnings && step.warnings.length > 0 && (
                    <View style={modalStyles.warningsContainer}>
                      <View style={modalStyles.tipsHeader}>
                        <Ionicons name="warning" size={16} color={C.accent} />
                        <Text style={[modalStyles.tipsLabel, { color: C.accent }]}>Watch Out</Text>
                      </View>
                      {step.warnings.map((w, i) => (
                        <View key={i} style={modalStyles.tipItem}>
                          <View style={[modalStyles.tipBullet, { backgroundColor: C.accent }]} />
                          <Text style={[modalStyles.tipText, { color: C.textSecondary }]}>{w}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function GuidesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
          <Text style={styles.headerTitle}>Grow Guides</Text>
          <Text style={styles.headerSubtitle}>From seed to harvest — everything you need</Text>
        </LinearGradient>

        <View style={styles.content}>
          {GUIDES.map((guide) => (
            <Pressable
              key={guide.id}
              style={({ pressed }) => [styles.guideCard, pressed && styles.guideCardPressed]}
              onPress={() => setSelectedGuide(guide)}
            >
              <View style={[styles.guideIconWrap, { backgroundColor: guide.color + "18" }]}>
                <Ionicons name={guide.icon as any} size={28} color={guide.color} />
              </View>
              <View style={styles.guideInfo}>
                <View style={styles.guideTitleRow}>
                  <Text style={styles.guideTitle}>{guide.title}</Text>
                  <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[guide.difficulty] + "22" }]}>
                    <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[guide.difficulty] }]}>
                      {guide.difficulty}
                    </Text>
                  </View>
                </View>
                <Text style={styles.guideSubtitle}>{guide.subtitle}</Text>
                <View style={styles.guideMeta}>
                  <Ionicons name="time-outline" size={13} color={C.textMuted} />
                  <Text style={styles.guideMetaText}>{guide.duration}</Text>
                  <Text style={styles.guideSep}>·</Text>
                  <Text style={styles.guideMetaText}>{guide.steps.length} steps</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {selectedGuide && (
        <GuideModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 30,
    color: C.text,
  },
  headerSubtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 4,
  },
  content: { padding: 16, gap: 10 },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  guideCardPressed: { opacity: 0.75 },
  guideIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  guideInfo: { flex: 1 },
  guideTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  guideTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: C.text,
    flex: 1,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  diffText: { fontFamily: "Nunito_600SemiBold", fontSize: 10 },
  guideSubtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 6,
  },
  guideMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  guideMetaText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: C.textMuted,
  },
  guideSep: { color: C.textMuted, fontSize: 12 },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1 },
  modalHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  closeBtn: {
    alignSelf: "flex-end",
    padding: 4,
    marginBottom: 12,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  guideTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 22,
    color: C.text,
  },
  guideSubtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  metaRow: { flexDirection: "row", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: C.textMuted,
  },
  content: { padding: 16, gap: 10 },
  stepCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: "#fff",
  },
  stepTitle: {
    flex: 1,
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: C.text,
  },
  stepContent: {
    padding: 14,
    paddingTop: 0,
    gap: 14,
  },
  stepDescription: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 21,
  },
  tipsContainer: {
    backgroundColor: C.backgroundTertiary,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  tipsLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: C.tint,
  },
  tipItem: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.tint,
    marginTop: 7,
    flexShrink: 0,
  },
  tipText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: C.text,
    flex: 1,
    lineHeight: 19,
  },
  warningsContainer: {
    backgroundColor: C.accent + "11",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: C.accent + "33",
  },
});
