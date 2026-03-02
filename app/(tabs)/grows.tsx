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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { useFocusEffect } from "expo-router";

const C = Colors.dark;
const STORAGE_KEY = "cannagrow_grows";

interface GrowNote {
  id: string;
  date: string;
  content: string;
}

interface Grow {
  id: string;
  name: string;
  strain: string;
  medium: string;
  startDate: string;
  stage: string;
  notes: GrowNote[];
  createdAt: string;
}

const STAGES = [
  "Germination",
  "Seedling",
  "Early Vegetative",
  "Late Vegetative",
  "Pre-Flower",
  "Early Flower",
  "Mid Flower",
  "Late Flower",
  "Harvest Ready",
  "Harvested",
  "Curing",
  "Done",
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

const MEDIUMS = ["Soil", "Coco Coir", "DWC Hydro", "Aeroponics", "Rockwool", "Other"];

function getDaysRunning(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function AddGrowModal({ onClose, onSave }: { onClose: () => void; onSave: (g: Grow) => void }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [strain, setStrain] = useState("");
  const [medium, setMedium] = useState("Soil");
  const [stage, setStage] = useState("Seedling");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a grow name");
      return;
    }
    const grow: Grow = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      strain: strain.trim() || "Unknown",
      medium,
      stage,
      startDate: new Date().toISOString(),
      notes: [],
      createdAt: new Date().toISOString(),
    };
    onSave(grow);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[mStyles.container, { backgroundColor: C.background }]}>
        <View style={[mStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={mStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <Text style={mStyles.title}>Start New Grow</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[mStyles.content, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={mStyles.label}>Grow Name *</Text>
          <TextInput
            style={mStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Winter 2025 Grow"
            placeholderTextColor={C.textMuted}
            returnKeyType="next"
          />

          <Text style={mStyles.label}>Strain</Text>
          <TextInput
            style={mStyles.input}
            value={strain}
            onChangeText={setStrain}
            placeholder="e.g. Blue Dream, OG Kush..."
            placeholderTextColor={C.textMuted}
            returnKeyType="done"
          />

          <Text style={mStyles.label}>Growing Medium</Text>
          <View style={mStyles.chipRow}>
            {MEDIUMS.map((m) => (
              <Pressable
                key={m}
                style={[mStyles.chip, medium === m && mStyles.chipActive]}
                onPress={() => setMedium(m)}
              >
                <Text style={[mStyles.chipText, medium === m && mStyles.chipTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={mStyles.label}>Current Stage</Text>
          <View style={mStyles.chipRow}>
            {STAGES.slice(0, 4).map((s) => (
              <Pressable
                key={s}
                style={[mStyles.chip, stage === s && mStyles.chipActive]}
                onPress={() => setStage(s)}
              >
                <Text style={[mStyles.chipText, stage === s && mStyles.chipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={mStyles.saveBtn} onPress={handleSave}>
            <LinearGradient colors={["#4caf50", "#2e7d32"]} style={mStyles.saveBtnGradient}>
              <Ionicons name="leaf" size={18} color="#fff" />
              <Text style={mStyles.saveBtnText}>Start Grow</Text>
            </LinearGradient>
          </Pressable>
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
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const stageColor = STAGE_COLORS[currentGrow.stage] || C.tint;

  const addNote = () => {
    if (!note.trim()) return;
    const newNote: GrowNote = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      content: note.trim(),
    };
    const updated = { ...currentGrow, notes: [newNote, ...currentGrow.notes] };
    setCurrentGrow(updated);
    onUpdate(updated);
    setNote("");
  };

  const updateStage = (newStage: string) => {
    const updated = { ...currentGrow, stage: newStage };
    setCurrentGrow(updated);
    onUpdate(updated);
  };

  const handleDelete = () => {
    Alert.alert("Delete Grow", "Are you sure you want to delete this grow? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { onDelete(grow.id); onClose(); } },
    ]);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[dStyles.container, { backgroundColor: C.background }]}>
        <View style={[dStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={dStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <View style={dStyles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={dStyles.growName}>{currentGrow.name}</Text>
              <Text style={dStyles.growStrain}>{currentGrow.strain}</Text>
            </View>
            <Pressable onPress={handleDelete} style={dStyles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color={C.danger} />
            </Pressable>
          </View>
          <View style={dStyles.metaRow}>
            <View style={[dStyles.stageBadge, { backgroundColor: stageColor + "22" }]}>
              <View style={[dStyles.stageDot, { backgroundColor: stageColor }]} />
              <Text style={[dStyles.stageText, { color: stageColor }]}>{currentGrow.stage}</Text>
            </View>
            <Text style={dStyles.metaText}>{getDaysRunning(currentGrow.startDate)} days</Text>
            <Text style={dStyles.metaSep}>·</Text>
            <Text style={dStyles.metaText}>{currentGrow.medium}</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[dStyles.content, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={dStyles.sectionTitle}>Update Stage</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dStyles.stageScroll}>
            {STAGES.map((s) => (
              <Pressable
                key={s}
                style={[dStyles.stageChip, currentGrow.stage === s && { backgroundColor: (STAGE_COLORS[s] || C.tint) + "33", borderColor: STAGE_COLORS[s] || C.tint }]}
                onPress={() => updateStage(s)}
              >
                <Text style={[dStyles.stageChipText, currentGrow.stage === s && { color: STAGE_COLORS[s] || C.tint }]}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={dStyles.sectionTitle}>Add Note</Text>
          <View style={dStyles.noteInput}>
            <TextInput
              style={dStyles.noteTextInput}
              value={note}
              onChangeText={setNote}
              placeholder="Log observations, measurements, issues..."
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={3}
            />
            <Pressable style={dStyles.noteBtn} onPress={addNote}>
              <Ionicons name="send" size={18} color={C.tint} />
            </Pressable>
          </View>

          <Text style={dStyles.sectionTitle}>Grow Log ({currentGrow.notes.length})</Text>
          {currentGrow.notes.length === 0 ? (
            <View style={dStyles.emptyLog}>
              <Ionicons name="document-text-outline" size={32} color={C.textMuted} />
              <Text style={dStyles.emptyLogText}>No notes yet. Start logging your grow!</Text>
            </View>
          ) : (
            currentGrow.notes.map((n) => (
              <View key={n.id} style={dStyles.noteCard}>
                <Text style={dStyles.noteDate}>{n.date}</Text>
                <Text style={dStyles.noteContent}>{n.content}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
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
    const updated = [grow, ...grows];
    await saveGrows(updated);
    setShowAdd(false);
  };

  const updateGrow = async (updated: Grow) => {
    const newGrows = grows.map((g) => (g.id === updated.id ? updated : g));
    await saveGrows(newGrows);
    if (selectedGrow?.id === updated.id) setSelectedGrow(updated);
  };

  const deleteGrow = async (id: string) => {
    const newGrows = grows.filter((g) => g.id !== id);
    await saveGrows(newGrows);
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
              <Text style={styles.headerSub}>{grows.length} active grow{grows.length !== 1 ? "s" : ""}</Text>
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
              <Text style={styles.emptyText}>Tap the + button to start tracking your first grow. Log stages, take notes, and monitor progress.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
                <Text style={styles.emptyBtnText}>Start First Grow</Text>
              </Pressable>
            </View>
          ) : (
            grows.map((grow) => {
              const stageColor = STAGE_COLORS[grow.stage] || C.tint;
              const days = getDaysRunning(grow.startDate);
              return (
                <Pressable
                  key={grow.id}
                  style={({ pressed }) => [styles.growCard, pressed && { opacity: 0.8 }]}
                  onPress={() => setSelectedGrow(grow)}
                >
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
                      <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
                      <Text style={styles.growStatText}>Day {days}</Text>
                    </View>
                    <View style={styles.growStat}>
                      <Ionicons name="layers-outline" size={14} color={C.textMuted} />
                      <Text style={styles.growStatText}>{grow.medium}</Text>
                    </View>
                    <View style={styles.growStat}>
                      <Ionicons name="document-text-outline" size={14} color={C.textMuted} />
                      <Text style={styles.growStatText}>{grow.notes.length} notes</Text>
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 12 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: "Nunito_700Bold", fontSize: 20, color: C.text },
  emptyText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 21,
  },
  emptyBtn: {
    backgroundColor: C.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
  growCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 12,
  },
  growCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  growName: { fontFamily: "Nunito_700Bold", fontSize: 17, color: C.text },
  growStrain: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  stagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stageDot: { width: 6, height: 6, borderRadius: 3 },
  stageText: { fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  growStats: { flexDirection: "row", gap: 16 },
  growStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  growStatText: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted },
});

const mStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  closeBtn: { alignSelf: "flex-end", marginBottom: 12 },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 24, color: C.text, marginBottom: 4 },
  content: { padding: 16, gap: 12 },
  label: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: C.text,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 8,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  chipActive: { backgroundColor: C.tint + "22", borderColor: C.tint },
  chipText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textSecondary },
  chipTextActive: { color: C.tint },
  saveBtn: { marginTop: 16, borderRadius: 14, overflow: "hidden" },
  saveBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 },
  saveBtnText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#fff" },
});

const dStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  closeBtn: { alignSelf: "flex-end", marginBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  growName: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: C.text },
  growStrain: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary },
  deleteBtn: { padding: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stageDot: { width: 6, height: 6, borderRadius: 3 },
  stageText: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  metaText: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textMuted },
  metaSep: { color: C.textMuted },
  content: { padding: 16, gap: 12 },
  sectionTitle: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text, marginTop: 4 },
  stageScroll: { marginBottom: 4 },
  stageChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginRight: 8,
  },
  stageChipText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted },
  noteInput: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: "flex-end",
  },
  noteTextInput: {
    flex: 1,
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: C.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
  noteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyLog: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyLogText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted, textAlign: "center" },
  noteCard: {
    backgroundColor: C.backgroundTertiary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 6,
  },
  noteDate: { fontFamily: "Nunito_600SemiBold", fontSize: 11, color: C.textMuted },
  noteContent: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.text, lineHeight: 20 },
});
