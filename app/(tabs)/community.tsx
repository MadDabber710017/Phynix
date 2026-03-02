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
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { getApiUrl } from "@/lib/query-client";

const C = Colors.dark;

const STAGES = [
  "Seedling", "Early Vegetative", "Late Vegetative", "Pre-Flower",
  "Early Flower", "Mid Flower", "Late Flower", "Harvest Ready", "Harvested", "Curing",
];

const STAGE_COLORS: Record<string, string> = {
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
};

interface Post {
  id: number;
  grower_name: string;
  strain: string;
  stage: string;
  title: string;
  description: string;
  image_base64?: string;
  likes: number;
  created_at: string;
  liked_by_me: boolean;
}

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem("cannagrow_device_id");
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    await AsyncStorage.setItem("cannagrow_device_id", id);
  }
  return id;
}

async function getGrowerName(): Promise<string> {
  return (await AsyncStorage.getItem("cannagrow_grower_name")) || "";
}

function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

async function pickPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;
  const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.4, base64: false });
  if (result.canceled || !result.assets[0]) return null;
  const uri = result.assets[0].uri;
  if (Platform.OS === "web") {
    const res = await fetch(uri);
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
  const result = await ImagePicker.launchCameraAsync({ quality: 0.4, base64: false });
  if (result.canceled || !result.assets[0]) return null;
  const uri = result.assets[0].uri;
  if (Platform.OS === "web") {
    const res = await fetch(uri);
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

function PostCard({
  post,
  onLike,
  onDelete,
  myName,
}: {
  post: Post;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  myName: string;
}) {
  const [viewingImage, setViewingImage] = useState(false);
  const stageColor = STAGE_COLORS[post.stage] || C.tint;
  const isMine = post.grower_name === myName && !!myName;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.topRow}>
        <View style={cardStyles.avatarWrap}>
          <Text style={cardStyles.avatarText}>{post.grower_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.growerName}>{post.grower_name}</Text>
          <Text style={cardStyles.timeAgo}>{timeAgo(post.created_at)}</Text>
        </View>
        <View style={[cardStyles.stageBadge, { backgroundColor: stageColor + "22" }]}>
          <Text style={[cardStyles.stageText, { color: stageColor }]}>{post.stage}</Text>
        </View>
      </View>

      <Text style={cardStyles.title}>{post.title}</Text>
      {post.strain !== "Unknown" && (
        <View style={cardStyles.strainRow}>
          <Ionicons name="leaf" size={13} color={C.tint} />
          <Text style={cardStyles.strain}>{post.strain}</Text>
        </View>
      )}
      <Text style={cardStyles.description}>{post.description}</Text>

      {post.image_base64 && (
        <Pressable onPress={() => setViewingImage(true)}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${post.image_base64}` }}
            style={cardStyles.postImage}
            resizeMode="cover"
          />
        </Pressable>
      )}

      <View style={cardStyles.actions}>
        <Pressable style={cardStyles.likeBtn} onPress={() => onLike(post.id)}>
          <Ionicons
            name={post.liked_by_me ? "heart" : "heart-outline"}
            size={20}
            color={post.liked_by_me ? "#ef5350" : C.textMuted}
          />
          <Text style={[cardStyles.likeCount, post.liked_by_me && { color: "#ef5350" }]}>{post.likes}</Text>
        </Pressable>
        {isMine && (
          <Pressable style={cardStyles.deleteBtn} onPress={() => onDelete(post.id)}>
            <Ionicons name="trash-outline" size={18} color={C.textMuted} />
          </Pressable>
        )}
      </View>

      {viewingImage && post.image_base64 && (
        <Modal visible animationType="fade" transparent>
          <Pressable style={cardStyles.imageViewer} onPress={() => setViewingImage(false)}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${post.image_base64}` }}
              style={cardStyles.fullImage}
              resizeMode="contain"
            />
            <Pressable style={cardStyles.closeImageBtn} onPress={() => setViewingImage(false)}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

function NewPostModal({
  onClose,
  onPosted,
  defaultName,
}: {
  onClose: () => void;
  onPosted: () => void;
  defaultName: string;
}) {
  const insets = useSafeAreaInsets();
  const [growerName, setGrowerName] = useState(defaultName);
  const [strain, setStrain] = useState("");
  const [stage, setStage] = useState("Seedling");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handlePhoto = async (camera: boolean) => {
    setAddingPhoto(true);
    try {
      const b64 = camera ? await takePhoto() : await pickPhoto();
      if (b64) setImageBase64(b64);
    } finally {
      setAddingPhoto(false);
    }
  };

  const handlePost = async () => {
    if (!growerName.trim()) { Alert.alert("Error", "Please enter your grower name"); return; }
    if (!title.trim()) { Alert.alert("Error", "Please enter a title"); return; }
    if (!description.trim()) { Alert.alert("Error", "Please add a description"); return; }

    setPosting(true);
    try {
      await AsyncStorage.setItem("cannagrow_grower_name", growerName.trim());
      const url = new URL("/api/community/posts", getApiUrl());
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          growerName: growerName.trim(),
          strain: strain.trim() || "Unknown",
          stage,
          title: title.trim(),
          description: description.trim(),
          imageBase64: imageBase64 || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to post");
      onPosted();
      onClose();
    } catch (err) {
      Alert.alert("Error", "Failed to post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[npStyles.container, { backgroundColor: C.background }]}>
        <View style={[npStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={npStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <Text style={npStyles.title}>Share Your Grow</Text>
          <Text style={npStyles.subtitle}>Inspire other growers with your progress</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[npStyles.content, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={npStyles.label}>Your Grower Name *</Text>
          <TextInput
            style={npStyles.input}
            value={growerName}
            onChangeText={setGrowerName}
            placeholder="e.g. GardenGuru42"
            placeholderTextColor={C.textMuted}
            returnKeyType="next"
          />

          <Text style={npStyles.label}>Strain</Text>
          <TextInput
            style={npStyles.input}
            value={strain}
            onChangeText={setStrain}
            placeholder="e.g. Blue Dream, OG Kush, Unknown"
            placeholderTextColor={C.textMuted}
            returnKeyType="next"
          />

          <Text style={npStyles.label}>Current Stage</Text>
          <View style={npStyles.chipRow}>
            {STAGES.map((s) => (
              <Pressable key={s} style={[npStyles.chip, stage === s && npStyles.chipActive]} onPress={() => setStage(s)}>
                <Text style={[npStyles.chipText, stage === s && npStyles.chipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={npStyles.label}>Title *</Text>
          <TextInput
            style={npStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Week 5 flower update — frosty and stacking!"
            placeholderTextColor={C.textMuted}
            returnKeyType="next"
          />

          <Text style={npStyles.label}>Description *</Text>
          <TextInput
            style={[npStyles.input, { minHeight: 90, textAlignVertical: "top" }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Share what you're seeing, your setup, feeding schedule, tips..."
            placeholderTextColor={C.textMuted}
            multiline
          />

          <Text style={npStyles.label}>Photo (optional)</Text>
          {imageBase64 ? (
            <View style={npStyles.previewWrap}>
              <Image source={{ uri: `data:image/jpeg;base64,${imageBase64}` }} style={npStyles.preview} resizeMode="cover" />
              <Pressable style={npStyles.removePhoto} onPress={() => setImageBase64(null)}>
                <Ionicons name="close-circle" size={26} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={npStyles.photoRow}>
              <Pressable style={npStyles.photoBtn} onPress={() => handlePhoto(false)} disabled={addingPhoto}>
                {addingPhoto ? <ActivityIndicator size="small" color={C.tint} /> : <Ionicons name="image-outline" size={22} color={C.tint} />}
                <Text style={npStyles.photoBtnText}>Library</Text>
              </Pressable>
              <Pressable style={npStyles.photoBtn} onPress={() => handlePhoto(true)} disabled={addingPhoto}>
                <Ionicons name="camera-outline" size={22} color={C.tint} />
                <Text style={npStyles.photoBtnText}>Camera</Text>
              </Pressable>
            </View>
          )}

          <Pressable style={npStyles.postBtn} onPress={handlePost} disabled={posting}>
            <LinearGradient colors={["#4caf50", "#2e7d32"]} style={npStyles.postBtnGrad}>
              {posting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#fff" />
                  <Text style={npStyles.postBtnText}>Share Grow</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [myName, setMyName] = useState("");
  const [error, setError] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const fetchPosts = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const deviceId = await getDeviceId();
      const name = await getGrowerName();
      setMyName(name);
      const url = new URL(`/api/community/posts?deviceId=${encodeURIComponent(deviceId)}`, getApiUrl());
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      setError("Couldn't load the community feed. Check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPosts(); }, [fetchPosts]));

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts(true);
  };

  const handleLike = async (postId: number) => {
    const deviceId = await getDeviceId();
    try {
      const url = new URL(`/api/community/posts/${postId}/like`, getApiUrl());
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      if (!res.ok) return;
      const { liked, likes } = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes, liked_by_me: liked } : p
        )
      );
    } catch {}
  };

  const handleDelete = async (postId: number) => {
    Alert.alert("Delete Post", "Are you sure you want to remove this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const url = new URL(`/api/community/posts/${postId}`, getApiUrl());
            await fetch(url.toString(), { method: "DELETE" });
            setPosts((prev) => prev.filter((p) => p.id !== postId));
          } catch {}
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 118 : 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.tint} />
        }
      >
        <LinearGradient colors={["#0d2410", "#0a130b"]} style={[styles.header, { paddingTop: topPad + 20 }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Community</Text>
              <Text style={styles.headerSub}>Grow with growers worldwide</Text>
            </View>
            <Pressable style={styles.shareBtn} onPress={() => setShowNewPost(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={C.tint} />
            <Text style={styles.loadingText}>Loading community feed...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="cloud-offline-outline" size={40} color={C.textMuted} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => fetchPosts()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyTitle}>Be the First!</Text>
            <Text style={styles.emptyText}>
              No posts yet. Share your grow with the community and inspire other growers.
            </Text>
            <Pressable style={styles.shareNowBtn} onPress={() => setShowNewPost(true)}>
              <Text style={styles.shareNowText}>Share Your Grow</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.feed}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onDelete={handleDelete}
                myName={myName}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {showNewPost && (
        <NewPostModal
          onClose={() => setShowNewPost(false)}
          onPosted={() => fetchPosts(true)}
          defaultName={myName}
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
  shareBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" },
  loadingState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  loadingText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted },
  errorState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  errorText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center", paddingHorizontal: 32 },
  retryBtn: { backgroundColor: C.backgroundTertiary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder },
  retryText: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.text },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontFamily: "Nunito_700Bold", fontSize: 20, color: C.text },
  emptyText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center", paddingHorizontal: 32, lineHeight: 21 },
  shareNowBtn: { backgroundColor: C.tint, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  shareNowText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
  feed: { padding: 16, gap: 14 },
});

const cardStyles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, paddingBottom: 8 },
  avatarWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.tint + "33", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.tint + "55" },
  avatarText: { fontFamily: "Nunito_800ExtraBold", fontSize: 18, color: C.tint },
  growerName: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.text },
  timeAgo: { fontFamily: "Nunito_400Regular", fontSize: 11, color: C.textMuted, marginTop: 1 },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stageText: { fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  title: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text, paddingHorizontal: 14, marginBottom: 4 },
  strainRow: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, marginBottom: 6 },
  strain: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.tint },
  description: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, paddingHorizontal: 14, lineHeight: 21, marginBottom: 10 },
  postImage: { width: "100%", height: 220 },
  actions: { flexDirection: "row", alignItems: "center", padding: 12, paddingTop: 10, gap: 12, borderTopWidth: 1, borderTopColor: C.cardBorder },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  likeCount: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.textMuted },
  deleteBtn: { padding: 4 },
  imageViewer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  fullImage: { width: "100%", height: "80%" },
  closeImageBtn: { position: "absolute", top: 60, right: 20 },
});

const npStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  closeBtn: { alignSelf: "flex-end", marginBottom: 8 },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: C.text },
  subtitle: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 4 },
  content: { padding: 16, gap: 10 },
  label: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.textSecondary },
  input: { backgroundColor: C.card, borderRadius: 12, padding: 14, fontFamily: "Nunito_400Regular", fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.cardBorder },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  chipActive: { backgroundColor: C.tint + "22", borderColor: C.tint },
  chipText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textSecondary },
  chipTextActive: { color: C.tint },
  photoRow: { flexDirection: "row", gap: 10 },
  photoBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.tint + "44", borderStyle: "dashed" },
  photoBtnText: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.tint },
  previewWrap: { borderRadius: 12, overflow: "hidden", position: "relative" },
  preview: { width: "100%", height: 180, borderRadius: 12 },
  removePhoto: { position: "absolute", top: 8, right: 8 },
  postBtn: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
  postBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16 },
  postBtnText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#fff" },
});
