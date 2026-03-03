import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { addXP, loadProfile, type GrowProfile, LEVEL_THRESHOLDS, getNextLevel, ALL_ACHIEVEMENTS } from "@/lib/gamification";
import VirtualPlant from "@/components/VirtualPlant";

const C = Colors.dark;
const STORAGE_KEY = "phynix_grows_v2";

interface GrowNote {
  id: string;
  date: string;
  dateTime: string;
  content: string;
  imageBase64?: string;
  images?: string[];
  tag?: string;
}

function getNoteImages(note: GrowNote): string[] {
  if (note.images && note.images.length > 0) return note.images;
  if (note.imageBase64) return [note.imageBase64];
  return [];
}

interface Equipment {
  lightType: string;
  lightWattage: string;
  lightBrand: string;
  tentSize: string;
  medium: string;
  nutrientBrand: string;
  fanType: string;
  otherGear: string;
}

interface BurpSchedule {
  lastBurp?: string;
  burpCount?: number;
}

interface Grow {
  id: string;
  name: string;
  strain: string;
  plantCount: string;
  growType: string;
  startDate: string;
  stage: string;
  lightSchedule: string;
  equipment: Equipment;
  notes: GrowNote[];
  createdAt: string;
  waterings?: number;
  nutrientFeedings?: number;
  transplants?: number;
  nodeCount?: number;
  budCount?: number;
  harvestDate?: string;
  harvestWeight?: string;
  dryWeight?: string;
  cureStartDate?: string;
  dryingDays?: number;
  curingDays?: number;
  dryingNotes?: string[];
  curingNotes?: string[];
  burpSchedule?: BurpSchedule;
  finalCuredWeight?: string;
}

const STAGES = [
  "Germination", "Seedling", "Early Vegetative", "Late Vegetative",
  "Pre-Flower", "Early Flower", "Mid Flower", "Late Flower",
  "Harvest Ready", "Harvested", "Curing", "Done",
];

const STAGE_COLORS: Record<string, string> = {
  "Germination": "#42a5f5",
  "Seedling": "#81c784",
  "Early Vegetative": "#66bb6a",
  "Late Vegetative": "#4caf50",
  "Pre-Flower": "#ffa726",
  "Early Flower": "#ab47bc",
  "Mid Flower": "#9c27b0",
  "Late Flower": "#7b1fa2",
  "Harvest Ready": "#ef5350",
  "Harvested": "#78909c",
  "Curing": "#8d6e63",
  "Done": "#546e7a",
};

const GROW_TYPES = ["Autoflower", "Photoperiod", "Mixed"];
const LIGHT_TYPES = ["LED", "HPS", "CMH/LEC", "CFL/T5", "MH", "Fluorescent", "Natural/Outdoor", "Other"];
const LIGHT_SCHEDULES = ["18/6", "20/4", "24/0", "12/12", "14/10", "16/8", "Natural"];
const MEDIUMS = ["Soil", "Coco Coir", "DWC Hydro", "RDWC", "Aeroponics", "Rockwool", "Peat/Perlite", "Other"];

function getDaysRunning(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function webUriToBase64(uri: string): Promise<string | null> {
  if (Platform.OS === "web") {
    const res = await globalThis.fetch(uri);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  return null;
}

async function pickPhoto(): Promise<string[]> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return [];
  const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.3, base64: true, mediaTypes: ["images"], allowsMultipleSelection: true });
  if (result.canceled || !result.assets || result.assets.length === 0) return [];
  const images: string[] = [];
  for (const asset of result.assets) {
    if (asset.base64) {
      images.push(asset.base64);
    } else {
      const b64 = await webUriToBase64(asset.uri);
      if (b64) images.push(b64);
    }
  }
  return images;
}

async function takePhoto(): Promise<string[]> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") return [];
  const result = await ImagePicker.launchCameraAsync({ quality: 0.3, base64: true, mediaTypes: ["images"] });
  if (result.canceled || !result.assets[0]) return [];
  if (result.assets[0].base64) return [result.assets[0].base64];
  const b64 = await webUriToBase64(result.assets[0].uri);
  return b64 ? [b64] : [];
}

