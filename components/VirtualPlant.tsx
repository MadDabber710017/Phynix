import React, { useEffect, useMemo } from "react";
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

function CannabisLeaflet({ angle, length, width, color }: { angle: number; length: number; width: number; color: string }) {
  return (
    <View
      style={{
        position: "absolute",
        width: width,
        height: length,
        backgroundColor: color,
        borderRadius: width / 2,
        borderTopLeftRadius: width * 0.3,
        borderTopRightRadius: width * 0.3,
        transform: [{ rotate: `${angle}deg` }],
        transformOrigin: "bottom center",
        bottom: 0,
      }}
    />
  );
}

function CannabisLeaf({
  side,
  yOffset,
  fingerCount,
  size,
  color,
  droop,
}: {
  side: "left" | "right";
  yOffset: number;
  fingerCount: number;
  size: number;
  color: string;
  droop: number;
}) {
  const sway = useSharedValue(0);

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(side === "left" ? -4 : 4, { duration: 2200 + Math.random() * 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(side === "left" ? 4 : -4, { duration: 2200 + Math.random() * 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const baseAngle = side === "left" ? -40 - droop : 40 + droop;

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${baseAngle + sway.value}deg` }],
  }));

  const leafletLength = size * 0.7;
  const leafletWidth = size * 0.12;
  const half = Math.floor(fingerCount / 2);

  const leaflets = useMemo(() => {
    const items: React.ReactNode[] = [];
    items.push(
      <CannabisLeaflet key="center" angle={0} length={leafletLength} width={leafletWidth * 1.1} color={color} />
    );
    for (let i = 1; i <= half; i++) {
      const spreadAngle = i * (55 / half);
      const lenFactor = 1 - i * 0.15;
      items.push(
        <CannabisLeaflet key={`l${i}`} angle={-spreadAngle} length={leafletLength * lenFactor} width={leafletWidth} color={color} />
      );
      items.push(
        <CannabisLeaflet key={`r${i}`} angle={spreadAngle} length={leafletLength * lenFactor} width={leafletWidth} color={color} />
      );
    }
    return items;
  }, [fingerCount, leafletLength, leafletWidth, color, half]);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size * 0.8,
          alignItems: "center",
          justifyContent: "flex-end",
          bottom: yOffset,
          [side]: -size * 0.35,
        },
        style,
      ]}
    >
      {leaflets}
      <View style={{ width: 2, height: size * 0.25, backgroundColor: color, opacity: 0.7, borderRadius: 1 }} />
    </Animated.View>
  );
}

function CotyledonLeaf({ side, droop }: { side: "left" | "right"; droop: number }) {
  const sway = useSharedValue(0);

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(side === "left" ? -3 : 3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(side === "left" ? 3 : -3, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const baseAngle = side === "left" ? -50 - droop : 50 + droop;

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${baseAngle + sway.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 10,
          height: 14,
          borderRadius: 5,
          backgroundColor: "#81c784",
          bottom: 6,
          [side]: -6,
        },
        style,
      ]}
    />
  );
}

function BudCluster({
  x,
  y,
  size,
  stageIdx,
  hasTrichomes,
}: {
  x: number;
  y: number;
  size: number;
  stageIdx: number;
  hasTrichomes: boolean;
}) {
  const scale = useSharedValue(0.92);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.92, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const budColor = stageIdx >= 8 ? "#2e7d32" : stageIdx >= 7 ? "#388e3c" : "#43a047";
  const pistilColor = stageIdx >= 7 ? "#d4845a" : "#e8b4b8";
  const showHeavyTrichomes = stageIdx >= 7;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size * 1.3,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <View style={{ width: size * 0.8, height: size, borderRadius: size * 0.35, backgroundColor: budColor }} />
      <View style={{ position: "absolute", width: size * 0.5, height: size * 0.7, borderRadius: size * 0.2, backgroundColor: "#2e7d32", opacity: 0.6 }} />

      <View style={{ position: "absolute", top: -2, left: size * 0.2, width: 1, height: 5, backgroundColor: pistilColor, transform: [{ rotate: "-20deg" }] }} />
      <View style={{ position: "absolute", top: -1, right: size * 0.2, width: 1, height: 5, backgroundColor: pistilColor, transform: [{ rotate: "15deg" }] }} />
      <View style={{ position: "absolute", top: 1, left: size * 0.1, width: 1, height: 4, backgroundColor: pistilColor, transform: [{ rotate: "-35deg" }] }} />

      {stageIdx >= 6 && (
        <>
          <View style={{ position: "absolute", top: size * 0.3, right: -1, width: 1, height: 4, backgroundColor: pistilColor, transform: [{ rotate: "25deg" }] }} />
          <View style={{ position: "absolute", bottom: 2, left: size * 0.15, width: 1, height: 3, backgroundColor: pistilColor, transform: [{ rotate: "-10deg" }] }} />
        </>
      )}

      {hasTrichomes && (
        <>
          <View style={{ position: "absolute", top: 1, left: 2, width: 2, height: 2, borderRadius: 1, backgroundColor: showHeavyTrichomes ? "#ffcc02" : "#e0e0e0", opacity: 0.8 }} />
          <View style={{ position: "absolute", top: size * 0.4, right: 1, width: 2, height: 2, borderRadius: 1, backgroundColor: showHeavyTrichomes ? "#ffab00" : "#e8e8e8", opacity: 0.7 }} />
          <View style={{ position: "absolute", bottom: 3, left: 3, width: 2, height: 2, borderRadius: 1, backgroundColor: showHeavyTrichomes ? "#ffcc02" : "#e0e0e0", opacity: 0.8 }} />
        </>
      )}

      {stageIdx >= 8 && (
        <View style={{ position: "absolute", top: -1, width: size * 0.9, height: size * 1.1, borderRadius: size * 0.35, backgroundColor: "#ffcc02", opacity: 0.15 }} />
      )}
    </Animated.View>
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

function PistilHair({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 1,
        height: 5,
        backgroundColor: "#e8b4b8",
        transform: [{ rotate: `${angle}deg` }],
        borderRadius: 0.5,
      }}
    />
  );
}

function HangingPlant() {
  const sway = useSharedValue(0);

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${180 + sway.value}deg` }],
  }));

  return (
    <Animated.View style={[{ alignItems: "center", transformOrigin: "top center" }, style]}>
      <View style={{ width: 3, height: 14, backgroundColor: "#6d4c41", borderRadius: 1.5 }} />

      <View style={{ width: 4, height: 60, backgroundColor: "#5d4037", borderRadius: 2, marginTop: -1 }}>
        <View style={{ position: "absolute", left: -10, top: 8, width: 14, height: 10, borderRadius: 5, backgroundColor: "#689f38", opacity: 0.7, transform: [{ rotate: "-30deg" }] }} />
        <View style={{ position: "absolute", right: -10, top: 16, width: 14, height: 10, borderRadius: 5, backgroundColor: "#7cb342", opacity: 0.7, transform: [{ rotate: "30deg" }] }} />
        <View style={{ position: "absolute", left: -8, top: 28, width: 12, height: 8, borderRadius: 4, backgroundColor: "#8bc34a", opacity: 0.6, transform: [{ rotate: "-25deg" }] }} />
        <View style={{ position: "absolute", right: -8, top: 38, width: 12, height: 8, borderRadius: 4, backgroundColor: "#9ccc65", opacity: 0.6, transform: [{ rotate: "25deg" }] }} />
      </View>

      <View style={{ position: "absolute", top: 10, left: -4, width: 12, height: 16, borderRadius: 5, backgroundColor: "#558b2f" }} />
      <View style={{ position: "absolute", top: 26, right: -6, width: 14, height: 18, borderRadius: 6, backgroundColor: "#33691e" }} />
      <View style={{ position: "absolute", top: 42, left: -6, width: 10, height: 14, borderRadius: 5, backgroundColor: "#558b2f" }} />
    </Animated.View>
  );
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
}: VirtualPlantProps) {
  const stageIdx = STAGE_INDEX[stage] ?? 2;
  const healthColor = getHealthColor(daysSinceLastLog, recentLogCount);
  const health = getHealthFace(daysSinceLastLog, recentLogCount);
  const droop = getDroopAngle(daysSinceLastLog);

  const leafBaseColor = nutrientFeedings > 0 ? "#2e7d32" : healthColor;
  const soilColor = waterings > 0 ? "#2d1a0e" : "#3e2723";
  const potScale = transplants > 0 ? 1 + Math.min(transplants * 0.08, 0.3) : 1;

  const visibleNodes = stageIdx <= 1 ? 0 : Math.min(nodeCount > 0 ? nodeCount : Math.max(2, stageIdx), 8);
  const visibleBuds = stageIdx >= 5 ? Math.min(budCount > 0 ? budCount : Math.max(1, stageIdx - 4), 6) : 0;

  const stemHeight = stageIdx <= 0 ? 0 : stageIdx === 1 ? 18 : Math.min(110, 20 + stageIdx * 12);
  const stemWidth = stageIdx <= 1 ? 2 : Math.min(7, 3 + Math.floor(stageIdx / 2));

  const showSparkles = photoCount > 0;
  const sparkleCount = Math.min(5, photoCount);

  const fingerCount = stageIdx <= 1 ? 1 : stageIdx <= 2 ? 3 : stageIdx <= 3 ? 5 : 7;
  const leafSize = stageIdx <= 1 ? 12 : stageIdx <= 2 ? 18 : stageIdx <= 3 ? 24 : 28;

  const isHarvested = stageIdx === 9;

  const plantSway = useSharedValue(0);

  useEffect(() => {
    plantSway.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1.5, { duration: 3500, easing: Easing.inOut(Easing.ease) })
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
      <View style={[vpStyles.soilMound, { backgroundColor: soilColor }]} />
      <View style={vpStyles.seedShell}>
        <View style={vpStyles.seedHalf} />
        <View style={[vpStyles.seedHalf, { transform: [{ rotate: "15deg" }], left: 2 }]} />
        <View style={vpStyles.seedCrack} />
      </View>
    </View>
  );

  const renderSeedlingStage = () => (
    <Animated.View style={[vpStyles.plantBody, plantSwayStyle]}>
      <View style={{ width: 2, height: 18, backgroundColor: "#81c784", borderRadius: 1, position: "relative" }}>
        <CotyledonLeaf side="left" droop={droop} />
        <CotyledonLeaf side="right" droop={droop} />
      </View>
      <View style={[vpStyles.soilLine, { backgroundColor: soilColor }]} />
    </Animated.View>
  );

  const renderPlant = () => {
    const leaves: { side: "left" | "right"; yOffset: number; size: number; fingers: number; key: string }[] = [];
    const leafPairs = Math.min(visibleNodes, 6);

    for (let i = 0; i < leafPairs; i++) {
      const side: "left" | "right" = i % 2 === 0 ? "left" : "right";
      const yOff = 8 + (i * (stemHeight - 16)) / Math.max(leafPairs, 1);
      const sizeFactor = 1 - i * 0.08;
      const fingers = i < leafPairs - 2 ? fingerCount : Math.max(3, fingerCount - 2);
      leaves.push({ side, yOffset: yOff, size: leafSize * sizeFactor, fingers, key: `leaf-${i}` });
    }

    const budPositions = [
      { x: -2, y: -6 },
      { x: stemWidth + 2, y: 4 },
      { x: -10, y: stemHeight * 0.25 },
      { x: stemWidth + 6, y: stemHeight * 0.35 },
      { x: -8, y: stemHeight * 0.5 },
      { x: stemWidth + 4, y: stemHeight * 0.6 },
    ];

    const isHarvestReady = stageIdx >= 8;
    const stemColor = isHarvestReady ? "#5d4037" : leafBaseColor;

    return (
      <Animated.View style={[vpStyles.plantBody, plantSwayStyle]}>
        <View
          style={[
            vpStyles.stem,
            {
              height: stemHeight,
              width: stemWidth,
              backgroundColor: stemColor,
              borderRadius: stemWidth / 2,
            },
          ]}
        >
          {leaves.map((l) => (
            <CannabisLeaf
              key={l.key}
              side={l.side}
              yOffset={l.yOffset}
              fingerCount={l.fingers}
              size={l.size}
              color={isHarvestReady ? "#9e9d24" : leafBaseColor}
              droop={droop}
            />
          ))}

          {stageIdx === 4 && (
            <>
              <PistilHair x={-2} y={stemHeight * 0.15} angle={-20} />
              <PistilHair x={stemWidth + 1} y={stemHeight * 0.2} angle={15} />
              <PistilHair x={-1} y={stemHeight * 0.4} angle={-30} />
            </>
          )}

          {visibleBuds > 0 &&
            budPositions.slice(0, visibleBuds).map((pos, i) => (
              <BudCluster
                key={`bud-${i}`}
                x={pos.x}
                y={pos.y}
                size={stageIdx >= 7 ? 14 : stageIdx >= 6 ? 11 : 8}
                stageIdx={stageIdx}
                hasTrichomes={stageIdx >= 6}
              />
            ))}

          {stageIdx >= 3 && stemHeight > 40 && (
            <>
              <View
                style={{
                  position: "absolute",
                  left: -1,
                  top: stemHeight * 0.5,
                  width: 2,
                  height: 14,
                  backgroundColor: stemColor,
                  borderRadius: 1,
                  transform: [{ rotate: "-30deg" }],
                  transformOrigin: "top center",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  right: -1,
                  top: stemHeight * 0.65,
                  width: 2,
                  height: 12,
                  backgroundColor: stemColor,
                  borderRadius: 1,
                  transform: [{ rotate: "30deg" }],
                  transformOrigin: "top center",
                }}
              />
            </>
          )}
        </View>

        <View style={[vpStyles.soilLine, { backgroundColor: soilColor }]} />
      </Animated.View>
    );
  };

  const sparkles: React.ReactNode[] = [];
  if (showSparkles) {
    const sparkPositions = [
      { x: 20, y: 15 },
      { x: 90, y: 25 },
      { x: 30, y: 70 },
      { x: 85, y: 80 },
      { x: 55, y: 10 },
    ];
    for (let i = 0; i < sparkleCount; i++) {
      sparkles.push(
        <Sparkle key={`sp-${i}`} x={sparkPositions[i].x} y={sparkPositions[i].y} delay={i * 400} />
      );
    }
  }

  const potWidth = 60 * potScale;
  const potBodyWidth = 52 * potScale;

  return (
    <View style={vpStyles.card}>
      <View style={vpStyles.plantScene}>
        {isHarvested ? (
          <View style={vpStyles.harvestArea}>
            <View style={{ width: 30, height: 3, backgroundColor: "#5d4037", borderRadius: 1.5, marginBottom: 2 }} />
            <View style={{ width: 2, height: 10, backgroundColor: "#6d4c41" }} />
            <HangingPlant />
          </View>
        ) : (
          <>
            <View style={vpStyles.pot}>
              <View style={[vpStyles.potRim, { width: potWidth }]} />
              <View style={[vpStyles.potBody, { width: potBodyWidth }]} />
              <View style={[vpStyles.potSoil, { width: potBodyWidth - 2, backgroundColor: soilColor }]} />
            </View>

            <View style={vpStyles.plantArea}>
              {stageIdx === 0 && renderSeedStage()}
              {stageIdx === 1 && renderSeedlingStage()}
              {stageIdx >= 2 && renderPlant()}
            </View>
          </>
        )}

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
          {waterings > 0 && (
            <View style={vpStyles.miniStat}>
              <Ionicons name="water-outline" size={12} color="#42a5f5" />
              <Text style={vpStyles.miniStatText}>{waterings}</Text>
            </View>
          )}
          {nutrientFeedings > 0 && (
            <View style={vpStyles.miniStat}>
              <Ionicons name="flask-outline" size={12} color="#66bb6a" />
              <Text style={vpStyles.miniStatText}>{nutrientFeedings}</Text>
            </View>
          )}
          {transplants > 0 && (
            <View style={vpStyles.miniStat}>
              <Ionicons name="resize-outline" size={12} color="#ffa726" />
              <Text style={vpStyles.miniStatText}>{transplants}</Text>
            </View>
          )}
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
    height: 200,
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
    width: 28,
    height: 10,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginTop: -2,
  },
  seedShell: {
    width: 12,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
  },
  seedHalf: {
    position: "absolute",
    width: 10,
    height: 14,
    borderRadius: 5,
    backgroundColor: "#8d6e63",
  },
  seedCrack: {
    width: 1,
    height: 8,
    backgroundColor: "#4caf50",
    borderRadius: 0.5,
    marginTop: -2,
  },
  plantBody: {
    alignItems: "center",
    transformOrigin: "bottom center",
  },
  stem: {
    position: "relative",
  },
  soilLine: {
    width: 34,
    height: 5,
    backgroundColor: "#3e2723",
    borderRadius: 2.5,
    marginTop: -2,
  },
  harvestArea: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
    height: 200,
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
    flexWrap: "wrap",
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
