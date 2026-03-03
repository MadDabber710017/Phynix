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
import * as FileSystem from "expo-file-system";
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

async function pickPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;
  const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: false, mediaTypes: ["images"] });
  if (result.canceled || !result.assets[0]) return null;
  const uri = result.assets[0].uri;
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
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") return null;
  const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: false, mediaTypes: ["images"] });
  if (result.canceled || !result.assets[0]) return null;
  const uri = result.assets[0].uri;
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
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
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
  const [selectedNoteImage, setSelectedNoteImage] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const stageColor = STAGE_COLORS[currentGrow.stage] || C.tint;

  const addNote = async () => {
    if (!note.trim() && !selectedNoteImage) return;
    const newNote: GrowNote = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      dateTime: new Date().toISOString(),
      content: note.trim(),
      imageBase64: selectedNoteImage || undefined,
    };
    const updated = { ...currentGrow, notes: [newNote, ...currentGrow.notes] };
    setCurrentGrow(updated);
    onUpdate(updated);
    setNote("");
    setSelectedNoteImage(null);
    await addXP(10, "totalLogs");
    if (selectedNoteImage) await addXP(5, "totalPhotos");
  };

  const addPhotoToNote = async (camera: boolean) => {
    setAddingPhoto(true);
    try {
      const base64 = camera ? await takePhoto() : await pickPhoto();
      if (base64) setSelectedNoteImage(base64);
    } finally {
      setAddingPhoto(false);
    }
  };

  const updateStage = (newStage: string) => {
    const updated = { ...currentGrow, stage: newStage };
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
            photoCount={currentGrow.notes.filter(n => !!n.imageBase64).length}
            daysSinceLastLog={currentGrow.notes.length > 0 ? Math.floor((Date.now() - new Date(currentGrow.notes[0].dateTime).getTime()) / (1000 * 60 * 60 * 24)) : days}
            recentLogCount={currentGrow.notes.filter(n => (Date.now() - new Date(n.dateTime).getTime()) < 7 * 24 * 60 * 60 * 1000).length}
            daysRunning={days}
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

              <Text style={detStyles.sectionTitle}>Add Log Entry</Text>
              {selectedNoteImage && (
                <View style={detStyles.notePreviewImg}>
                  <Image source={{ uri: `data:image/jpeg;base64,${selectedNoteImage}` }} style={detStyles.notePreviewImage} />
                  <Pressable style={detStyles.removePreviewBtn} onPress={() => setSelectedNoteImage(null)}>
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </Pressable>
                </View>
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
                  <Pressable style={detStyles.sendBtn} onPress={addNote}>
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
                currentGrow.notes.map((n) => (
                  <View key={n.id} style={detStyles.noteCard}>
                    <View style={detStyles.noteMeta}>
                      <Ionicons name="time-outline" size={12} color={C.textMuted} />
                      <Text style={detStyles.noteDate}>{n.date}</Text>
                    </View>
                    {n.content ? <Text style={detStyles.noteContent}>{n.content}</Text> : null}
                    {n.imageBase64 && (
                      <Pressable onPress={() => setViewingImage(n.imageBase64!)}>
                        <Image
                          source={{ uri: `data:image/jpeg;base64,${n.imageBase64}` }}
                          style={detStyles.noteImage}
                          resizeMode="cover"
                        />
                        <View style={detStyles.imageTap}>
                          <Ionicons name="expand-outline" size={16} color="#fff" />
                        </View>
                      </Pressable>
                    )}
                  </View>
                ))
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
              const latestPhoto = grow.notes.find(n => n.imageBase64)?.imageBase64;
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
  imageViewer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  fullImage: { width: "100%", height: "80%" },
  closeImageBtn: { position: "absolute", top: 60, right: 20 },
});