function AddGrowModal({ onClose, onSave }: { onClose: () => void; onSave: (g: Grow) => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [strain, setStrain] = useState("");
  const [plantCount, setPlantCount] = useState("1");
  const [growType, setGrowType] = useState("Photoperiod");
  const [stage, setStage] = useState("Seedling");
  const [daysAgo, setDaysAgo] = useState("0");
  const [lightSchedule, setLightSchedule] = useState("18/6");
  const [equipment, setEquipment] = useState<Equipment>({
    lightType: "LED", lightWattage: "", lightBrand: "",
    tentSize: "", medium: "Soil", nutrientBrand: "",
    fanType: "", otherGear: "",
  });
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const startDate = new Date(Date.now() - parseInt(daysAgo || "0") * 24 * 60 * 60 * 1000).toISOString();

  const handleSave = () => {
    if (!name.trim()) { Alert.alert("Error", "Please enter a grow name"); return; }
    const grow: Grow = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      strain: strain.trim() || "Unknown",
      plantCount: plantCount || "1",
      growType,
      startDate,
      stage,
      lightSchedule,
      equipment,
      notes: [],
      createdAt: new Date().toISOString(),
    };
    onSave(grow);
  };

  const steps = [
    { title: "Basic Info", icon: "information-circle-outline" },
    { title: "Timeline", icon: "calendar-outline" },
    { title: "Equipment", icon: "build-outline" },
  ];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[addStyles.container, { backgroundColor: C.background }]}>
        <View style={[addStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={addStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <Text style={addStyles.title}>Start New Grow</Text>
          <View style={addStyles.stepRow}>
            {steps.map((s, i) => (
              <Pressable key={i} style={addStyles.stepIndicator} onPress={() => setStep(i)}>
                <View style={[addStyles.stepDot, i <= step && { backgroundColor: C.tint }]}>
                  <Ionicons name={s.icon as any} size={14} color={i <= step ? "#fff" : C.textMuted} />
                </View>
                <Text style={[addStyles.stepLabel, i === step && { color: C.tint }]}>{s.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[addStyles.content, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <>
              <Text style={addStyles.label}>Grow Name *</Text>
              <TextInput
                style={addStyles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Living Room Tent #1"
                placeholderTextColor={C.textMuted}
                returnKeyType="next"
              />

              <Text style={addStyles.label}>Strain Name</Text>
              <TextInput
                style={addStyles.input}
                value={strain}
                onChangeText={setStrain}
                placeholder="e.g. Blue Dream, OG Kush, Unknown Bag Seed"
                placeholderTextColor={C.textMuted}
                returnKeyType="next"
              />

              <Text style={addStyles.label}>Number of Plants</Text>
              <TextInput
                style={addStyles.input}
                value={plantCount}
                onChangeText={setPlantCount}
                placeholder="1"
                placeholderTextColor={C.textMuted}
                keyboardType="number-pad"
              />

              <Text style={addStyles.label}>Plant Type</Text>
              <View style={addStyles.chipRow}>
                {GROW_TYPES.map((t) => (
                  <Pressable key={t} style={[addStyles.chip, growType === t && addStyles.chipActive]} onPress={() => setGrowType(t)}>
                    <Text style={[addStyles.chipText, growType === t && addStyles.chipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={addStyles.label}>Current Stage</Text>
              <View style={addStyles.chipRow}>
                {STAGES.slice(0, 6).map((s) => (
                  <Pressable key={s} style={[addStyles.chip, stage === s && addStyles.chipActive]} onPress={() => setStage(s)}>
                    <Text style={[addStyles.chipText, stage === s && addStyles.chipTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
              {STAGES.slice(6).map((s) => (
                <Pressable key={s} style={[addStyles.chip, stage === s && addStyles.chipActive, { marginBottom: 8 }]} onPress={() => setStage(s)}>
                  <Text style={[addStyles.chipText, stage === s && addStyles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </>
          )}

          {step === 1 && (
            <>
              <View style={addStyles.dateCard}>
                <Ionicons name="calendar" size={24} color={C.tint} />
                <View style={{ flex: 1 }}>
                  <Text style={addStyles.dateLabel}>Start Date</Text>
                  <Text style={addStyles.dateValue}>{formatDate(startDate)}</Text>
                </View>
              </View>

              <Text style={addStyles.label}>How many days ago did you start?</Text>
              <Text style={addStyles.sublabel}>Enter 0 if you're starting today, or the number of days since you began.</Text>
              <View style={addStyles.daysRow}>
                <Pressable
                  style={addStyles.daysBtn}
                  onPress={() => setDaysAgo(Math.max(0, parseInt(daysAgo || "0") - 1).toString())}
                >
                  <Ionicons name="remove" size={20} color={C.text} />
                </Pressable>
                <TextInput
                  style={addStyles.daysInput}
                  value={daysAgo}
                  onChangeText={(v) => setDaysAgo(v.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <Pressable
                  style={addStyles.daysBtn}
                  onPress={() => setDaysAgo((parseInt(daysAgo || "0") + 1).toString())}
                >
                  <Ionicons name="add" size={20} color={C.text} />
                </Pressable>
              </View>
              <Text style={addStyles.daysSub}>{daysAgo === "0" ? "Starting today" : `Started ${daysAgo} day${parseInt(daysAgo) !== 1 ? "s" : ""} ago`}</Text>

              <Text style={addStyles.label}>Light Schedule</Text>
              <View style={addStyles.chipRow}>
                {LIGHT_SCHEDULES.map((ls) => (
                  <Pressable key={ls} style={[addStyles.chip, lightSchedule === ls && addStyles.chipActive]} onPress={() => setLightSchedule(ls)}>
                    <Text style={[addStyles.chipText, lightSchedule === ls && addStyles.chipTextActive]}>{ls}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={addStyles.sectionLabel}>Lighting Setup</Text>
              <Text style={addStyles.label}>Light Type</Text>
              <View style={addStyles.chipRow}>
                {LIGHT_TYPES.map((lt) => (
                  <Pressable key={lt} style={[addStyles.chip, equipment.lightType === lt && addStyles.chipActive]}
                    onPress={() => setEquipment({ ...equipment, lightType: lt })}>
                    <Text style={[addStyles.chipText, equipment.lightType === lt && addStyles.chipTextActive]}>{lt}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={addStyles.label}>Light Wattage</Text>
              <TextInput
                style={addStyles.input}
                value={equipment.lightWattage}
                onChangeText={(v) => setEquipment({ ...equipment, lightWattage: v })}
                placeholder="e.g. 600w, 2x 315w CMH"
                placeholderTextColor={C.textMuted}
              />

              <Text style={addStyles.label}>Light Brand/Model</Text>
              <TextInput
                style={addStyles.input}
                value={equipment.lightBrand}
                onChangeText={(v) => setEquipment({ ...equipment, lightBrand: v })}
                placeholder="e.g. Mars Hydro TSW-2000, Spider Farmer SF4000"
                placeholderTextColor={C.textMuted}
              />

              <Text style={addStyles.sectionLabel}>Grow Space</Text>
              <Text style={addStyles.label}>Tent/Space Size</Text>
              <TextInput
                style={addStyles.input}
                value={equipment.tentSize}
                onChangeText={(v) => setEquipment({ ...equipment, tentSize: v })}
                placeholder="e.g. 4x4 tent, 10x10 room, small closet"
                placeholderTextColor={C.textMuted}
              />

              <Text style={addStyles.label}>Growing Medium</Text>
              <View style={addStyles.chipRow}>
                {MEDIUMS.map((m) => (
                  <Pressable key={m} style={[addStyles.chip, equipment.medium === m && addStyles.chipActive]}
                    onPress={() => setEquipment({ ...equipment, medium: m })}>
                    <Text style={[addStyles.chipText, equipment.medium === m && addStyles.chipTextActive]}>{m}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={addStyles.sectionLabel}>Other Equipment</Text>
              <Text style={addStyles.label}>Nutrient Brand</Text>
              <TextInput
                style={addStyles.input}
                value={equipment.nutrientBrand}
                onChangeText={(v) => setEquipment({ ...equipment, nutrientBrand: v })}
                placeholder="e.g. Fox Farm, General Hydroponics, Advanced Nutrients"
                placeholderTextColor={C.textMuted}
              />

              <Text style={addStyles.label}>Fan/Ventilation Setup</Text>
              <TextInput
                style={addStyles.input}
                value={equipment.fanType}
                onChangeText={(v) => setEquipment({ ...equipment, fanType: v })}
                placeholder="e.g. 6 inch inline fan + carbon filter, 2x oscillating"
                placeholderTextColor={C.textMuted}
              />

              <Text style={addStyles.label}>Other Gear (optional)</Text>
              <TextInput
                style={[addStyles.input, { minHeight: 70, textAlignVertical: "top" }]}
                value={equipment.otherGear}
                onChangeText={(v) => setEquipment({ ...equipment, otherGear: v })}
                placeholder="e.g. pH meter brand, CO2 setup, humidifier, AC unit, pH pens..."
                placeholderTextColor={C.textMuted}
                multiline
              />
            </>
          )}

          <View style={addStyles.navRow}>
            {step > 0 && (
              <Pressable style={addStyles.backBtn} onPress={() => setStep(step - 1)}>
                <Ionicons name="arrow-back" size={18} color={C.textSecondary} />
                <Text style={addStyles.backBtnText}>Back</Text>
              </Pressable>
            )}
            {step < 2 ? (
              <Pressable style={[addStyles.nextBtn, step === 0 && { flex: 1 }]} onPress={() => setStep(step + 1)}>
                <LinearGradient colors={["#4caf50", "#2e7d32"]} style={addStyles.nextBtnGrad}>
                  <Text style={addStyles.nextBtnText}>Next</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable style={addStyles.nextBtn} onPress={handleSave}>
                <LinearGradient colors={["#4caf50", "#2e7d32"]} style={addStyles.nextBtnGrad}>
                  <Ionicons name="leaf" size={18} color="#fff" />
                  <Text style={addStyles.nextBtnText}>Start Grow</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function GrowDetailModal({
  grow,
  onClose,
  onUpdate,
  onDelete,
}: {
  grow: Grow;
  onClose: () => void;
  onUpdate: (g: Grow) => void;
  onDelete: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");
  const [currentGrow, setCurrentGrow] = useState(grow);
  const [activeTab, setActiveTab] = useState<"log" | "equipment" | "info">("log");
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [selectedNoteImages, setSelectedNoteImages] = useState<string[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [harvestWeightInput, setHarvestWeightInput] = useState(grow.harvestWeight || "");
  const [dryWeightInput, setDryWeightInput] = useState(grow.dryWeight || "");
  const [curedWeightInput, setCuredWeightInput] = useState(grow.finalCuredWeight || "");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const stageColor = STAGE_COLORS[currentGrow.stage] || C.tint;

  const addNote = async (content?: string, tag?: string) => {
    const noteText = content ?? note.trim();
    if (!noteText && selectedNoteImages.length === 0) return;
    const newNote: GrowNote = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      dateTime: new Date().toISOString(),
      content: noteText,
      images: selectedNoteImages.length > 0 ? selectedNoteImages : undefined,
      tag: tag || undefined,
    };
    const updated = { ...currentGrow, notes: [newNote, ...currentGrow.notes] };
    setCurrentGrow(updated);
    onUpdate(updated);
    if (!content) setNote("");
    setSelectedNoteImages([]);
    await addXP(10, "totalLogs");
    if (selectedNoteImages.length > 0) await addXP(5, "totalPhotos");
  };

  const addPhotoToNote = async (camera: boolean) => {
    setAddingPhoto(true);
    try {
      const photos = camera ? await takePhoto() : await pickPhoto();
      if (photos.length > 0) setSelectedNoteImages(prev => [...prev, ...photos]);
    } finally {
      setAddingPhoto(false);
    }
  };

  const quickAction = async (actionLabel: string, actionTag: string, field: "waterings" | "nutrientFeedings" | "transplants" | "nodeCount" | "budCount") => {
    const newNote: GrowNote = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      dateTime: new Date().toISOString(),
      content: actionLabel,
      tag: actionTag,
    };
    const updated = {
      ...currentGrow,
      notes: [newNote, ...currentGrow.notes],
      [field]: (currentGrow[field] || 0) + 1,
    };
    setCurrentGrow(updated);
    onUpdate(updated);
    await addXP(10, "totalLogs");
  };

  const updateStage = async (newStage: string) => {
    let updated = { ...currentGrow, stage: newStage };
    if (newStage === "Harvested" && !currentGrow.harvestDate) {
      updated.harvestDate = new Date().toISOString();
      updated.dryingDays = updated.dryingDays || 10;
      await addXP(50, "totalHarvests");
      Alert.prompt
        ? Alert.prompt("Harvest Weight", "Enter wet harvest weight in grams:", (weight) => {
            if (weight) {
              const withWeight = { ...updated, harvestWeight: weight };
              setCurrentGrow(withWeight);
              onUpdate(withWeight);
            }
          }, "plain-text", "", "number-pad")
        : Alert.alert("Harvested!", "Congratulations on your harvest! Update the wet weight in the drying tracker below.");
    }
    if (newStage === "Curing" && !currentGrow.cureStartDate) {
      updated.cureStartDate = new Date().toISOString();
      updated.curingDays = updated.curingDays || 30;
      updated.burpSchedule = updated.burpSchedule || { burpCount: 0 };
    }
    setCurrentGrow(updated);
    onUpdate(updated);
  };

  const updateLightSchedule = (ls: string) => {
    const updated = { ...currentGrow, lightSchedule: ls };
    setCurrentGrow(updated);
    onUpdate(updated);
  };

  const handleDelete = () => {
    Alert.alert("Delete Grow", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { onDelete(grow.id); onClose(); } },
    ]);
  };

  const days = getDaysRunning(currentGrow.startDate);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[detStyles.container, { backgroundColor: C.background }]}>
        <View style={[detStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={detStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <View style={detStyles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={detStyles.growName}>{currentGrow.name}</Text>
              <Text style={detStyles.growStrain}>{currentGrow.strain} · {currentGrow.plantCount} plant{parseInt(currentGrow.plantCount) !== 1 ? "s" : ""}</Text>
            </View>
            <Pressable onPress={handleDelete} style={detStyles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color={C.danger} />
            </Pressable>
          </View>
          <View style={detStyles.metaRow}>
            <View style={[detStyles.stageBadge, { backgroundColor: stageColor + "22" }]}>
              <View style={[detStyles.stageDot, { backgroundColor: stageColor }]} />
              <Text style={[detStyles.stageText, { color: stageColor }]}>{currentGrow.stage}</Text>
            </View>
            <Text style={detStyles.metaText}>Day {days}</Text>
            <Text style={detStyles.metaSep}>·</Text>
            <Text style={detStyles.metaText}>{currentGrow.lightSchedule}</Text>
            <Text style={detStyles.metaSep}>·</Text>
            <Text style={detStyles.metaText}>{currentGrow.growType}</Text>
          </View>

          <View style={detStyles.tabRow}>
            {(["log", "equipment", "info"] as const).map((t) => (
              <Pressable key={t} style={[detStyles.tab, activeTab === t && detStyles.tabActive]} onPress={() => setActiveTab(t)}>
                <Text style={[detStyles.tabText, activeTab === t && detStyles.tabTextActive]}>
                  {t === "log" ? "Grow Log" : t === "equipment" ? "Equipment" : "Details"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[detStyles.content, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <VirtualPlant
            stage={currentGrow.stage}
            noteCount={currentGrow.notes.length}
            photoCount={currentGrow.notes.filter(n => getNoteImages(n).length > 0).length}
            daysSinceLastLog={currentGrow.notes.length > 0 ? Math.floor((Date.now() - new Date(currentGrow.notes[0].dateTime).getTime()) / (1000 * 60 * 60 * 24)) : days}
            recentLogCount={currentGrow.notes.filter(n => (Date.now() - new Date(n.dateTime).getTime()) < 7 * 24 * 60 * 60 * 1000).length}
            daysRunning={days}
            waterings={currentGrow.waterings || 0}
            nutrientFeedings={currentGrow.nutrientFeedings || 0}
            transplants={currentGrow.transplants || 0}
            nodeCount={currentGrow.nodeCount || 0}
            budCount={currentGrow.budCount || 0}
          />

          {activeTab === "log" && (
            <>
              <Text style={detStyles.sectionTitle}>Update Stage</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={detStyles.stageScroll}>
                {STAGES.map((s) => (
                  <Pressable
                    key={s}
                    style={[detStyles.stageChip, currentGrow.stage === s && { backgroundColor: (STAGE_COLORS[s] || C.tint) + "33", borderColor: STAGE_COLORS[s] || C.tint }]}
                    onPress={() => updateStage(s)}
                  >
                    <Text style={[detStyles.stageChipText, currentGrow.stage === s && { color: STAGE_COLORS[s] || C.tint }]}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={detStyles.sectionTitle}>Light Schedule</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={detStyles.stageScroll}>
                {LIGHT_SCHEDULES.map((ls) => (
                  <Pressable
                    key={ls}
                    style={[detStyles.stageChip, currentGrow.lightSchedule === ls && { backgroundColor: C.tint + "33", borderColor: C.tint }]}
                    onPress={() => updateLightSchedule(ls)}
                  >
                    <Text style={[detStyles.stageChipText, currentGrow.lightSchedule === ls && { color: C.tint }]}>{ls}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={detStyles.sectionTitle}>Quick Actions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                <Pressable style={[detStyles.quickActionBtn, { borderColor: "#42a5f5" }]} onPress={() => quickAction("Watered plants", "water", "waterings")}>
                  <Ionicons name="water-outline" size={14} color="#42a5f5" />
                  <Text style={[detStyles.quickActionText, { color: "#42a5f5" }]}>Water</Text>
                </Pressable>
                <Pressable style={[detStyles.quickActionBtn, { borderColor: "#66bb6a" }]} onPress={() => quickAction("Fed nutrients", "nutrient", "nutrientFeedings")}>
                  <Ionicons name="flask-outline" size={14} color="#66bb6a" />
                  <Text style={[detStyles.quickActionText, { color: "#66bb6a" }]}>Nutrients</Text>
                </Pressable>
                <Pressable style={[detStyles.quickActionBtn, { borderColor: "#ffa726" }]} onPress={() => quickAction("Transplanted to larger container", "transplant", "transplants")}>
                  <Ionicons name="resize-outline" size={14} color="#ffa726" />
                  <Text style={[detStyles.quickActionText, { color: "#ffa726" }]}>Transplant</Text>
                </Pressable>
                <Pressable style={[detStyles.quickActionBtn, { borderColor: "#26a69a" }]} onPress={() => quickAction("New node spotted", "node", "nodeCount")}>
                  <Ionicons name="git-branch-outline" size={14} color="#26a69a" />
                  <Text style={[detStyles.quickActionText, { color: "#26a69a" }]}>Node</Text>
                </Pressable>
                <Pressable style={[detStyles.quickActionBtn, { borderColor: "#ab47bc" }]} onPress={() => quickAction("New bud site forming", "bud", "budCount")}>
                  <Ionicons name="flower-outline" size={14} color="#ab47bc" />
                  <Text style={[detStyles.quickActionText, { color: "#ab47bc" }]}>Bud</Text>
                </Pressable>
              </ScrollView>

              {currentGrow.stage === "Harvested" && (() => {
                const dryingStart = currentGrow.harvestDate ? new Date(currentGrow.harvestDate) : new Date();
                const daysDrying = Math.max(0, Math.floor((Date.now() - dryingStart.getTime()) / (1000 * 60 * 60 * 24)));
                const targetDrying = currentGrow.dryingDays || 10;
                const dryingProgress = Math.min(1, daysDrying / targetDrying);
                return (
                  <>
                    <Text style={detStyles.sectionTitle}>Drying Tracker</Text>
                    <View style={htStyles.trackerCard}>
                      <View style={htStyles.trackerHeader}>
                        <Ionicons name="sunny-outline" size={20} color="#ffa726" />
                        <Text style={htStyles.trackerTitle}>Drying Progress</Text>
                      </View>
                      <View style={htStyles.progressBarBg}>
                        <View style={[htStyles.progressBarFill, { width: `${dryingProgress * 100}%`, backgroundColor: "#ffa726" }]} />
                      </View>
                      <Text style={htStyles.progressText}>Days drying: {daysDrying} / {targetDrying}</Text>
                      <View style={htStyles.conditionsCard}>
                        <Ionicons name="information-circle-outline" size={16} color={C.tint} />
                        <Text style={htStyles.conditionsText}>Optimal: 60-65F, 55-65% humidity, dark, gentle airflow</Text>
                      </View>
                      <View style={htStyles.weightRow}>
                        <Text style={htStyles.weightLabel}>Wet Weight (g)</Text>
                        <TextInput
                          style={htStyles.weightInput}
                          value={harvestWeightInput}
                          onChangeText={setHarvestWeightInput}
                          placeholder="0"
                          placeholderTextColor={C.textMuted}
                          keyboardType="numeric"
                          onBlur={() => {
                            if (harvestWeightInput !== currentGrow.harvestWeight) {
                              const u = { ...currentGrow, harvestWeight: harvestWeightInput };
                              setCurrentGrow(u);
                              onUpdate(u);
                            }
                          }}
                        />
                      </View>
                      <Text style={htStyles.quickLabel}>Quick Log</Text>
                      <View style={htStyles.quickRow}>
                        <Pressable style={htStyles.quickBtn} onPress={() => addNote("Checked stems - snap test", "drying")}>
                          <Ionicons name="hand-left-outline" size={14} color="#ffa726" />
                          <Text style={htStyles.quickBtnText}>Snap Test</Text>
                        </Pressable>
                        <Pressable style={htStyles.quickBtn} onPress={() => addNote("Trimmed buds", "drying")}>
                          <Ionicons name="cut-outline" size={14} color="#ffa726" />
                          <Text style={htStyles.quickBtnText}>Trim</Text>
                        </Pressable>
                        <Pressable style={htStyles.quickBtn} onPress={() => addNote("Adjusted drying environment", "drying")}>
                          <Ionicons name="thermometer-outline" size={14} color="#ffa726" />
                          <Text style={htStyles.quickBtnText}>Adjust Env</Text>
                        </Pressable>
                      </View>
                      <View style={htStyles.weightRow}>
                        <Text style={htStyles.weightLabel}>Dry Weight (g)</Text>
                        <TextInput
                          style={htStyles.weightInput}
                          value={dryWeightInput}
                          onChangeText={setDryWeightInput}
                          placeholder="0"
                          placeholderTextColor={C.textMuted}
                          keyboardType="numeric"
                        />
                      </View>
                      <Pressable
                        style={htStyles.moveBtn}
                        onPress={() => {
                          const u = {
                            ...currentGrow,
                            stage: "Curing",
                            dryWeight: dryWeightInput || currentGrow.dryWeight,
                            cureStartDate: new Date().toISOString(),
                            curingDays: currentGrow.curingDays || 30,
                            burpSchedule: currentGrow.burpSchedule || { burpCount: 0 },
                          };
                          setCurrentGrow(u);
                          onUpdate(u);
                        }}
                      >
                        <LinearGradient colors={["#8d6e63", "#5d4037"]} style={htStyles.moveBtnGrad}>
                          <Ionicons name="arrow-forward" size={16} color="#fff" />
                          <Text style={htStyles.moveBtnText}>Move to Curing</Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </>
                );
              })()}

              {currentGrow.stage === "Curing" && (() => {
                const curingStart = currentGrow.cureStartDate ? new Date(currentGrow.cureStartDate) : new Date();
                const daysCuring = Math.max(0, Math.floor((Date.now() - curingStart.getTime()) / (1000 * 60 * 60 * 24)));
                const targetCuring = currentGrow.curingDays || 30;
                const curingProgress = Math.min(1, daysCuring / targetCuring);
                const weekOfCure = Math.floor(daysCuring / 7) + 1;
                const burpAdvice = weekOfCure <= 2 ? "Burp jars 2-3x daily for 15 min" : weekOfCure <= 4 ? "Burp 1x daily for 10 min" : "Burp every 2-3 days";
                const lastBurp = currentGrow.burpSchedule?.lastBurp;
                const burpCount = currentGrow.burpSchedule?.burpCount || 0;
                const lastBurpText = lastBurp ? (() => {
                  const mins = Math.floor((Date.now() - new Date(lastBurp).getTime()) / 60000);
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return `${Math.floor(hrs / 24)}d ago`;
                })() : "Never";
                const milestones = [
                  { weeks: 2, label: "Smokeable", color: "#ffa726" },
                  { weeks: 4, label: "Good", color: "#66bb6a" },
                  { weeks: 8, label: "Excellent", color: "#42a5f5" },
                  { weeks: 12, label: "Premium", color: "#ab47bc" },
                ];
                return (
                  <>
                    <Text style={detStyles.sectionTitle}>Curing Tracker</Text>
                    <View style={htStyles.trackerCard}>
                      <View style={htStyles.trackerHeader}>
                        <Ionicons name="time-outline" size={20} color="#8d6e63" />
                        <Text style={htStyles.trackerTitle}>Curing Progress</Text>
                      </View>
                      <View style={htStyles.progressBarBg}>
                        <View style={[htStyles.progressBarFill, { width: `${curingProgress * 100}%`, backgroundColor: "#8d6e63" }]} />
                      </View>
                      <Text style={htStyles.progressText}>Days curing: {daysCuring} / {targetCuring}</Text>
                      <View style={htStyles.milestonesRow}>
                        {milestones.map((m) => {
                          const reached = daysCuring >= m.weeks * 7;
                          return (
                            <View key={m.label} style={[htStyles.milestone, reached && { borderColor: m.color, backgroundColor: m.color + "18" }]}>
                              <Ionicons name={reached ? "checkmark-circle" : "ellipse-outline"} size={14} color={reached ? m.color : C.textMuted} />
                              <Text style={[htStyles.milestoneText, reached && { color: m.color }]}>{m.weeks}w</Text>
                              <Text style={[htStyles.milestoneLabel, reached && { color: m.color }]}>{m.label}</Text>
                            </View>
                          );
                        })}
                      </View>
                      <View style={htStyles.burpSection}>
                        <Text style={htStyles.burpAdvice}>{burpAdvice}</Text>
                        <View style={htStyles.burpStats}>
                          <Text style={htStyles.burpStatText}>Last burp: {lastBurpText}</Text>
                          <Text style={htStyles.burpStatText}>Total burps: {burpCount}</Text>
                        </View>
                        <View style={htStyles.quickRow}>
                          <Pressable style={[htStyles.quickBtn, { borderColor: "#8d6e63" }]} onPress={() => {
                            const u = {
                              ...currentGrow,
                              burpSchedule: { lastBurp: new Date().toISOString(), burpCount: burpCount + 1 },
                            };
                            setCurrentGrow(u);
                            onUpdate(u);
                            addNote("Burped jars", "curing");
                          }}>
                            <Ionicons name="flask-outline" size={14} color="#8d6e63" />
                            <Text style={[htStyles.quickBtnText, { color: "#8d6e63" }]}>Burp Jars</Text>
                          </Pressable>
                          <Pressable style={[htStyles.quickBtn, { borderColor: "#42a5f5" }]} onPress={() => addNote("Checked jar humidity", "curing")}>
                            <Ionicons name="water-outline" size={14} color="#42a5f5" />
                            <Text style={[htStyles.quickBtnText, { color: "#42a5f5" }]}>Check RH</Text>
                          </Pressable>
                          <Pressable style={[htStyles.quickBtn, { borderColor: "#66bb6a" }]} onPress={() => addNote("Added humidity pack", "curing")}>
                            <Ionicons name="cube-outline" size={14} color="#66bb6a" />
                            <Text style={[htStyles.quickBtnText, { color: "#66bb6a" }]}>Boveda</Text>
                          </Pressable>
                        </View>
                      </View>
                      <View style={htStyles.weightRow}>
                        <Text style={htStyles.weightLabel}>Final Cured Weight (g)</Text>
                        <TextInput
                          style={htStyles.weightInput}
                          value={curedWeightInput}
                          onChangeText={setCuredWeightInput}
                          placeholder="0"
                          placeholderTextColor={C.textMuted}
                          keyboardType="numeric"
                        />
                      </View>
                      <Pressable
                        style={htStyles.moveBtn}
                        onPress={() => {
                          const u = {
                            ...currentGrow,
                            stage: "Done",
                            finalCuredWeight: curedWeightInput || currentGrow.finalCuredWeight,
                          };
                          setCurrentGrow(u);
                          onUpdate(u);
                        }}
                      >
                        <LinearGradient colors={["#546e7a", "#37474f"]} style={htStyles.moveBtnGrad}>
                          <Ionicons name="checkmark-circle" size={16} color="#fff" />
                          <Text style={htStyles.moveBtnText}>Mark as Done</Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </>
                );
              })()}

              {currentGrow.stage === "Done" && (() => {
                const totalDays = getDaysRunning(currentGrow.startDate);
                const wetWeight = parseFloat(currentGrow.harvestWeight || "0");
                const dWeight = parseFloat(currentGrow.dryWeight || "0");
                const curedWeight = parseFloat(currentGrow.finalCuredWeight || "0");
                const weightLoss = wetWeight > 0 && dWeight > 0 ? (((wetWeight - dWeight) / wetWeight) * 100).toFixed(1) : null;
                const curingDuration = currentGrow.cureStartDate
                  ? Math.floor((Date.now() - new Date(currentGrow.cureStartDate).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                return (
                  <>
                    <Text style={detStyles.sectionTitle}>Harvest Summary</Text>
                    <View style={htStyles.summaryCard}>
                      <View style={htStyles.summaryHeader}>
                        <Ionicons name="trophy" size={24} color="#ffd54f" />
                        <Text style={htStyles.summaryTitle}>Grow Complete</Text>
                      </View>
                      <View style={htStyles.summaryGrid}>
                        <View style={htStyles.summaryItem}>
                          <Text style={htStyles.summaryValue}>{totalDays}</Text>
                          <Text style={htStyles.summaryLabel}>Total Days</Text>
                        </View>
                        {wetWeight > 0 && (
                          <View style={htStyles.summaryItem}>
                            <Text style={htStyles.summaryValue}>{wetWeight}g</Text>
                            <Text style={htStyles.summaryLabel}>Wet Weight</Text>
                          </View>
                        )}
                        {dWeight > 0 && (
                          <View style={htStyles.summaryItem}>
                            <Text style={htStyles.summaryValue}>{dWeight}g</Text>
                            <Text style={htStyles.summaryLabel}>Dry Weight</Text>
                          </View>
                        )}
                        {curedWeight > 0 && (
                          <View style={htStyles.summaryItem}>
                            <Text style={htStyles.summaryValue}>{curedWeight}g</Text>
                            <Text style={htStyles.summaryLabel}>Cured Weight</Text>
                          </View>
                        )}
                        {weightLoss && (
                          <View style={htStyles.summaryItem}>
                            <Text style={htStyles.summaryValue}>{weightLoss}%</Text>
                            <Text style={htStyles.summaryLabel}>Weight Loss</Text>
                          </View>
                        )}
                        {curingDuration > 0 && (
                          <View style={htStyles.summaryItem}>
                            <Text style={htStyles.summaryValue}>{curingDuration}d</Text>
                            <Text style={htStyles.summaryLabel}>Cure Time</Text>
                          </View>
                        )}
                      </View>
                      {currentGrow.harvestDate && (
                        <Text style={htStyles.summaryDate}>Harvested: {formatDate(currentGrow.harvestDate)}</Text>
                      )}
                    </View>
                  </>
                );
              })()}

              <Text style={detStyles.sectionTitle}>Add Log Entry</Text>
              {selectedNoteImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  {selectedNoteImages.map((img, idx) => (
                    <View key={idx} style={[detStyles.notePreviewImg, { width: 100, marginRight: 8 }]}>
                      <Image source={{ uri: `data:image/jpeg;base64,${img}` }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                      <Pressable style={detStyles.removePreviewBtn} onPress={() => setSelectedNoteImages(prev => prev.filter((_, i) => i !== idx))}>
                        <Ionicons name="close-circle" size={22} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              )}
              <View style={detStyles.noteInput}>
                <TextInput
                  style={detStyles.noteTextInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Log observations, pH, EC, watering, issues..."
                  placeholderTextColor={C.textMuted}
                  multiline
                  numberOfLines={3}
                />
                <View style={detStyles.noteBtns}>
                  <Pressable style={detStyles.noteIconBtn} onPress={() => addPhotoToNote(false)} disabled={addingPhoto}>
                    {addingPhoto ? <ActivityIndicator size="small" color={C.tint} /> : <Ionicons name="image-outline" size={20} color={C.tint} />}
                  </Pressable>
                  <Pressable style={detStyles.noteIconBtn} onPress={() => addPhotoToNote(true)} disabled={addingPhoto}>
                    <Ionicons name="camera-outline" size={20} color={C.tint} />
                  </Pressable>
                  <Pressable style={detStyles.sendBtn} onPress={() => addNote()}>
                    <Ionicons name="send" size={16} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <Text style={detStyles.sectionTitle}>Grow Log ({currentGrow.notes.length})</Text>
              {currentGrow.notes.length === 0 ? (
                <View style={detStyles.emptyLog}>
                  <Ionicons name="document-text-outline" size={32} color={C.textMuted} />
                  <Text style={detStyles.emptyLogText}>No entries yet. Start logging your grow!</Text>
                </View>
              ) : (
                currentGrow.notes.map((n) => {
                  const imgs = getNoteImages(n);
                  return (
                    <View key={n.id} style={detStyles.noteCard}>
                      <View style={detStyles.noteMeta}>
                        <Ionicons name="time-outline" size={12} color={C.textMuted} />
                        <Text style={detStyles.noteDate}>{n.date}</Text>
                        {n.tag && (
                          <View style={[detStyles.tagBadge, { backgroundColor: n.tag === "water" ? "#42a5f522" : n.tag === "nutrient" ? "#66bb6a22" : n.tag === "transplant" ? "#ffa72622" : n.tag === "node" ? "#26a69a22" : n.tag === "bud" ? "#ab47bc22" : C.backgroundTertiary }]}>
                            <Text style={[detStyles.tagText, { color: n.tag === "water" ? "#42a5f5" : n.tag === "nutrient" ? "#66bb6a" : n.tag === "transplant" ? "#ffa726" : n.tag === "node" ? "#26a69a" : n.tag === "bud" ? "#ab47bc" : C.textMuted }]}>{n.tag}</Text>
                          </View>
                        )}
                      </View>
                      {n.content ? <Text style={detStyles.noteContent}>{n.content}</Text> : null}
                      {imgs.length === 1 && (
                        <Pressable onPress={() => setViewingImage(imgs[0])}>
                          <Image
                            source={{ uri: `data:image/jpeg;base64,${imgs[0]}` }}
                            style={detStyles.noteImage}
                            resizeMode="cover"
                          />
                          <View style={detStyles.imageTap}>
                            <Ionicons name="expand-outline" size={16} color="#fff" />
                          </View>
                        </Pressable>
                      )}
                      {imgs.length > 1 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                          {imgs.map((img, idx) => (
                            <Pressable key={idx} onPress={() => setViewingImage(img)} style={{ marginRight: 8 }}>
                              <Image
                                source={{ uri: `data:image/jpeg;base64,${img}` }}
                                style={{ width: 140, height: 140, borderRadius: 10 }}
                                resizeMode="cover"
                              />
                              <View style={detStyles.imageTap}>
                                <Ionicons name="expand-outline" size={16} color="#fff" />
                              </View>
                            </Pressable>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}

          {activeTab === "equipment" && (
            <>
              {[
                { label: "Light Type", value: currentGrow.equipment.lightType, icon: "sunny-outline" },
                { label: "Wattage", value: currentGrow.equipment.lightWattage, icon: "flash-outline" },
                { label: "Light Brand/Model", value: currentGrow.equipment.lightBrand, icon: "pricetag-outline" },
                { label: "Grow Space", value: currentGrow.equipment.tentSize, icon: "square-outline" },
                { label: "Medium", value: currentGrow.equipment.medium, icon: "layers-outline" },
                { label: "Nutrients", value: currentGrow.equipment.nutrientBrand, icon: "flask-outline" },
                { label: "Ventilation", value: currentGrow.equipment.fanType, icon: "cloud-outline" },
                { label: "Other Gear", value: currentGrow.equipment.otherGear, icon: "construct-outline" },
              ].filter(item => item.value).map((item) => (
                <View key={item.label} style={detStyles.equipRow}>
                  <View style={detStyles.equipIcon}>
                    <Ionicons name={item.icon as any} size={18} color={C.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={detStyles.equipLabel}>{item.label}</Text>
                    <Text style={detStyles.equipValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
              {!Object.values(currentGrow.equipment).some(Boolean) && (
                <View style={detStyles.emptyLog}>
                  <Ionicons name="build-outline" size={32} color={C.textMuted} />
                  <Text style={detStyles.emptyLogText}>No equipment info logged.</Text>
                </View>
              )}
            </>
          )}

          {activeTab === "info" && (
            <>
              {[
                { label: "Strain", value: currentGrow.strain, icon: "leaf-outline" },
                { label: "Plant Count", value: `${currentGrow.plantCount} plant${parseInt(currentGrow.plantCount) !== 1 ? "s" : ""}`, icon: "apps-outline" },
                { label: "Plant Type", value: currentGrow.growType, icon: "flower-outline" },
                { label: "Start Date", value: formatDate(currentGrow.startDate), icon: "calendar-outline" },
                { label: "Days Running", value: `${getDaysRunning(currentGrow.startDate)} days`, icon: "time-outline" },
                { label: "Current Stage", value: currentGrow.stage, icon: "git-network-outline" },
                { label: "Light Schedule", value: currentGrow.lightSchedule, icon: "sunny-outline" },
              ].map((item) => (
                <View key={item.label} style={detStyles.equipRow}>
                  <View style={detStyles.equipIcon}>
                    <Ionicons name={item.icon as any} size={18} color={C.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={detStyles.equipLabel}>{item.label}</Text>
                    <Text style={detStyles.equipValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>

      {viewingImage && (
        <Modal visible animationType="fade" transparent>
          <Pressable style={detStyles.imageViewer} onPress={() => setViewingImage(null)}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${viewingImage}` }}
              style={detStyles.fullImage}
              resizeMode="contain"
            />
            <Pressable style={detStyles.closeImageBtn} onPress={() => setViewingImage(null)}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </Modal>
  );
}

export default function GrowsScreen() {
  const insets = useSafeAreaInsets();
  const [grows, setGrows] = useState<Grow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedGrow, setSelectedGrow] = useState<Grow | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const loadGrows = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setGrows(JSON.parse(stored));
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { loadGrows(); }, [loadGrows]));

  const saveGrows = async (updated: Grow[]) => {
    setGrows(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addGrow = async (grow: Grow) => {
    await saveGrows([grow, ...grows]);
    setShowAdd(false);
    await addXP(20, "totalGrows");
  };

  const updateGrow = async (updated: Grow) => {
    const newGrows = grows.map((g) => (g.id === updated.id ? updated : g));
    await saveGrows(newGrows);
    if (selectedGrow?.id === updated.id) setSelectedGrow(updated);
  };

  const deleteGrow = async (id: string) => {
    await saveGrows(grows.filter((g) => g.id !== id));
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
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>My Grows</Text>
              <Text style={styles.headerSub}>
                {grows.length === 0 ? "No active grows" : `${grows.length} grow${grows.length !== 1 ? "s" : ""} tracked`}
              </Text>
            </View>
            <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
              <Ionicons name="add" size={24} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {grows.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="leaf-outline" size={48} color={C.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Grows Yet</Text>
              <Text style={styles.emptyText}>
                Track your plants from seed to harvest. Log your start date, equipment, light schedule, and add photo updates as your grow progresses.
              </Text>
              <Pressable style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
                <Text style={styles.emptyBtnText}>Start First Grow</Text>
              </Pressable>
            </View>
          ) : (
            grows.map((grow) => {
              const stageColor = STAGE_COLORS[grow.stage] || C.tint;
              const days = getDaysRunning(grow.startDate);
              const latestPhoto = (() => {
                for (const n of grow.notes) {
                  const imgs = getNoteImages(n);
                  if (imgs.length > 0) return imgs[0];
                }
                return undefined;
              })();
              return (
                <Pressable
                  key={grow.id}
                  style={({ pressed }) => [styles.growCard, pressed && { opacity: 0.8 }]}
                  onPress={() => setSelectedGrow(grow)}
                >
                  {latestPhoto && (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${latestPhoto}` }}
                      style={styles.growCardPhoto}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.growCardContent}>
                    <View style={styles.growCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.growName}>{grow.name}</Text>
                        <Text style={styles.growStrain}>{grow.strain}</Text>
                      </View>
                      <View style={[styles.stagePill, { backgroundColor: stageColor + "22" }]}>
                        <View style={[styles.stageDot, { backgroundColor: stageColor }]} />
                        <Text style={[styles.stageText, { color: stageColor }]}>{grow.stage}</Text>
                      </View>
                    </View>
                    <View style={styles.growStats}>
                      <View style={styles.growStat}>
                        <Ionicons name="calendar-outline" size={13} color={C.textMuted} />
                        <Text style={styles.growStatText}>Day {days}</Text>
                      </View>
                      <View style={styles.growStat}>
                        <Ionicons name="sunny-outline" size={13} color={C.textMuted} />
                        <Text style={styles.growStatText}>{grow.lightSchedule}</Text>
                      </View>
                      <View style={styles.growStat}>
                        <Ionicons name="apps-outline" size={13} color={C.textMuted} />
                        <Text style={styles.growStatText}>{grow.plantCount}p</Text>
                      </View>
                      <View style={styles.growStat}>
                        <Ionicons name="document-text-outline" size={13} color={C.textMuted} />
                        <Text style={styles.growStatText}>{grow.notes.length} logs</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {showAdd && <AddGrowModal onClose={() => setShowAdd(false)} onSave={addGrow} />}
      {selectedGrow && (
        <GrowDetailModal
          grow={selectedGrow}
          onClose={() => setSelectedGrow(null)}
          onUpdate={updateGrow}
          onDelete={deleteGrow}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 30, color: C.text },
  headerSub: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 12 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Nunito_700Bold", fontSize: 20, color: C.text },
  emptyText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center", paddingHorizontal: 32, lineHeight: 21 },
  emptyBtn: { backgroundColor: C.tint, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
  growCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden" },
  growCardPhoto: { width: "100%", height: 140 },
  growCardContent: { padding: 14, gap: 10 },
  growCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  growName: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text },
  growStrain: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  stagePill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stageDot: { width: 6, height: 6, borderRadius: 3 },
  stageText: { fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  growStats: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  growStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  growStatText: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted },
});

const addStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  closeBtn: { alignSelf: "flex-end", marginBottom: 8 },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: C.text, marginBottom: 16 },
  stepRow: { flexDirection: "row", gap: 8 },
  stepIndicator: { flex: 1, alignItems: "center", gap: 6 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  stepLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 11, color: C.textMuted, textAlign: "center" },
  content: { padding: 16, gap: 10 },
  label: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.textSecondary },
  sublabel: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted, marginTop: -6, lineHeight: 18 },
  sectionLabel: { fontFamily: "Nunito_800ExtraBold", fontSize: 16, color: C.text, marginTop: 8 },
  input: { backgroundColor: C.card, borderRadius: 12, padding: 14, fontFamily: "Nunito_400Regular", fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.cardBorder },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  chipActive: { backgroundColor: C.tint + "22", borderColor: C.tint },
  chipText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textSecondary },
  chipTextActive: { color: C.tint },
  dateCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.tint + "18", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.tint + "44" },
  dateLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted },
  dateValue: { fontFamily: "Nunito_700Bold", fontSize: 18, color: C.text },
  daysRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  daysBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.cardBorder },
  daysInput: { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 14, fontFamily: "Nunito_700Bold", fontSize: 24, color: C.text, borderWidth: 1, borderColor: C.cardBorder },
  daysSub: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.tint, textAlign: "center" },
  navRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  backBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: C.backgroundTertiary, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  backBtnText: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.textSecondary },
  nextBtn: { flex: 2, borderRadius: 14, overflow: "hidden" },
  nextBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14 },
  nextBtnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
});

const detStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  closeBtn: { alignSelf: "flex-end", marginBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  growName: { fontFamily: "Nunito_800ExtraBold", fontSize: 20, color: C.text },
  growStrain: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary },
  deleteBtn: { padding: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  stageBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stageDot: { width: 6, height: 6, borderRadius: 3 },
  stageText: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  metaText: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted },
  metaSep: { color: C.textMuted, fontSize: 12 },
  tabRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.cardBorder },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.tint },
  tabText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textMuted },
  tabTextActive: { color: C.tint },
  content: { padding: 16, gap: 12 },
  sectionTitle: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text, marginTop: 4 },
  stageScroll: { marginBottom: 4 },
  stageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, marginRight: 8 },
  stageChipText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted },
  noteInput: { backgroundColor: C.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.cardBorder, gap: 8 },
  noteTextInput: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.text, minHeight: 60, textAlignVertical: "top" },
  noteBtns: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "flex-end" },
  noteIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" },
  notePreviewImg: { position: "relative", borderRadius: 10, overflow: "hidden" },
  notePreviewImage: { width: "100%", height: 150, borderRadius: 10 },
  removePreviewBtn: { position: "absolute", top: 8, right: 8 },
  emptyLog: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyLogText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted, textAlign: "center" },
  noteCard: { backgroundColor: C.backgroundTertiary, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.cardBorder, gap: 6 },
  noteMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  noteDate: { fontFamily: "Nunito_600SemiBold", fontSize: 11, color: C.textMuted },
  noteContent: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.text, lineHeight: 20 },
  noteImage: { width: "100%", height: 180, borderRadius: 10, marginTop: 6 },
  imageTap: { position: "absolute", bottom: 10, right: 10, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8, padding: 4 },
  equipRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  equipIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center" },
  equipLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted, marginBottom: 2 },
  equipValue: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.text },
  quickActionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8, backgroundColor: C.card },
  quickActionText: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  tagText: { fontFamily: "Nunito_600SemiBold", fontSize: 10, textTransform: "capitalize" as const },
  imageViewer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  fullImage: { width: "100%", height: "80%" },
  closeImageBtn: { position: "absolute", top: 60, right: 20 },
});

const htStyles = StyleSheet.create({
  trackerCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder, gap: 10 },
  trackerHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  trackerTitle: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text },
  progressBarBg: { height: 8, backgroundColor: C.backgroundTertiary, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textSecondary, textAlign: "center" },
  conditionsCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.tint + "12", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.tint + "33" },
  conditionsText: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textSecondary, flex: 1 },
  weightRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  weightLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textSecondary },
  weightInput: { width: 80, backgroundColor: C.backgroundTertiary, borderRadius: 10, padding: 8, fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text, textAlign: "center", borderWidth: 1, borderColor: C.cardBorder },
  quickLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted },
  quickRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  quickBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#ffa726", backgroundColor: C.backgroundTertiary },
  quickBtnText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: "#ffa726" },
  moveBtn: { borderRadius: 12, overflow: "hidden", marginTop: 4 },
  moveBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12 },
  moveBtnText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: "#fff" },
  burpSection: { gap: 8 },
  burpAdvice: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: "#8d6e63", textAlign: "center" },
  burpStats: { flexDirection: "row", justifyContent: "space-around" },
  burpStatText: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted },
  milestonesRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  milestone: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.backgroundTertiary },
  milestoneText: { fontFamily: "Nunito_700Bold", fontSize: 13, color: C.textMuted },
  milestoneLabel: { fontFamily: "Nunito_400Regular", fontSize: 10, color: C.textMuted },
  summaryCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#ffd54f44", gap: 12 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 18, color: "#ffd54f" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryItem: { width: "30%" as any, alignItems: "center", backgroundColor: C.backgroundTertiary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 6 },
  summaryValue: { fontFamily: "Nunito_800ExtraBold", fontSize: 18, color: C.text },
  summaryLabel: { fontFamily: "Nunito_400Regular", fontSize: 11, color: C.textMuted, textAlign: "center" as const },
  summaryDate: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted, textAlign: "center" as const },
});
