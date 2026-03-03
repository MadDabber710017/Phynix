import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, ImageSourcePropType } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

const C = Colors.dark;

interface VirtualPlantProps {
  stage: string;
  noteCount?: number;
  photoCount?: number;
  daysSinceLastLog?: number;
  recentLogCount?: number;
  daysRunning?: number;
  waterings?: number;
  nutrientFeedings?: number;
  transplants?: number;
  nodeCount?: number;
  budCount?: number;
  lightType?: string;
  tentSize?: string;
  medium?: string;
  fanType?: string;
  lightSchedule?: string;
  growEnvironment?: string;
  plantCount?: number;
  potType?: string;
}

const STAGE_IMAGES: Record<string, ImageSourcePropType> = {
  "Germination": require("@/assets/images/plant-stages/germination.png"),
  "Seedling": require("@/assets/images/plant-stages/seedling.png"),
  "Early Vegetative": require("@/assets/images/plant-stages/early-veg.png"),
  "Late Vegetative": require("@/assets/images/plant-stages/late-veg.png"),
  "Pre-Flower": require("@/assets/images/plant-stages/pre-flower.png"),
  "Early Flower": require("@/assets/images/plant-stages/early-flower.png"),
  "Mid Flower": require("@/assets/images/plant-stages/mid-flower.png"),
  "Late Flower": require("@/assets/images/plant-stages/late-flower.png"),
  "Harvest Ready": require("@/assets/images/plant-stages/harvest-ready.png"),
  "Harvested": require("@/assets/images/plant-stages/drying.png"),
  "Curing": require("@/assets/images/plant-stages/drying.png"),
  "Done": require("@/assets/images/plant-stages/drying.png"),
};

const ENV_IMAGES: Record<string, ImageSourcePropType> = {
  "indoor tent": require("@/assets/images/environments/indoor-tent.png"),
  "indoor room": require("@/assets/images/environments/indoor-room.png"),
  "closet": require("@/assets/images/environments/closet.png"),
  "window sill": require("@/assets/images/environments/window-sill.png"),
  "balcony": require("@/assets/images/environments/balcony.png"),
  "outdoor garden": require("@/assets/images/environments/outdoor-garden.png"),
  "outdoor field": require("@/assets/images/environments/outdoor-field.png"),
  "greenhouse": require("@/assets/images/environments/greenhouse.png"),
};

const STAGE_INDEX: Record<string, number> = {
  "Germination": 0, "Seedling": 1, "Early Vegetative": 2, "Late Vegetative": 3,
  "Pre-Flower": 4, "Early Flower": 5, "Mid Flower": 6, "Late Flower": 7,
  "Harvest Ready": 8, "Harvested": 9, "Curing": 9, "Done": 9,
};

const STAGE_COLORS: Record<string, string> = {
  "Germination": "#42a5f5", "Seedling": "#81c784", "Early Vegetative": "#66bb6a",
  "Late Vegetative": "#4caf50", "Pre-Flower": "#ffa726", "Early Flower": "#ab47bc",
  "Mid Flower": "#9c27b0", "Late Flower": "#7b1fa2", "Harvest Ready": "#ef5350",
  "Harvested": "#78909c", "Curing": "#8d6e63", "Done": "#546e7a",
};

function getHealthInfo(daysSinceLastLog: number, recentLogCount: number): { icon: string; label: string; color: string } {
  if (daysSinceLastLog <= 2 && recentLogCount >= 2) return { icon: "happy-outline", label: "Thriving", color: "#4caf50" };
  if (daysSinceLastLog <= 5) return { icon: "happy-outline", label: "Healthy", color: "#66bb6a" };
  if (daysSinceLastLog <= 10) return { icon: "sad-outline", label: "Needs Care", color: "#ffa726" };
  return { icon: "sad-outline", label: "Wilting", color: "#ef5350" };
}

function PulsingGlow({ color, size }: { color: string; size: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      top: -size / 4,
      alignSelf: "center",
    }, animStyle]} />
  );
}

function FloatingParticle({ x, y, delay: d, color }: { x: number; y: number; delay: number; color: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(d,
      withRepeat(withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true)
    );
    opacity.value = withDelay(d,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1, true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: "absolute",
      left: x,
      top: y,
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: color,
    }, animStyle]} />
  );
}

