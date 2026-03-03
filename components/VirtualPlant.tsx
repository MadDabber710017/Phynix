import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
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
  noteCount: number;
  photoCount: number;
  daysSinceLastLog: number;
  recentLogCount: number;
  daysRunning: number;
}

const STAGE_INDEX: Record<string, number> = {
  "Germination": 0,
  "Seedling": 1,
  "Early Vegetative": 2,
  "Late Vegetative": 3,
  "Pre-Flower": 4,
  "Early Flower": 5,
  "Mid Flower": 6,
  "Late Flower": 7,
  "Harvest Ready": 8,
  "Harvested": 9,
  "Curing": 9,
  "Done": 9,
};

function getHealthColor(daysSinceLastLog: number, recentLogCount: number): string {
  if (daysSinceLastLog <= 1 && recentLogCount >= 3) return "#4caf50";
  if (daysSinceLastLog <= 3 && recentLogCount >= 1) return "#66bb6a";
  if (daysSinceLastLog <= 7) return "#aed581";
  if (daysSinceLastLog <= 14) return "#dce775";
  return "#ffb74d";
}

function getHealthFace(daysSinceLastLog: number, recentLogCount: number): { icon: string; label: string; color: string } {
  if (daysSinceLastLog <= 2 && recentLogCount >= 2) return { icon: "happy-outline", label: "Thriving", color: "#4caf50" };
  if (daysSinceLastLog <= 5) return { icon: "happy-outline", label: "Healthy", color: "#66bb6a" };
  if (daysSinceLastLog <= 10) return { icon: "sad-outline", label: "Needs Care", color: "#ffa726" };
  return { icon: "sad-outline", label: "Wilting", color: "#ef5350" };
}

function getDroopAngle(daysSinceLastLog: number): number {
  if (daysSinceLastLog <= 2) return 0;
  if (daysSinceLastLog <= 5) return 5;
  if (daysSinceLastLog <= 10) return 12;
  return 20;
}

function Sparkle({ x, y, delay: d }: { x: number; y: number; delay: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      d,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[sparkStyles.sparkle, { left: x, top: y }, style]}>
      <View style={sparkStyles.sparkleInner} />
    </Animated.View>
  );
}

function Leaf({ side, yOffset, size, color, droop }: { side: "left" | "right"; yOffset: number; size: number; color: string; droop: number }) {
  const sway = useSharedValue(0);

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(side === "left" ? -3 : 3, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(side === "left" ? 3 : -3, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const baseAngle = side === "left" ? -35 - droop : 35 + droop;

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${baseAngle + sway.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size * 0.55,
          borderRadius: size * 0.3,
          backgroundColor: color,
          bottom: yOffset,
          [side]: -size * 0.3,
        },
        style,
      ]}
    />
  );
}

function FlowerBud({ x, y, color, size }: { x: number; y: number; color: string; size: number }) {
  const scale = useSharedValue(0.9);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function TrichomeDot({ x, y }: { x: number; y: number }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 + Math.random() * 600 }),
        withTiming(0.4, { duration: 800 + Math.random() * 600 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: "#ffab00",
        },
        style,
      ]}
    />
  );
}

