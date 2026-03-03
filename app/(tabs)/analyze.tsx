import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";
import { addXP } from "@/lib/gamification";

const C = Colors.dark;

interface NutrientStatus {
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  overall: string;
}

interface Issue {
  name: string;
  severity: "Low" | "Medium" | "High";
  description: string;
  fix: string;
}

interface PlantAnalysis {
  overallHealth: string;
  healthScore: number;
  growthStage: string;
  stageWeeksEstimate: string;
  estimatedWeeksToHarvest: string | null;
  observations: string[];
  issues: Issue[];
  positives: string[];
  recommendations: string[];
  nutrientStatus: NutrientStatus;
  environmentHints: string;
  funFact: string;
}

const HEALTH_COLORS: Record<string, string> = {
  Excellent: "#66bb6a",
  Good: "#4caf50",
  Fair: "#ffa726",
  Poor: "#ef5350",
  Critical: "#b71c1c",
  Unknown: "#78909c",
};

const SEVERITY_COLORS: Record<string, string> = {
  Low: "#66bb6a",
  Medium: "#ffa726",
  High: "#ef5350",
};

const NUTRIENT_COLORS: Record<string, string> = {
  Deficient: "#ef5350",
  Low: "#ffa726",
  Optimal: "#66bb6a",
  High: "#ab47bc",
  Excess: "#b71c1c",
};