function PlantBreathAnim({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.98, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

export default function VirtualPlant({
  stage,
  noteCount = 0,
  photoCount = 0,
  daysSinceLastLog = 0,
  recentLogCount = 0,
  daysRunning = 0,
  waterings = 0,
  nutrientFeedings = 0,
  transplants = 0,
  nodeCount = 0,
  budCount = 0,
  lightType,
  tentSize,
  medium,
  fanType,
  lightSchedule,
  growEnvironment,
  plantCount = 1,
  potType,
}: VirtualPlantProps) {
  const stageIdx = STAGE_INDEX[stage] ?? 2;
  const health = getHealthInfo(daysSinceLastLog ?? 0, recentLogCount ?? 0);
  const stageColor = STAGE_COLORS[stage] || C.tint;

  const envKey = (growEnvironment || "").toLowerCase();
  const envImage = ENV_IMAGES[envKey];
  const plantImage = STAGE_IMAGES[stage] || STAGE_IMAGES["Seedling"];

  const isDrying = stage === "Harvested" || stage === "Curing" || stage === "Done";
  const isOutdoor = envKey.includes("outdoor") || envKey.includes("balcony") || envKey.includes("window");

  const plantSize = stageIdx <= 0 ? 80 : stageIdx <= 1 ? 100 : stageIdx <= 3 ? 140 : stageIdx <= 6 ? 170 : 190;

  return (
    <View style={styles.wrapper}>
      <View style={styles.sceneContainer}>
        {envImage ? (
          <Image source={envImage} style={styles.envBackground} resizeMode="cover" />
        ) : (
          <View style={styles.defaultBg} />
        )}

        <View style={styles.overlay} />

        {lightSchedule && (
          <View style={styles.scheduleBadge}>
            <Ionicons name={isOutdoor ? "sunny" : "bulb"} size={10} color="#ffd54f" />
            <Text style={styles.scheduleText}>{lightSchedule}</Text>
          </View>
        )}

        {plantCount > 1 && (
          <View style={styles.plantCountBadge}>
            <Ionicons name="leaf" size={10} color="#81c784" />
            <Text style={styles.plantCountText}>{plantCount}x</Text>
          </View>
        )}

        {medium && (
          <View style={styles.mediumBadge}>
            <Text style={styles.mediumText}>{medium}</Text>
          </View>
        )}

        <PulsingGlow color={stageColor} size={plantSize + 40} />

        {stageIdx >= 5 && (
          <>
            <FloatingParticle x={60} y={40} delay={0} color="#ffffff88" />
            <FloatingParticle x={120} y={60} delay={500} color="#ffffff66" />
            <FloatingParticle x={90} y={30} delay={1000} color="#ffffff55" />
            <FloatingParticle x={150} y={50} delay={1500} color="#ffffff44" />
          </>
        )}

        <PlantBreathAnim>
          <Image
            source={plantImage}
            style={[styles.plantImage, {
              width: plantSize,
              height: plantSize,
            }]}
            resizeMode="contain"
          />
        </PlantBreathAnim>
      </View>

      <View style={styles.infoBar}>
        <View style={styles.infoLeft}>
          <View style={[styles.stageDot, { backgroundColor: stageColor }]} />
          <Text style={styles.stageLabel}>{stage}</Text>
        </View>
        <View style={styles.infoRight}>
          <Ionicons name={health.icon as any} size={16} color={health.color} />
          <Text style={[styles.healthLabel, { color: health.color }]}>{health.label}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
          <Text style={styles.statValue}>{daysRunning}d</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="water-outline" size={14} color="#42a5f5" />
          <Text style={styles.statValue}>{waterings}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flask-outline" size={14} color="#ab47bc" />
          <Text style={styles.statValue}>{nutrientFeedings}</Text>
        </View>
        {nodeCount > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="git-branch-outline" size={14} color="#66bb6a" />
            <Text style={styles.statValue}>{nodeCount}</Text>
          </View>
        )}
        {budCount > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="flower-outline" size={14} color="#ce93d8" />
            <Text style={styles.statValue}>{budCount}</Text>
          </View>
        )}
        {transplants > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="resize-outline" size={14} color="#8d6e63" />
            <Text style={styles.statValue}>{transplants}</Text>
          </View>
        )}
      </View>

      {growEnvironment && (
        <View style={styles.envLabel}>
          <Ionicons
            name={isOutdoor ? "sunny-outline" : envKey.includes("tent") ? "cube-outline" : envKey.includes("greenhouse") ? "leaf-outline" : "home-outline"}
            size={12}
            color={C.textMuted}
          />
          <Text style={styles.envText}>{growEnvironment}</Text>
          {tentSize ? <Text style={styles.envText}> | {tentSize}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#0d1a0e",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1a2e1b",
  },
  sceneContainer: {
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  envBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  defaultBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0a130b",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  plantImage: {
    zIndex: 10,
  },
  scheduleBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 20,
  },
  scheduleText: {
    color: "#ffd54f",
    fontSize: 11,
    fontFamily: "Nunito_700Bold",
  },
  plantCountBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 20,
  },
  plantCountText: {
    color: "#81c784",
    fontSize: 11,
    fontFamily: "Nunito_700Bold",
  },
  mediumBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 20,
  },
  mediumText: {
    color: "#a5d6a7",
    fontSize: 10,
    fontFamily: "Nunito_600SemiBold",
  },
  infoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stageLabel: {
    color: C.text,
    fontSize: 15,
    fontFamily: "Nunito_700Bold",
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  healthLabel: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: C.textSecondary,
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
  },
  envLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  envText: {
    color: C.textMuted,
    fontSize: 11,
    fontFamily: "Nunito_600SemiBold",
  },
});
