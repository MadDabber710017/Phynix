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
  lightType?: string;
  tentSize?: string;
  medium?: string;
  fanType?: string;
  lightSchedule?: string;
  growEnvironment?: string;
  plantCount?: number;
  potType?: string;
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

function getMediumColor(medium?: string): string {
  if (!medium) return "#3e2723";
  const m = medium.toLowerCase();
  if (m.includes("coco") && m.includes("perlite")) return "#795548";
  if (m.includes("coco")) return "#6d4c41";
  if (m.includes("peat") && m.includes("coir")) return "#4e342e";
  if (m.includes("soil/peat")) return "#4e342e";
  if (m.includes("peat moss")) return "#2c1e13";
  if (m.includes("peat") && m.includes("perlite")) return "#5d4037";
  if (m.includes("living soil")) return "#33691e";
  if (m.includes("super soil")) return "#2e7d32";
  if (m.includes("soil")) return "#3e2723";
  if (m.includes("rockwool")) return "#bdbdbd";
  if (m.includes("clay pebble")) return "#8d6e63";
  if (m.includes("vermiculite")) return "#a1887f";
  if (m.includes("dwc") || m.includes("rdwc") || m.includes("nft") || m.includes("ebb") || m.includes("hydro") || m.includes("aero")) return "#1a237e";
  return "#3e2723";
}

function isHydroMedium(medium?: string): boolean {
  if (!medium) return false;
  const m = medium.toLowerCase();
  return m.includes("dwc") || m.includes("rdwc") || m.includes("nft") || m.includes("ebb") || m.includes("hydro") || m.includes("aero");
}

function isOutdoor(lightType?: string): boolean {
  if (!lightType) return false;
  const l = lightType.toLowerCase();
  return l.includes("natural") || l.includes("outdoor") || l.includes("sun");
}

function AnimatedFan() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const fanStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={tentStyles.fanContainer}>
      <Animated.View style={[tentStyles.fanBlades, fanStyle]}>
        <View style={[tentStyles.fanBlade, { transform: [{ rotate: "0deg" }] }]} />
        <View style={[tentStyles.fanBlade, { transform: [{ rotate: "90deg" }] }]} />
        <View style={[tentStyles.fanBlade, { transform: [{ rotate: "180deg" }] }]} />
        <View style={[tentStyles.fanBlade, { transform: [{ rotate: "270deg" }] }]} />
      </Animated.View>
      <View style={tentStyles.fanCenter} />
    </View>
  );
}