export default function VirtualPlant({ stage, noteCount, photoCount, daysSinceLastLog, recentLogCount, daysRunning }: VirtualPlantProps) {
  const stageIdx = STAGE_INDEX[stage] ?? 2;
  const healthColor = getHealthColor(daysSinceLastLog, recentLogCount);
  const health = getHealthFace(daysSinceLastLog, recentLogCount);
  const droop = getDroopAngle(daysSinceLastLog);

  const leafCount = Math.min(12, 2 + Math.floor(noteCount / 3));
  const leafSize = 14 + Math.min(stageIdx * 3, 18);

  const stemHeight = stageIdx <= 0 ? 0 : Math.min(90, 10 + stageIdx * 12);
  const stemWidth = Math.min(8, 2 + stageIdx);

  const showFlowers = stageIdx >= 5;
  const showTrichomes = stageIdx >= 8;
  const showSparkles = photoCount > 0;
  const sparkleCount = Math.min(5, photoCount);

  const plantSway = useSharedValue(0);

  useEffect(() => {
    plantSway.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-2, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const plantSwayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${plantSway.value}deg` }],
  }));

  const renderSeedStage = () => (
    <View style={vpStyles.seedContainer}>
      <View style={[vpStyles.soilMound, { backgroundColor: "#5d4037" }]} />
      <View style={[vpStyles.seed, { backgroundColor: "#8d6e63" }]} />
    </View>
  );

  const renderPlant = () => {
    const leaves: React.ReactNode[] = [];
    const visibleLeaves = stageIdx <= 1 ? Math.min(2, leafCount) : leafCount;

    for (let i = 0; i < visibleLeaves; i++) {
      const side = i % 2 === 0 ? "left" : "right";
      const yOff = 10 + (i * stemHeight) / (visibleLeaves + 1);
      const sz = leafSize - (i % 3) * 2;
      leaves.push(
        <Leaf
          key={`leaf-${i}`}
          side={side as "left" | "right"}
          yOffset={yOff}
          size={sz}
          color={healthColor}
          droop={droop}
        />
      );
    }

    return (
      <Animated.View style={[vpStyles.plantBody, plantSwayStyle]}>
        <View
          style={[
            vpStyles.stem,
            {
              height: stemHeight,
              width: stemWidth,
              backgroundColor: stageIdx >= 8 ? "#6d4c41" : healthColor,
              borderRadius: stemWidth / 2,
            },
          ]}
        >
          {leaves}

          {showFlowers && (
            <>
              <FlowerBud x={-8} y={-4} color="#ce93d8" size={10} />
              <FlowerBud x={stemWidth} y={2} color="#ba68c8" size={8} />
              {stageIdx >= 6 && <FlowerBud x={-12} y={stemHeight * 0.3} color="#ab47bc" size={12} />}
              {stageIdx >= 7 && <FlowerBud x={stemWidth + 2} y={stemHeight * 0.2} color="#9c27b0" size={11} />}
              {stageIdx >= 7 && <FlowerBud x={-6} y={stemHeight * 0.5} color="#ce93d8" size={9} />}
            </>
          )}

          {showTrichomes && (
            <>
              <TrichomeDot x={-4} y={2} />
              <TrichomeDot x={stemWidth + 1} y={8} />
              <TrichomeDot x={-7} y={stemHeight * 0.35} />
              <TrichomeDot x={stemWidth + 4} y={stemHeight * 0.25} />
              <TrichomeDot x={-2} y={stemHeight * 0.55} />
              <TrichomeDot x={stemWidth + 2} y={stemHeight * 0.45} />
            </>
          )}
        </View>

        <View style={vpStyles.soilLine} />
      </Animated.View>
    );
  };

  const sparkles: React.ReactNode[] = [];
  if (showSparkles) {
    const sparkPositions = [
      { x: 15, y: 10 },
      { x: 85, y: 20 },
      { x: 25, y: 55 },
      { x: 80, y: 65 },
      { x: 50, y: 8 },
    ];
    for (let i = 0; i < sparkleCount; i++) {
      sparkles.push(
        <Sparkle key={`sp-${i}`} x={sparkPositions[i].x} y={sparkPositions[i].y} delay={i * 400} />
      );
    }
  }

  return (
    <View style={vpStyles.card}>
      <View style={vpStyles.plantScene}>
        <View style={vpStyles.pot}>
          <View style={vpStyles.potRim} />
          <View style={vpStyles.potBody} />
          <View style={vpStyles.potSoil} />
        </View>

        <View style={vpStyles.plantArea}>
          {stageIdx === 0 ? renderSeedStage() : renderPlant()}
        </View>

        {sparkles}
      </View>

      <View style={vpStyles.infoRow}>
        <View style={vpStyles.healthBadge}>
          <Ionicons name={health.icon as any} size={16} color={health.color} />
          <Text style={[vpStyles.healthText, { color: health.color }]}>{health.label}</Text>
        </View>

        <View style={vpStyles.statsRow}>
          <View style={vpStyles.miniStat}>
            <Ionicons name="document-text-outline" size={12} color={C.textMuted} />
            <Text style={vpStyles.miniStatText}>{noteCount}</Text>
          </View>
          <View style={vpStyles.miniStat}>
            <Ionicons name="camera-outline" size={12} color={C.textMuted} />
            <Text style={vpStyles.miniStatText}>{photoCount}</Text>
          </View>
          <View style={vpStyles.miniStat}>
            <Ionicons name="calendar-outline" size={12} color={C.textMuted} />
            <Text style={vpStyles.miniStatText}>Day {daysRunning}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const sparkStyles = StyleSheet.create({
  sparkle: {
    position: "absolute",
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ffd54f",
    shadowColor: "#ffd54f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});

const vpStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
    gap: 12,
  },
  plantScene: {
    height: 140,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
  },
  pot: {
    alignItems: "center",
    position: "absolute",
    bottom: 0,
  },
  potRim: {
    width: 60,
    height: 6,
    backgroundColor: "#8d6e63",
    borderRadius: 3,
    zIndex: 2,
  },
  potBody: {
    width: 52,
    height: 32,
    backgroundColor: "#6d4c41",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -1,
  },
  potSoil: {
    position: "absolute",
    top: 2,
    width: 50,
    height: 8,
    backgroundColor: "#3e2723",
    borderRadius: 4,
    zIndex: 3,
  },
  plantArea: {
    position: "absolute",
    bottom: 36,
    alignItems: "center",
  },
  seedContainer: {
    alignItems: "center",
  },
  soilMound: {
    width: 24,
    height: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginTop: -2,
  },
  seed: {
    width: 10,
    height: 12,
    borderRadius: 5,
    marginTop: -8,
  },
  plantBody: {
    alignItems: "center",
    transformOrigin: "bottom center",
  },
  stem: {
    position: "relative",
  },
  soilLine: {
    width: 30,
    height: 4,
    backgroundColor: "#3e2723",
    borderRadius: 2,
    marginTop: -2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.backgroundTertiary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  healthText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  miniStatText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: C.textMuted,
  },
});