function HealthBar({ score }: { score: number }) {
  const color = score >= 75 ? "#66bb6a" : score >= 50 ? "#ffa726" : "#ef5350";
  return (
    <View style={hbStyles.container}>
      <View style={hbStyles.track}>
        <View style={[hbStyles.fill, { width: `${score}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[hbStyles.score, { color }]}>{score}/100</Text>
    </View>
  );
}

const hbStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 10 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.backgroundTertiary },
  fill: { height: 8, borderRadius: 4 },
  score: { fontFamily: "Nunito_700Bold", fontSize: 14, minWidth: 50 },
});


export default function AnalyzeScreen() {
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PlantAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow photo library access to analyze your plants.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        base64: true,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 ?? null);
        setAnalysis(null);
        setError(null);
      }
    } catch (err) {
      console.error("Pick image error:", err);
      Alert.alert("Error", "Failed to open photo library.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow camera access to photograph your plants.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: true,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 ?? null);
        setAnalysis(null);
        setError(null);
      }
    } catch (err) {
      console.error("Take photo error:", err);
      Alert.alert("Error", "Failed to open camera.");
    }
  };

  const analyzeImage = async () => {
    if (!image || !imageBase64) return;
    setLoading(true);
    setError(null);

    try {
      const url = new URL("/api/analyze-plant", getApiUrl());

      const res = await globalThis.fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageBase64 }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setAnalysis(data);
      addXP(15, "totalAnalyses").catch(() => {});
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err?.message || "Failed to analyze plant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const healthColor = analysis ? (HEALTH_COLORS[analysis.overallHealth] || C.tint) : C.tint;

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
          <Text style={styles.headerTitle}>Plant Analyzer</Text>
          <Text style={styles.headerSub}>AI-powered diagnosis and growth insights</Text>
        </LinearGradient>

        <View style={styles.content}>
          {!image ? (
            <View style={styles.uploadArea}>
              <View style={styles.uploadIcon}>
                <Ionicons name="camera-outline" size={48} color={C.textMuted} />
              </View>
              <Text style={styles.uploadTitle}>Analyze Your Plant</Text>
              <Text style={styles.uploadText}>
                Take or upload a clear photo of your cannabis plant. Our AI will analyze its health, growth stage, nutrient status, and give personalized recommendations.
              </Text>
              <View style={styles.uploadBtns}>
                <Pressable style={styles.uploadBtn} onPress={takePhoto}>
                  <LinearGradient colors={["#1a3d1c", "#162318"]} style={styles.uploadBtnGrad}>
                    <Ionicons name="camera" size={22} color={C.tint} />
                    <Text style={styles.uploadBtnText}>Take Photo</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable style={styles.uploadBtn} onPress={pickImage}>
                  <LinearGradient colors={["#1a3d1c", "#162318"]} style={styles.uploadBtnGrad}>
                    <Ionicons name="image" size={22} color={C.tint} />
                    <Text style={styles.uploadBtnText}>Pick Photo</Text>
                  </LinearGradient>
                </Pressable>
              </View>
              <View style={styles.tipsBox}>
                <Text style={styles.tipsBold}>Tips for best results:</Text>
                <Text style={styles.tipsItem}>Good lighting, natural light is best</Text>
                <Text style={styles.tipsItem}>Get close enough to see leaf detail</Text>
                <Text style={styles.tipsItem}>Show both top and underside if possible</Text>
                <Text style={styles.tipsItem}>Include problem areas in the frame</Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.plantImage} resizeMode="cover" />
                <Pressable style={styles.changeBtn} onPress={() => { setImage(null); setImageBase64(null); setAnalysis(null); setError(null); }}>
                  <Ionicons name="close-circle" size={28} color="#fff" />
                </Pressable>
              </View>

              <View style={styles.actionRow}>
                <Pressable style={[styles.actionBtn, styles.secondaryBtn]} onPress={pickImage}>
                  <Ionicons name="image" size={18} color={C.textSecondary} />
                  <Text style={styles.secondaryBtnText}>Change</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.primaryBtn]} onPress={analyzeImage} disabled={loading}>
                  <LinearGradient colors={["#4caf50", "#2e7d32"]} style={styles.primaryBtnGrad}>
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Ionicons name="search" size={18} color="#fff" />
                    )}
                    <Text style={styles.primaryBtnText}>{loading ? "Analyzing..." : "Analyze Plant"}</Text>
                  </LinearGradient>
                </Pressable>
              </View>

              {loading && (
                <View style={styles.loadingCard}>
                  <ActivityIndicator color={C.tint} size="large" />
                  <Text style={styles.loadingText}>Analyzing your plant...</Text>
                  <Text style={styles.loadingSubText}>Checking health, stage, nutrients, and more</Text>
                </View>
              )}

              {error && (
                <View style={styles.errorCard}>
                  <Ionicons name="alert-circle" size={24} color={C.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable style={styles.retryBtn} onPress={analyzeImage}>
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              )}

              {analysis && !loading && (
                <View style={styles.analysisContainer}>
                  <View style={[styles.healthHeader, { borderColor: healthColor + "44" }]}>
                    <LinearGradient colors={[healthColor + "22", "transparent"]} style={styles.healthHeaderGrad}>
                      <View style={styles.healthRow}>
                        <View>
                          <Text style={styles.healthLabel}>Overall Health</Text>
                          <Text style={[styles.healthValue, { color: healthColor }]}>{analysis.overallHealth}</Text>
                        </View>
                        <View style={[styles.healthBadge, { backgroundColor: healthColor + "22" }]}>
                          <Ionicons name="leaf" size={24} color={healthColor} />
                        </View>
                      </View>
                      <HealthBar score={analysis.healthScore} />
                    </LinearGradient>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoCard}>
                      <Ionicons name="time-outline" size={18} color={C.tint} />
                      <Text style={styles.infoLabel}>Stage</Text>
                      <Text style={styles.infoValue}>{analysis.growthStage}</Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Ionicons name="calendar-outline" size={18} color={C.accent} />
                      <Text style={styles.infoLabel}>Into Stage</Text>
                      <Text style={styles.infoValue}>{analysis.stageWeeksEstimate}</Text>
                    </View>
                    {analysis.estimatedWeeksToHarvest && (
                      <View style={styles.infoCard}>
                        <Ionicons name="cut-outline" size={18} color="#ab47bc" />
                        <Text style={styles.infoLabel}>To Harvest</Text>
                        <Text style={styles.infoValue}>{analysis.estimatedWeeksToHarvest}w</Text>
                      </View>
                    )}
                  </View>

                  {analysis.observations.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>What I See</Text>
                      {analysis.observations.map((obs, i) => (
                        <View key={i} style={styles.obsItem}>
                          <Ionicons name="eye-outline" size={15} color={C.tint} />
                          <Text style={styles.obsText}>{obs}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {analysis.positives.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Looking Good</Text>
                      <View style={styles.positiveBox}>
                        {analysis.positives.map((p, i) => (
                          <View key={i} style={styles.positiveItem}>
                            <Ionicons name="checkmark-circle" size={16} color={C.success} />
                            <Text style={styles.positiveText}>{p}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {analysis.issues.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Issues Detected</Text>
                      {analysis.issues.map((issue, i) => (
                        <View key={i} style={[styles.issueCard, { borderLeftColor: SEVERITY_COLORS[issue.severity] }]}>
                          <View style={styles.issueHeader}>
                            <Text style={styles.issueName}>{issue.name}</Text>
                            <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[issue.severity] + "22" }]}>
                              <Text style={[styles.severityText, { color: SEVERITY_COLORS[issue.severity] }]}>{issue.severity}</Text>
                            </View>
                          </View>
                          <Text style={styles.issueDesc}>{issue.description}</Text>
                          <View style={styles.fixBox}>
                            <Ionicons name="build-outline" size={13} color={C.accent} />
                            <Text style={styles.fixText}>{issue.fix}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nutrient Status</Text>
                    <View style={styles.nutrientBox}>
                      {[
                        { name: "Nitrogen (N)", value: analysis.nutrientStatus.nitrogen },
                        { name: "Phosphorus (P)", value: analysis.nutrientStatus.phosphorus },
                        { name: "Potassium (K)", value: analysis.nutrientStatus.potassium },
                      ].map((n) => (
                        <View key={n.name} style={styles.nutrientRow}>
                          <Text style={styles.nutrientName}>{n.name}</Text>
                          <View style={[styles.nutrientPill, { backgroundColor: (NUTRIENT_COLORS[n.value] || C.tint) + "22" }]}>
                            <Text style={[styles.nutrientValue, { color: NUTRIENT_COLORS[n.value] || C.tint }]}>{n.value}</Text>
                          </View>
                        </View>
                      ))}
                      <Text style={styles.nutrientSummary}>{analysis.nutrientStatus.overall}</Text>
                    </View>
                  </View>

                  {analysis.recommendations.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Recommendations</Text>
                      <View style={styles.recBox}>
                        {analysis.recommendations.map((r, i) => (
                          <View key={i} style={styles.recItem}>
                            <View style={styles.recNum}>
                              <Text style={styles.recNumText}>{i + 1}</Text>
                            </View>
                            <Text style={styles.recText}>{r}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {analysis.environmentHints && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Environment Clues</Text>
                      <View style={styles.envHintBox}>
                        <Ionicons name="home-outline" size={18} color={C.tint} />
                        <Text style={styles.envHintText}>{analysis.environmentHints}</Text>
                      </View>
                    </View>
                  )}

                  {analysis.funFact && (
                    <View style={styles.funFactCard}>
                      <LinearGradient colors={["#1a3d1c", "#162318"]} style={styles.funFactGrad}>
                        <View style={styles.funFactHeader}>
                          <Ionicons name="bulb" size={18} color={C.accent} />
                          <Text style={styles.funFactLabel}>Grow Fact</Text>
                        </View>
                        <Text style={styles.funFactText}>{analysis.funFact}</Text>
                      </LinearGradient>
                    </View>
                  )}

                  <Pressable
                    style={styles.newAnalysisBtn}
                    onPress={() => { setImage(null); setImageBase64(null); setAnalysis(null); setError(null); }}
                  >
                    <Ionicons name="camera-outline" size={18} color={C.textSecondary} />
                    <Text style={styles.newAnalysisBtnText}>Analyze Another Plant</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 30, color: C.text },
  headerSub: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, marginTop: 4 },
  content: { padding: 16, gap: 16 },
  uploadArea: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 24,
  },
  uploadIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  uploadTitle: { fontFamily: "Nunito_700Bold", fontSize: 20, color: C.text },
  uploadText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  uploadBtns: { flexDirection: "row", gap: 12, width: "100%" },
  uploadBtn: { flex: 1, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  uploadBtnGrad: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  uploadBtnText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.text },
  tipsBox: {
    width: "100%",
    backgroundColor: C.backgroundTertiary,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  tipsBold: { fontFamily: "Nunito_700Bold", fontSize: 13, color: C.textSecondary, marginBottom: 4 },
  tipsItem: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textMuted },
  imageContainer: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  plantImage: { width: "100%", height: 280, borderRadius: 20 },
  changeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
  },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.card,
    paddingVertical: 14,
    borderRadius: 14,
  },
  secondaryBtnText: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.textSecondary },
  primaryBtn: { borderRadius: 14, overflow: "hidden" },
  primaryBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  primaryBtnText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: "#fff" },
  loadingCard: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 32,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  loadingText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text },
  loadingSubText: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary },
  errorCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: C.danger + "18",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.danger + "44",
    flexWrap: "wrap",
  },
  errorText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.danger, flex: 1 },
  retryBtn: { backgroundColor: C.danger + "22", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  retryText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.danger },
  analysisContainer: { gap: 16 },
  healthHeader: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  healthHeaderGrad: { padding: 16 },
  healthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  healthLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted, marginBottom: 2 },
  healthValue: { fontFamily: "Nunito_800ExtraBold", fontSize: 24 },
  healthBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  infoRow: { flexDirection: "row", gap: 10 },
  infoCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "center",
  },
  infoLabel: { fontFamily: "Nunito_400Regular", fontSize: 11, color: C.textMuted },
  infoValue: { fontFamily: "Nunito_700Bold", fontSize: 13, color: C.text, textAlign: "center" },
  section: { gap: 10 },
  sectionTitle: { fontFamily: "Nunito_700Bold", fontSize: 17, color: C.text },
  obsItem: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  obsText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, flex: 1, lineHeight: 20 },
  positiveBox: {
    backgroundColor: C.success + "11",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.success + "33",
    gap: 8,
  },
  positiveItem: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  positiveText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.text, flex: 1 },
  issueCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderLeftWidth: 3,
    gap: 8,
  },
  issueHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  issueName: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text, flex: 1 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  severityText: { fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  issueDesc: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, lineHeight: 19 },
  fixBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: C.backgroundTertiary,
    borderRadius: 10,
    padding: 10,
  },
  fixText: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.accent, flex: 1, lineHeight: 18 },
  nutrientBox: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 10,
  },
  nutrientRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nutrientName: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.text },
  nutrientPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  nutrientValue: { fontFamily: "Nunito_700Bold", fontSize: 12 },
  nutrientSummary: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, lineHeight: 19, marginTop: 2 },
  recBox: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 12,
  },
  recItem: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  recNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" },
  recNumText: { fontFamily: "Nunito_700Bold", fontSize: 12, color: "#fff" },
  recText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, flex: 1, lineHeight: 20 },
  envHintBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  envHintText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, flex: 1, lineHeight: 20 },
  funFactCard: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  funFactGrad: { padding: 16, gap: 8 },
  funFactHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  funFactLabel: { fontFamily: "Nunito_700Bold", fontSize: 12, color: C.accent, textTransform: "uppercase" as const, letterSpacing: 0.5 },
  funFactText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.text, lineHeight: 21 },
  newAnalysisBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  newAnalysisBtnText: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.textSecondary },
});