function LightFixture({ lightType }: { lightType: string }) {
  const l = lightType.toLowerCase();
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (l.includes("hps")) {
    return (
      <View style={tentStyles.lightArea}>
        <View style={tentStyles.lightString} />
        <View style={tentStyles.lightString2} />
        <View style={[tentStyles.hpsBulb]}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ffb74d" }} />
        </View>
        <Animated.View style={[tentStyles.lightGlow, { backgroundColor: "#ff9800" }, glowStyle]} />
      </View>
    );
  }

  if (l.includes("cmh") || l.includes("lec")) {
    return (
      <View style={tentStyles.lightArea}>
        <View style={tentStyles.lightString} />
        <View style={tentStyles.lightString2} />
        <View style={[tentStyles.hpsBulb]}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff9c4" }} />
        </View>
        <Animated.View style={[tentStyles.lightGlow, { backgroundColor: "#fff176" }, glowStyle]} />
      </View>
    );
  }

  if (l.includes("cfl") || l.includes("t5")) {
    return (
      <View style={tentStyles.lightArea}>
        <View style={tentStyles.lightString} />
        <View style={tentStyles.lightString2} />
        <View style={tentStyles.cflTubes}>
          <View style={tentStyles.cflTube} />
          <View style={tentStyles.cflTube} />
          <View style={tentStyles.cflTube} />
        </View>
        <Animated.View style={[tentStyles.lightGlow, { backgroundColor: "#e0e0e0" }, glowStyle]} />
      </View>
    );
  }

  return (
    <View style={tentStyles.lightArea}>
      <View style={tentStyles.lightString} />
      <View style={tentStyles.lightString2} />
      <View style={tentStyles.ledPanel}>
        <View style={tentStyles.ledDotRow}>
          <View style={[tentStyles.ledDot, { backgroundColor: "#e1bee7" }]} />
          <View style={[tentStyles.ledDot, { backgroundColor: "#fff" }]} />
          <View style={[tentStyles.ledDot, { backgroundColor: "#e1bee7" }]} />
          <View style={[tentStyles.ledDot, { backgroundColor: "#fff" }]} />
          <View style={[tentStyles.ledDot, { backgroundColor: "#e1bee7" }]} />
        </View>
        <View style={tentStyles.ledDotRow}>
          <View style={[tentStyles.ledDot, { backgroundColor: "#fff" }]} />
          <View style={[tentStyles.ledDot, { backgroundColor: "#e1bee7" }]} />
          <View style={[tentStyles.ledDot, { backgroundColor: "#fff" }]} />
          <View style={[tentStyles.ledDot, { backgroundColor: "#e1bee7" }]} />
          <View style={[tentStyles.ledDot, { backgroundColor: "#fff" }]} />
        </View>
      </View>
      <Animated.View style={[tentStyles.lightGlow, { backgroundColor: "#ce93d8" }, glowStyle]} />
    </View>
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

function BackgroundPlantSilhouette({ x, height }: { x: number; height: number }) {
  return (
    <View style={{ position: "absolute", bottom: 0, left: x, alignItems: "center" }}>
      <View style={{ width: 2, height: height, backgroundColor: "rgba(76,175,80,0.25)", borderRadius: 1 }} />
      <View style={{ position: "absolute", bottom: height * 0.6, left: -3, width: 6, height: 4, borderRadius: 2, backgroundColor: "rgba(76,175,80,0.2)", transform: [{ rotate: "-30deg" }] }} />
      <View style={{ position: "absolute", bottom: height * 0.4, right: -3, width: 6, height: 4, borderRadius: 2, backgroundColor: "rgba(76,175,80,0.2)", transform: [{ rotate: "30deg" }] }} />
    </View>
  );
}

function PlantCountIndicator({ count }: { count: number }) {
  if (count <= 1) return null;
  const dots = Math.min(count, 9);
  return (
    <View style={{ position: "absolute", bottom: 4, right: 8, flexDirection: "row", gap: 3, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, zIndex: 12 }}>
      {Array.from({ length: dots }).map((_, i) => (
        <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#66bb6a" }} />
      ))}
      {count > 9 && <Text style={{ fontSize: 8, color: "#aaa", fontFamily: "Nunito_400Regular" }}>+</Text>}
    </View>
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
  const healthColor = getHealthColor(daysSinceLastLog, recentLogCount);
  const health = getHealthFace(daysSinceLastLog, recentLogCount);
  const droop = getDroopAngle(daysSinceLastLog);

  const leafBaseColor = nutrientFeedings > 0 ? "#2e7d32" : healthColor;
  const mediumColor = medium ? getMediumColor(medium) : (waterings > 0 ? "#2d1a0e" : "#3e2723");
  const soilColor = mediumColor;
  const potScale = transplants > 0 ? 1 + Math.min(transplants * 0.08, 0.3) : 1;

  const showTent = !!(lightType || tentSize || medium || fanType || lightSchedule || growEnvironment);
  const outdoor = isOutdoor(lightType);
  const env = (growEnvironment || "").toLowerCase();
  const hydro = isHydroMedium(medium);

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

  const renderPot = () => {
    if (hydro) {
      return (
        <View style={vpStyles.pot}>
          <View style={[vpStyles.potRim, { width: potWidth, backgroundColor: "#37474f" }]} />
          <View style={[vpStyles.potBody, { width: potBodyWidth, backgroundColor: "#263238" }]} />
          <View style={[vpStyles.potSoil, { width: potBodyWidth - 2, backgroundColor: "#1a237e" }]}>
            <View style={{ position: "absolute", top: 2, left: 4, width: 6, height: 2, borderRadius: 1, backgroundColor: "#42a5f5", opacity: 0.5 }} />
            <View style={{ position: "absolute", top: 3, right: 6, width: 8, height: 2, borderRadius: 1, backgroundColor: "#42a5f5", opacity: 0.4 }} />
          </View>
        </View>
      );
    }
    if (medium?.toLowerCase().includes("rockwool")) {
      return (
        <View style={vpStyles.pot}>
          <View style={{ width: potBodyWidth, height: potBodyWidth * 0.6, backgroundColor: "#bdbdbd", borderRadius: 4 }} />
        </View>
      );
    }
    if (medium?.toLowerCase().includes("clay pebble")) {
      return (
        <View style={vpStyles.pot}>
          <View style={[vpStyles.potRim, { width: potWidth }]} />
          <View style={[vpStyles.potBody, { width: potBodyWidth }]} />
          <View style={[vpStyles.potSoil, { width: potBodyWidth - 2, backgroundColor: "#8d6e63" }]}>
            <View style={{ position: "absolute", top: 1, left: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: "#a1887f" }} />
            <View style={{ position: "absolute", top: 2, left: 10, width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#8d6e63" }} />
            <View style={{ position: "absolute", top: 1, right: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: "#a1887f" }} />
            <View style={{ position: "absolute", top: 2, right: 12, width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#795548" }} />
          </View>
        </View>
      );
    }
    return (
      <View style={vpStyles.pot}>
        <View style={[vpStyles.potRim, { width: potWidth }]} />
        <View style={[vpStyles.potBody, { width: potBodyWidth }]} />
        <View style={[vpStyles.potSoil, { width: potBodyWidth - 2, backgroundColor: soilColor }]} />
      </View>
    );
  };

  const plantContent = (
    <>
      {isHarvested ? (
        <View style={vpStyles.harvestArea}>
          <View style={{ width: 30, height: 3, backgroundColor: "#5d4037", borderRadius: 1.5, marginBottom: 2 }} />
          <View style={{ width: 2, height: 10, backgroundColor: "#6d4c41" }} />
          <HangingPlant />
        </View>
      ) : (
        <>
          {renderPot()}
          <View style={vpStyles.plantArea}>
            {stageIdx === 0 && renderSeedStage()}
            {stageIdx === 1 && renderSeedlingStage()}
            {stageIdx >= 2 && renderPlant()}
          </View>
        </>
      )}
      {sparkles}
    </>
  );

  const renderEnvironmentScene = () => {
    if (env.includes("window")) {
      return (
        <View style={[vpStyles.plantScene, { height: 220, backgroundColor: "#2a2a3e" }]}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 100, backgroundColor: "#fdd835", opacity: 0.08 }} />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 50, backgroundColor: "#fff9c4", opacity: 0.1 }} />
          <View style={{ position: "absolute", top: 10, left: 20, right: 20, height: 130, borderWidth: 3, borderColor: "#5d4037", borderRadius: 4 }}>
            <View style={{ position: "absolute", top: 0, bottom: 0, left: "48%", width: 3, backgroundColor: "#5d4037" }} />
            <View style={{ position: "absolute", left: 0, right: 0, top: "48%", height: 3, backgroundColor: "#5d4037" }} />
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#87ceeb", opacity: 0.1, borderRadius: 2 }} />
          </View>
          <View style={{ position: "absolute", bottom: 38, left: 10, right: 10, height: 4, backgroundColor: "#5d4037", borderRadius: 2 }} />
          {lightSchedule ? (
            <View style={tentStyles.scheduleBadge}>
              <Text style={tentStyles.scheduleText}>{lightSchedule}</Text>
            </View>
          ) : null}
          <PlantCountIndicator count={plantCount} />
          {plantContent}
        </View>
      );
    }

    if (env.includes("balcon")) {
      return (
        <View style={[vpStyles.plantScene, { height: 220 }]}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 100 }}>
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 50, backgroundColor: "#64b5f6", opacity: 0.25 }} />
            <View style={{ position: "absolute", top: 50, left: 0, right: 0, height: 50, backgroundColor: "#bbdefb", opacity: 0.15 }} />
          </View>
          <View style={tentStyles.sunIcon}>
            <Ionicons name="sunny" size={20} color="#ffd54f" />
          </View>
          <View style={{ position: "absolute", bottom: 34, left: 0, right: 0, height: 3, backgroundColor: "#455a64" }} />
          <View style={{ position: "absolute", bottom: 34, left: 0, width: 3, height: 50, backgroundColor: "#546e7a" }} />
          <View style={{ position: "absolute", bottom: 34, right: 0, width: 3, height: 50, backgroundColor: "#546e7a" }} />
          <View style={{ position: "absolute", bottom: 54, left: 0, right: 0, height: 2, backgroundColor: "#546e7a", opacity: 0.7 }} />
          <View style={{ position: "absolute", bottom: 44, left: 0, right: 0, height: 2, backgroundColor: "#546e7a", opacity: 0.5 }} />
          {lightSchedule ? (
            <View style={tentStyles.scheduleBadge}>
              <Text style={tentStyles.scheduleText}>{lightSchedule}</Text>
            </View>
          ) : null}
          <PlantCountIndicator count={plantCount} />
          {plantContent}
        </View>
      );
    }

    if (env.includes("outdoor garden")) {
      const bgPlants = plantCount > 1 ? Math.min(plantCount - 1, 6) : 0;
      return (
        <View style={[vpStyles.plantScene, { height: 220 }]}>
          <View style={tentStyles.outdoorSky}>
            <View style={tentStyles.skyGradient1} />
            <View style={tentStyles.skyGradient2} />
          </View>
          <View style={tentStyles.sunIcon}>
            <Ionicons name="sunny" size={22} color="#ffd54f" />
          </View>
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, backgroundColor: "#3e2723", borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
          <View style={{ position: "absolute", bottom: 36, left: 0, right: 0, height: 6, backgroundColor: "#4e342e", opacity: 0.5 }} />
          {bgPlants > 0 && Array.from({ length: bgPlants }).map((_, i) => (
            <BackgroundPlantSilhouette key={`bg-${i}`} x={15 + i * 22} height={20 + Math.random() * 15} />
          ))}
          {lightSchedule ? (
            <View style={tentStyles.scheduleBadge}>
              <Text style={tentStyles.scheduleText}>{lightSchedule}</Text>
            </View>
          ) : null}
          <PlantCountIndicator count={plantCount} />
          {plantContent}
        </View>
      );
    }

    if (env.includes("outdoor field") || env.includes("field") || env.includes("farm")) {
      const bgPlants = plantCount > 5 ? Math.min(plantCount - 1, 12) : 0;
      return (
        <View style={[vpStyles.plantScene, { height: 220 }]}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60 }}>
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 30, backgroundColor: "#42a5f5", opacity: 0.2 }} />
            <View style={{ position: "absolute", top: 30, left: 0, right: 0, height: 30, backgroundColor: "#90caf9", opacity: 0.12 }} />
          </View>
          <View style={tentStyles.sunIcon}>
            <Ionicons name="sunny" size={24} color="#ffd54f" />
          </View>
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 30, backgroundColor: "#5d4037" }} />
          <View style={{ position: "absolute", bottom: 28, left: 0, right: 0, height: 4, backgroundColor: "#4e342e", opacity: 0.4 }} />
          {bgPlants > 0 && Array.from({ length: bgPlants }).map((_, i) => {
            const xPos = 8 + (i * (160 / bgPlants));
            const h = 10 + (i % 3) * 5;
            const opac = 0.15 + (i % 3) * 0.05;
            return (
              <View key={`field-${i}`} style={{ position: "absolute", bottom: 30, left: xPos, alignItems: "center", opacity: opac }}>
                <View style={{ width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: h, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#4caf50" }} />
                <View style={{ width: 1, height: 6, backgroundColor: "#4caf50" }} />
              </View>
            );
          })}
          {lightSchedule ? (
            <View style={tentStyles.scheduleBadge}>
              <Text style={tentStyles.scheduleText}>{lightSchedule}</Text>
            </View>
          ) : null}
          <PlantCountIndicator count={plantCount} />
          {plantContent}
        </View>
      );
    }

    if (env.includes("greenhouse")) {
      return (
        <View style={[vpStyles.plantScene, { height: 220, backgroundColor: "rgba(27,94,32,0.08)" }]}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderWidth: 2, borderColor: "rgba(200,230,200,0.3)", borderRadius: 6 }}>
            <View style={{ position: "absolute", top: 0, bottom: 0, left: "33%", width: 1, backgroundColor: "rgba(200,230,200,0.2)" }} />
            <View style={{ position: "absolute", top: 0, bottom: 0, left: "66%", width: 1, backgroundColor: "rgba(200,230,200,0.2)" }} />
            <View style={{ position: "absolute", left: 0, right: 0, top: "33%", height: 1, backgroundColor: "rgba(200,230,200,0.2)" }} />
            <View style={{ position: "absolute", left: 0, right: 0, top: "66%", height: 1, backgroundColor: "rgba(200,230,200,0.2)" }} />
          </View>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(76,175,80,0.04)" }} />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 50, backgroundColor: "#fff9c4", opacity: 0.08 }} />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(200,230,200,0.25)" }} />
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(200,230,200,0.25)" }} />
          <View style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, backgroundColor: "rgba(200,230,200,0.25)" }} />
          <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 3, backgroundColor: "rgba(200,230,200,0.25)" }} />
          {lightSchedule ? (
            <View style={tentStyles.scheduleBadge}>
              <Text style={tentStyles.scheduleText}>{lightSchedule}</Text>
            </View>
          ) : null}
          <PlantCountIndicator count={plantCount} />
          {plantContent}
        </View>
      );
    }

    if (env.includes("closet")) {
      return (
        <View style={[vpStyles.plantScene, { height: 220, backgroundColor: "#111118" }]}>
          <View style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 5, backgroundColor: "#1e1e28" }} />
          <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 5, backgroundColor: "#1e1e28" }} />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, backgroundColor: "#1e1e28" }} />
          <View style={{ position: "absolute", top: 14, left: 5, right: 5, height: 2, backgroundColor: "#2a2a35", opacity: 0.6 }} />
          <View style={{ position: "absolute", top: 18, left: 5, right: 5, height: 1, backgroundColor: "#2a2a35", opacity: 0.3 }} />
          {lightType ? <LightFixture lightType={lightType} /> : (
            <View style={tentStyles.lightArea}>
              <View style={{ width: 20, height: 6, backgroundColor: "#333", borderRadius: 2 }}>
                <View style={{ position: "absolute", top: 2, left: 4, width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#e0e0e0", opacity: 0.7 }} />
                <View style={{ position: "absolute", top: 2, right: 4, width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#e0e0e0", opacity: 0.7 }} />
              </View>
            </View>
          )}
          {fanType ? <AnimatedFan /> : null}
          {lightSchedule ? (
            <View style={tentStyles.scheduleBadge}>
              <Text style={tentStyles.scheduleText}>{lightSchedule}</Text>
            </View>
          ) : null}
          <PlantCountIndicator count={plantCount} />
          {plantContent}
        </View>
      );
    }

    if (env.includes("indoor room") || env.includes("room")) {
      return (
        <View style={[vpStyles.plantScene, { height: 220, backgroundColor: "#1a1a2e" }]}>
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "#2a2a3e" }} />
          <View style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 2, backgroundColor: "#22223a", opacity: 0.5 }} />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: "#22223a", opacity: 0.4 }} />
          {lightType ? <LightFixture lightType={lightType} /> : null}
          {fanType ? <AnimatedFan /> : null}
          {lightSchedule ? (
            <View style={tentStyles.scheduleBadge}>
              <Text style={tentStyles.scheduleText}>{lightSchedule}</Text>
            </View>
          ) : null}
          <PlantCountIndicator count={plantCount} />
          {plantContent}
        </View>
      );
    }

    if (outdoor || env.includes("outdoor")) {
      return (
        <View style={[vpStyles.plantScene, { height: 220 }]}>
          <View style={tentStyles.outdoorSky}>
            <View style={tentStyles.skyGradient1} />
            <View style={tentStyles.skyGradient2} />
          </View>
          <View style={tentStyles.sunIcon}>
            <Ionicons name="sunny" size={22} color="#ffd54f" />
          </View>
          {lightSchedule ? (
            <View style={tentStyles.scheduleBadge}>
              <Text style={tentStyles.scheduleText}>{lightSchedule}</Text>
            </View>
          ) : null}
          <PlantCountIndicator count={plantCount} />
          {plantContent}
        </View>
      );
    }

    if (env.includes("tent") || (showTent && !env)) {
      return (
        <View style={[tentStyles.tentFrame, { height: 220 }]}>
          <View style={tentStyles.tentTopBar} />
          <View style={tentStyles.tentLeftWall} />
          <View style={tentStyles.tentRightWall} />
          <View style={tentStyles.tentInnerShadow} />
          <View style={[vpStyles.plantScene, { height: 220, backgroundColor: "transparent" }]}>
            {lightType ? <LightFixture lightType={lightType} /> : null}
            {fanType ? <AnimatedFan /> : null}
            {lightSchedule ? (
              <View style={tentStyles.scheduleBadge}>
                <Text style={tentStyles.scheduleText}>{lightSchedule}</Text>
              </View>
            ) : null}
            <PlantCountIndicator count={plantCount} />
            {plantContent}
          </View>
        </View>
      );
    }

    return (
      <View style={vpStyles.plantScene}>
        <PlantCountIndicator count={plantCount} />
        {plantContent}
      </View>
    );
  };

  return (
    <View style={vpStyles.card}>
      {renderEnvironmentScene()}

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

const tentStyles = StyleSheet.create({
  tentFrame: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  tentTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#2a2a2a",
    zIndex: 10,
  },
  tentLeftWall: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#2a2a2a",
    zIndex: 10,
  },
  tentRightWall: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#2a2a2a",
    zIndex: 10,
  },
  tentInnerShadow: {
    position: "absolute",
    top: 4,
    left: 3,
    right: 3,
    height: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 5,
  },
  lightArea: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 8,
  },
  lightString: {
    position: "absolute",
    top: -8,
    left: -12,
    width: 1,
    height: 12,
    backgroundColor: "#616161",
  },
  lightString2: {
    position: "absolute",
    top: -8,
    right: -12,
    width: 1,
    height: 12,
    backgroundColor: "#616161",
  },
  ledPanel: {
    width: 50,
    height: 14,
    backgroundColor: "#212121",
    borderRadius: 3,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
    paddingVertical: 2,
  },
  ledDotRow: {
    flexDirection: "row",
    gap: 3,
  },
  ledDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  lightGlow: {
    position: "absolute",
    top: 14,
    width: 80,
    height: 60,
    borderRadius: 40,
    alignSelf: "center",
  },
  hpsBulb: {
    width: 20,
    height: 16,
    backgroundColor: "#424242",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cflTubes: {
    flexDirection: "row",
    gap: 3,
  },
  cflTube: {
    width: 3,
    height: 16,
    backgroundColor: "#e0e0e0",
    borderRadius: 1.5,
  },
  fanContainer: {
    position: "absolute",
    top: 30,
    right: 12,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
  },
  fanBlades: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  fanBlade: {
    position: "absolute",
    width: 3,
    height: 8,
    backgroundColor: "#78909c",
    borderRadius: 1.5,
    top: 1,
  },
  fanCenter: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#455a64",
  },
  scheduleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 12,
  },
  scheduleText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 9,
    color: "#e0e0e0",
  },
  outdoorSky: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  skyGradient1: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#64b5f6",
    opacity: 0.3,
  },
  skyGradient2: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#90caf9",
    opacity: 0.15,
  },
  sunIcon: {
    position: "absolute",
    top: 8,
    right: 12,
    zIndex: 8,
  },
});
