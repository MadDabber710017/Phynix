import React, { useState, useCallback, useEffect } from "react";
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
  FlatList,
  Share,
  KeyboardAvoidingView,
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
import { addXP } from "@/lib/gamification";

const AVATAR_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  "leaf", "flower", "rose", "nutrition", "water",
  "sunny", "rainy", "flask", "bug", "earth",
  "planet", "sparkles", "star", "diamond", "ribbon",
  "heart", "flame", "flash", "cloudy", "moon",
];

async function getAvatarIcon(): Promise<string> {
  return (await AsyncStorage.getItem("phynix_avatar_icon")) || "leaf";
}

async function setAvatarIcon(icon: string): Promise<void> {
  await AsyncStorage.setItem("phynix_avatar_icon", icon);
}

const C = Colors.dark;

const STAGES = [
  "Seedling", "Early Vegetative", "Late Vegetative", "Pre-Flower",
  "Early Flower", "Mid Flower", "Late Flower", "Harvest Ready", "Harvested", "Curing",
];
const STAGE_COLORS: Record<string, string> = {
  "Seedling": "#81c784", "Early Vegetative": "#66bb6a", "Late Vegetative": "#4caf50",
  "Pre-Flower": "#ffa726", "Early Flower": "#ab47bc", "Mid Flower": "#9c27b0",
  "Late Flower": "#7b1fa2", "Harvest Ready": "#ef5350", "Harvested": "#78909c", "Curing": "#8d6e63",
};

interface Comment {
  id: number;
  commenter_name: string;
  content: string;
  created_at: string;
  device_id: string;
}

interface Post {
  id: number;
  grower_name: string;
  strain: string;
  stage: string;
  title: string;
  description: string;
  image_base64?: string;
  likes: number;
  comments_count: number;
  created_at: string;
  liked_by_me: boolean;
  device_id: string;
}

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem("phynix_device_id");
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    await AsyncStorage.setItem("phynix_device_id", id);
  }
  return id;
}

async function getGrowerName(): Promise<string> {
  return (await AsyncStorage.getItem("phynix_grower_name")) || "";
}

function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(isoDate).toLocaleDateString();
}

async function pickPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;
  const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.4, base64: false, mediaTypes: ["images"] });
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
  const result = await ImagePicker.launchCameraAsync({ quality: 0.4, base64: false, mediaTypes: ["images"] });
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

function CommentsSheet({
  post,
  onClose,
  myName,
}: {
  post: Post;
  onClose: () => void;
  myName: string;
}) {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const fetchComments = useCallback(async () => {
    try {
      const url = new URL(`/api/community/posts/${post.id}/comments`, getApiUrl());
      const res = await globalThis.fetch(url.toString());
      if (res.ok) setComments(await res.json());
    } catch {} finally { setLoading(false); }
  }, [post.id]);

  React.useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSend = async () => {
    if (!newComment.trim()) return;
    if (!myName) { Alert.alert("Set Name", "Please share a post first to set your grower name."); return; }
    setSending(true);
    try {
      const deviceId = await getDeviceId();
      const url = new URL(`/api/community/posts/${post.id}/comments`, getApiUrl());
      const res = await globalThis.fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, commenterName: myName, content: newComment.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments(prev => [...prev, comment]);
        setNewComment("");
      }
    } catch {} finally { setSending(false); }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={[cmStyles.container, { backgroundColor: C.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[cmStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose} style={cmStyles.closeBtn}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <Text style={cmStyles.title}>Comments</Text>
          <Text style={cmStyles.subtitle}>{post.title}</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <ActivityIndicator color={C.tint} style={{ marginTop: 40 }} />
          ) : comments.length === 0 ? (
            <View style={cmStyles.emptyState}>
              <Ionicons name="chatbubble-outline" size={36} color={C.textMuted} />
              <Text style={cmStyles.emptyText}>No comments yet. Be the first!</Text>
            </View>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={cmStyles.commentCard}>
                <View style={cmStyles.commentHeader}>
                  <View style={cmStyles.commentAvatar}>
                    <Text style={cmStyles.commentAvatarText}>{c.commenter_name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={cmStyles.commentName}>{c.commenter_name}</Text>
                    <Text style={cmStyles.commentTime}>{timeAgo(c.created_at)}</Text>
                  </View>
                </View>
                <Text style={cmStyles.commentContent}>{c.content}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={[cmStyles.inputBar, { paddingBottom: Platform.OS === "web" ? 34 : Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={cmStyles.input}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Add a comment..."
            placeholderTextColor={C.textMuted}
            multiline
            maxLength={500}
          />
          <Pressable style={cmStyles.sendBtn} onPress={handleSend} disabled={sending || !newComment.trim()}>
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PostCard({
  post,
  onLike,
  onDelete,
  onFollow,
  myName,
  isFollowing,
  onComments,
  onProfile,
}: {
  post: Post;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  onFollow: (name: string) => void;
  myName: string;
  isFollowing: boolean;
  onComments: (post: Post) => void;
  onProfile: (name: string) => void;
}) {
  const [viewingImage, setViewingImage] = useState(false);
  const stageColor = STAGE_COLORS[post.stage] || C.tint;
  const isMine = post.grower_name === myName && !!myName;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.title}\n\nBy ${post.grower_name} | ${post.strain} | ${post.stage}\n\n${post.description}\n\nShared from Phynix`,
      });
    } catch {}
  };

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.topRow}>
        <Pressable style={cardStyles.avatarWrap} onPress={() => onProfile(post.grower_name)}>
          <Ionicons name="leaf" size={20} color={C.tint} />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => onProfile(post.grower_name)}>
          <Text style={cardStyles.growerName}>{post.grower_name}</Text>
          <Text style={cardStyles.timeAgo}>{timeAgo(post.created_at)}</Text>
        </Pressable>
        {!isMine && (
          <Pressable
            style={[cardStyles.followBtn, isFollowing && cardStyles.followBtnActive]}
            onPress={() => onFollow(post.grower_name)}
          >
            <Ionicons name={isFollowing ? "checkmark" : "person-add-outline"} size={14} color={isFollowing ? C.tint : C.textSecondary} />
            <Text style={[cardStyles.followText, isFollowing && { color: C.tint }]}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={cardStyles.title}>{post.title}</Text>
      <View style={cardStyles.tagsRow}>
        {post.strain !== "Unknown" && (
          <View style={cardStyles.tag}>
            <Ionicons name="leaf" size={11} color={C.tint} />
            <Text style={cardStyles.tagText}>{post.strain}</Text>
          </View>
        )}
        <View style={[cardStyles.tag, { backgroundColor: stageColor + "15", borderColor: stageColor + "33" }]}>
          <View style={[cardStyles.tagDot, { backgroundColor: stageColor }]} />
          <Text style={[cardStyles.tagText, { color: stageColor }]}>{post.stage}</Text>
        </View>
      </View>
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
        <Pressable style={cardStyles.actionBtn} onPress={() => onLike(post.id)}>
          <Ionicons
            name={post.liked_by_me ? "heart" : "heart-outline"}
            size={22}
            color={post.liked_by_me ? "#ef5350" : C.textMuted}
          />
          <Text style={[cardStyles.actionCount, post.liked_by_me && { color: "#ef5350" }]}>
            {post.likes || ""}
          </Text>
        </Pressable>
        <Pressable style={cardStyles.actionBtn} onPress={() => onComments(post)}>
          <Ionicons name="chatbubble-outline" size={20} color={C.textMuted} />
          <Text style={cardStyles.actionCount}>{post.comments_count || ""}</Text>
        </Pressable>
        <Pressable style={cardStyles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={C.textMuted} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {isMine && (
          <Pressable style={cardStyles.actionBtn} onPress={() => onDelete(post.id)}>
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
    } finally { setAddingPhoto(false); }
  };

  const handlePost = async () => {
    if (!growerName.trim()) { Alert.alert("Error", "Enter your grower name"); return; }
    if (!title.trim()) { Alert.alert("Error", "Enter a title"); return; }
    if (!description.trim()) { Alert.alert("Error", "Add a description"); return; }

    setPosting(true);
    try {
      await AsyncStorage.setItem("phynix_grower_name", growerName.trim());
      const deviceId = await getDeviceId();
      const url = new URL("/api/community/posts", getApiUrl());
      const res = await globalThis.fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          growerName: growerName.trim(),
          strain: strain.trim() || "Unknown",
          stage,
          title: title.trim(),
          description: description.trim(),
          imageBase64: imageBase64 || null,
          deviceId,
        }),
      });
      if (!res.ok) throw new Error("Failed to post");
      await addXP(15, "communityPosts");
      onPosted();
      onClose();
    } catch {
      Alert.alert("Error", "Failed to post. Please try again.");
    } finally { setPosting(false); }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[npStyles.container, { backgroundColor: C.background }]}>
        <View style={[npStyles.header, { paddingTop: topPad + 8 }]}>
          <View style={npStyles.headerRow}>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={C.textSecondary} />
            </Pressable>
            <Text style={npStyles.headerTitle}>New Post</Text>
            <Pressable
              style={[npStyles.postHeaderBtn, posting && { opacity: 0.5 }]}
              onPress={handlePost}
              disabled={posting}
            >
              {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={npStyles.postHeaderBtnText}>Post</Text>}
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[npStyles.content, { paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={npStyles.nameRow}>
            <View style={npStyles.avatar}>
              <Text style={npStyles.avatarText}>{(growerName || "?").charAt(0).toUpperCase()}</Text>
            </View>
            <TextInput
              style={npStyles.nameInput}
              value={growerName}
              onChangeText={setGrowerName}
              placeholder="Your grower name"
              placeholderTextColor={C.textMuted}
            />
          </View>

          <TextInput
            style={npStyles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="What's happening with your grow?"
            placeholderTextColor={C.textMuted}
            maxLength={100}
          />

          <TextInput
            style={npStyles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Share details, tips, questions, observations..."
            placeholderTextColor={C.textMuted}
            multiline
            maxLength={1000}
          />

          <View style={npStyles.metaSection}>
            <View style={npStyles.metaRow}>
              <Ionicons name="leaf" size={16} color={C.tint} />
              <TextInput
                style={npStyles.metaInput}
                value={strain}
                onChangeText={setStrain}
                placeholder="Strain name"
                placeholderTextColor={C.textMuted}
              />
            </View>

            <Text style={npStyles.stageLabel}>Stage</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {STAGES.map((s) => (
                <Pressable key={s} style={[npStyles.chip, stage === s && npStyles.chipActive]} onPress={() => setStage(s)}>
                  <Text style={[npStyles.chipText, stage === s && npStyles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {imageBase64 ? (
            <View style={npStyles.previewWrap}>
              <Image source={{ uri: `data:image/jpeg;base64,${imageBase64}` }} style={npStyles.preview} resizeMode="cover" />
              <Pressable style={npStyles.removePhoto} onPress={() => setImageBase64(null)}>
                <Ionicons name="close-circle" size={26} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={npStyles.mediaBar}>
              <Pressable style={npStyles.mediaBtn} onPress={() => handlePhoto(false)} disabled={addingPhoto}>
                {addingPhoto ? <ActivityIndicator size="small" color={C.tint} /> : <Ionicons name="image-outline" size={22} color={C.tint} />}
                <Text style={npStyles.mediaBtnText}>Photo</Text>
              </Pressable>
              <Pressable style={npStyles.mediaBtn} onPress={() => handlePhoto(true)} disabled={addingPhoto}>
                <Ionicons name="camera-outline" size={22} color={C.tint} />
                <Text style={npStyles.mediaBtnText}>Camera</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

interface GrowerProfile {
  growerName: string;
  postCount: number;
  joinDate: string | null;
  posts: Post[];
}

function AvatarPickerModal({
  onClose,
  currentIcon,
  onSelect,
}: {
  onClose: () => void;
  currentIcon: string;
  onSelect: (icon: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[avatarStyles.container, { backgroundColor: C.background }]}>
        <View style={[avatarStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <Text style={avatarStyles.headerTitle}>Choose Avatar</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={avatarStyles.grid}>
          {AVATAR_ICONS.map((icon) => (
            <Pressable
              key={icon}
              style={[
                avatarStyles.iconBtn,
                currentIcon === icon && avatarStyles.iconBtnActive,
              ]}
              onPress={() => { onSelect(icon); onClose(); }}
            >
              <Ionicons
                name={icon as any}
                size={28}
                color={currentIcon === icon ? "#fff" : C.tint}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function GrowerProfileModal({
  growerName,
  onClose,
  onLike,
  onFollow,
  myName,
  isFollowing,
  onComments,
}: {
  growerName: string;
  onClose: () => void;
  onLike: (id: number) => void;
  onFollow: (name: string) => void;
  myName: string;
  isFollowing: boolean;
  onComments: (post: Post) => void;
}) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<GrowerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    (async () => {
      try {
        const deviceId = await getDeviceId();
        const url = new URL(`/api/community/grower/${encodeURIComponent(growerName)}`, getApiUrl());
        url.searchParams.set("deviceId", deviceId);
        const res = await globalThis.fetch(url.toString());
        if (res.ok) setProfile(await res.json());
      } catch {} finally { setLoading(false); }
    })();
  }, [growerName]);

  const isMine = growerName === myName && !!myName;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={[profileStyles.container, { backgroundColor: C.background }]}>
        <View style={[profileStyles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
          <Text style={profileStyles.headerTitle}>Grower Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={C.tint} style={{ marginTop: 40 }} />
        ) : !profile ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular" }}>Could not load profile.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={profileStyles.profileCard}>
              <View style={profileStyles.avatarLarge}>
                <Ionicons name="leaf" size={36} color={C.tint} />
              </View>
              <Text style={profileStyles.name}>{profile.growerName}</Text>
              <View style={profileStyles.statsRow}>
                <View style={profileStyles.statItem}>
                  <Text style={profileStyles.statValue}>{profile.postCount}</Text>
                  <Text style={profileStyles.statLabel}>{profile.postCount === 1 ? "Post" : "Posts"}</Text>
                </View>
                {profile.joinDate && (
                  <View style={profileStyles.statItem}>
                    <Text style={profileStyles.statValue}>{new Date(profile.joinDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</Text>
                    <Text style={profileStyles.statLabel}>Joined</Text>
                  </View>
                )}
              </View>
              {!isMine && (
                <Pressable
                  style={[profileStyles.followProfileBtn, isFollowing && profileStyles.followProfileBtnActive]}
                  onPress={() => onFollow(growerName)}
                >
                  <Ionicons name={isFollowing ? "checkmark" : "person-add-outline"} size={16} color={isFollowing ? C.tint : "#fff"} />
                  <Text style={[profileStyles.followProfileText, isFollowing && { color: C.tint }]}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </Pressable>
              )}
            </View>

            <Text style={profileStyles.sectionTitle}>Recent Posts</Text>
            {profile.posts.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular" }}>No posts yet.</Text>
              </View>
            ) : (
              <View style={{ padding: 16, gap: 12 }}>
                {profile.posts.map((post) => (
                  <View key={post.id} style={profileStyles.miniPost}>
                    <Text style={profileStyles.miniTitle}>{post.title}</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                      <View style={[cardStyles.tag, { backgroundColor: (STAGE_COLORS[post.stage] || C.tint) + "15", borderColor: (STAGE_COLORS[post.stage] || C.tint) + "33" }]}>
                        <View style={[cardStyles.tagDot, { backgroundColor: STAGE_COLORS[post.stage] || C.tint }]} />
                        <Text style={[cardStyles.tagText, { color: STAGE_COLORS[post.stage] || C.tint }]}>{post.stage}</Text>
                      </View>
                      {post.strain !== "Unknown" && (
                        <View style={cardStyles.tag}>
                          <Ionicons name="leaf" size={11} color={C.tint} />
                          <Text style={cardStyles.tagText}>{post.strain}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={profileStyles.miniDesc} numberOfLines={2}>{post.description}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="heart" size={14} color="#ef5350" />
                        <Text style={{ color: C.textMuted, fontSize: 12, fontFamily: "Nunito_600SemiBold" }}>{post.likes}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="chatbubble-outline" size={14} color={C.textMuted} />
                        <Text style={{ color: C.textMuted, fontSize: 12, fontFamily: "Nunito_600SemiBold" }}>{post.comments_count}</Text>
                      </View>
                      <Text style={{ color: C.textMuted, fontSize: 11, fontFamily: "Nunito_400Regular" }}>{timeAgo(post.created_at)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
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
  const [myAvatarIcon, setMyAvatarIcon] = useState("leaf");
  const [error, setError] = useState("");
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "following">("all");
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const fetchPosts = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const deviceId = await getDeviceId();
      const [name, avatar] = await Promise.all([getGrowerName(), getAvatarIcon()]);
      setMyName(name);
      setMyAvatarIcon(avatar);

      const [postsRes, followsRes] = await Promise.all([
        globalThis.fetch(new URL(`/api/community/posts?deviceId=${encodeURIComponent(deviceId)}`, getApiUrl()).toString()),
        globalThis.fetch(new URL(`/api/community/follows?deviceId=${encodeURIComponent(deviceId)}`, getApiUrl()).toString()),
      ]);

      if (postsRes.ok) setPosts(await postsRes.json());
      if (followsRes.ok) {
        const names = await followsRes.json();
        setFollowing(new Set(names));
      }
    } catch {
      setError("Couldn't load the community feed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPosts(); }, [fetchPosts]));

  const handleRefresh = () => { setRefreshing(true); fetchPosts(true); };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const deviceId = await getDeviceId();
      const url = new URL("/api/community/search", getApiUrl());
      url.searchParams.set("q", query.trim());
      url.searchParams.set("deviceId", deviceId);
      const res = await globalThis.fetch(url.toString());
      if (res.ok) setSearchResults(await res.json());
    } catch {} finally { setSearchLoading(false); }
  }, []);

  const handleAvatarSelect = async (icon: string) => {
    setMyAvatarIcon(icon);
    await setAvatarIcon(icon);
  };

  const handleLike = async (postId: number) => {
    const deviceId = await getDeviceId();
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked_by_me: !p.liked_by_me, likes: p.liked_by_me ? p.likes - 1 : p.likes + 1 } : p
    ));
    try {
      const url = new URL(`/api/community/posts/${postId}/like`, getApiUrl());
      await globalThis.fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
    } catch {}
  };

  const handleFollow = async (growerName: string) => {
    const deviceId = await getDeviceId();
    const wasFollowing = following.has(growerName);
    setFollowing(prev => {
      const next = new Set(prev);
      wasFollowing ? next.delete(growerName) : next.add(growerName);
      return next;
    });
    try {
      const url = new URL("/api/community/follow", getApiUrl());
      await globalThis.fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, growerName }),
      });
    } catch {}
  };

  const handleDelete = async (postId: number) => {
    Alert.alert("Delete Post", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setPosts(prev => prev.filter(p => p.id !== postId));
          try {
            await globalThis.fetch(new URL(`/api/community/posts/${postId}`, getApiUrl()).toString(), { method: "DELETE" });
          } catch {}
        },
      },
    ]);
  };

  const filteredPosts = filter === "following"
    ? posts.filter(p => following.has(p.grower_name) || p.grower_name === myName)
    : posts;

  const displayPosts = searchResults !== null ? searchResults : filteredPosts;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 118 : 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.tint} />}
      >
        <LinearGradient colors={["#0d2410", "#0a130b"]} style={[styles.header, { paddingTop: topPad + 20 }]}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable style={styles.myAvatarBtn} onPress={() => setShowAvatarPicker(true)}>
                <Ionicons name={myAvatarIcon as any} size={20} color={C.tint} />
              </Pressable>
              <View>
                <Text style={styles.headerTitle}>Community</Text>
                <Text style={styles.headerSub}>
                  {posts.length} post{posts.length !== 1 ? "s" : ""} {following.size > 0 ? `· ${following.size} following` : ""}
                </Text>
              </View>
            </View>
            <Pressable style={styles.shareBtn} onPress={() => setShowNewPost(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={C.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search growers..."
              placeholderTextColor={C.textMuted}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => { setSearchQuery(""); setSearchResults(null); }}>
                <Ionicons name="close-circle" size={18} color={C.textMuted} />
              </Pressable>
            )}
          </View>

          <View style={styles.filterRow}>
            <Pressable style={[styles.filterChip, filter === "all" && styles.filterActive]} onPress={() => setFilter("all")}>
              <Ionicons name="earth-outline" size={14} color={filter === "all" ? "#fff" : C.textMuted} />
              <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>Everyone</Text>
            </Pressable>
            <Pressable style={[styles.filterChip, filter === "following" && styles.filterActive]} onPress={() => setFilter("following")}>
              <Ionicons name="people-outline" size={14} color={filter === "following" ? "#fff" : C.textMuted} />
              <Text style={[styles.filterText, filter === "following" && styles.filterTextActive]}>Following</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {searchLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={C.tint} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={C.tint} />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="cloud-offline-outline" size={40} color={C.textMuted} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => fetchPosts()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : displayPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name={searchResults !== null ? "search-outline" : filter === "following" ? "people-outline" : "leaf-outline"} size={48} color={C.textMuted} />
            <Text style={styles.emptyTitle}>
              {searchResults !== null ? "No Results" : filter === "following" ? "Follow Some Growers" : "Be the First!"}
            </Text>
            <Text style={styles.emptyText}>
              {searchResults !== null
                ? `No growers found matching "${searchQuery}".`
                : filter === "following"
                ? "Follow growers to see their posts here."
                : "Share your grow and inspire the community."}
            </Text>
            {filter === "all" && searchResults === null && (
              <Pressable style={styles.shareNowBtn} onPress={() => setShowNewPost(true)}>
                <Text style={styles.shareNowText}>Share Your Grow</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.feed}>
            {displayPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onDelete={handleDelete}
                onFollow={handleFollow}
                myName={myName}
                isFollowing={following.has(post.grower_name)}
                onComments={setCommentPost}
                onProfile={setProfileName}
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
      {commentPost && (
        <CommentsSheet
          post={commentPost}
          onClose={() => { setCommentPost(null); fetchPosts(true); }}
          myName={myName}
        />
      )}
      {profileName && (
        <GrowerProfileModal
          growerName={profileName}
          onClose={() => setProfileName(null)}
          onLike={handleLike}
          onFollow={handleFollow}
          myName={myName}
          isFollowing={following.has(profileName)}
          onComments={setCommentPost}
        />
      )}
      {showAvatarPicker && (
        <AvatarPickerModal
          onClose={() => setShowAvatarPicker(false)}
          currentIcon={myAvatarIcon}
          onSelect={handleAvatarSelect}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 30, color: C.text },
  headerSub: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  shareBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.backgroundTertiary, borderWidth: 1, borderColor: C.cardBorder,
  },
  filterActive: { backgroundColor: C.tint, borderColor: C.tint },
  filterText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted },
  filterTextActive: { color: "#fff" },
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
  feed: { padding: 16, gap: 16 },
  myAvatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.tint + "33", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.tint + "55" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.backgroundTertiary, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, borderWidth: 1, borderColor: C.cardBorder },
  searchInput: { flex: 1, fontFamily: "Nunito_400Regular", fontSize: 14, color: C.text, paddingVertical: 2 },
});

const cardStyles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, paddingBottom: 8 },
  avatarWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.tint + "33", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.tint + "55" },
  avatarText: { fontFamily: "Nunito_800ExtraBold", fontSize: 18, color: C.tint },
  growerName: { fontFamily: "Nunito_700Bold", fontSize: 14, color: C.text },
  timeAgo: { fontFamily: "Nunito_400Regular", fontSize: 11, color: C.textMuted, marginTop: 1 },
  followBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.backgroundTertiary },
  followBtnActive: { borderColor: C.tint + "55", backgroundColor: C.tint + "15" },
  followText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textSecondary },
  title: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text, paddingHorizontal: 14 },
  tagsRow: { flexDirection: "row", gap: 6, paddingHorizontal: 14, marginTop: 6, marginBottom: 6, flexWrap: "wrap" },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: C.tint + "15", borderWidth: 1, borderColor: C.tint + "33" },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontFamily: "Nunito_600SemiBold", fontSize: 11, color: C.tint },
  description: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, paddingHorizontal: 14, lineHeight: 21, marginBottom: 10 },
  postImage: { width: "100%", height: 240 },
  actions: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, gap: 4, borderTopWidth: 1, borderTopColor: C.cardBorder },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6 },
  actionCount: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: C.textMuted },
  imageViewer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", alignItems: "center", justifyContent: "center" },
  fullImage: { width: "100%", height: "80%" },
  closeImageBtn: { position: "absolute", top: 60, right: 20 },
});

const cmStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  closeBtn: { alignSelf: "flex-end", marginBottom: 8 },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 20, color: C.text },
  subtitle: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textMuted },
  commentCard: { backgroundColor: C.backgroundTertiary, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.cardBorder, gap: 6 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.tint + "33", alignItems: "center", justifyContent: "center" },
  commentAvatarText: { fontFamily: "Nunito_700Bold", fontSize: 13, color: C.tint },
  commentName: { fontFamily: "Nunito_700Bold", fontSize: 13, color: C.text },
  commentTime: { fontFamily: "Nunito_400Regular", fontSize: 11, color: C.textMuted },
  commentContent: { fontFamily: "Nunito_400Regular", fontSize: 14, color: C.textSecondary, lineHeight: 20, paddingLeft: 40 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.cardBorder, backgroundColor: C.backgroundSecondary },
  input: { flex: 1, backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontFamily: "Nunito_400Regular", fontSize: 14, color: C.text, maxHeight: 80, borderWidth: 1, borderColor: C.cardBorder },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.tint, alignItems: "center", justifyContent: "center", marginBottom: 2 },
});

const npStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontFamily: "Nunito_700Bold", fontSize: 18, color: C.text },
  postHeaderBtn: { backgroundColor: C.tint, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 18 },
  postHeaderBtnText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: "#fff" },
  content: { padding: 16, gap: 14 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.tint + "33", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.tint + "55" },
  avatarText: { fontFamily: "Nunito_800ExtraBold", fontSize: 18, color: C.tint },
  nameInput: { flex: 1, fontFamily: "Nunito_600SemiBold", fontSize: 15, color: C.text, borderBottomWidth: 1, borderBottomColor: C.cardBorder, paddingVertical: 8 },
  titleInput: { fontFamily: "Nunito_700Bold", fontSize: 18, color: C.text, paddingVertical: 8 },
  descInput: { fontFamily: "Nunito_400Regular", fontSize: 15, color: C.text, minHeight: 80, textAlignVertical: "top" as const },
  metaSection: { gap: 10, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaInput: { flex: 1, fontFamily: "Nunito_400Regular", fontSize: 14, color: C.text, paddingVertical: 6 },
  stageLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted, marginTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.backgroundTertiary, borderWidth: 1, borderColor: C.cardBorder, marginRight: 6 },
  chipActive: { backgroundColor: C.tint + "22", borderColor: C.tint },
  chipText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: C.textMuted },
  chipTextActive: { color: C.tint },
  previewWrap: { borderRadius: 14, overflow: "hidden", position: "relative" },
  preview: { width: "100%", height: 200, borderRadius: 14 },
  removePhoto: { position: "absolute", top: 8, right: 8 },
  mediaBar: { flexDirection: "row", gap: 10 },
  mediaBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.card, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: C.tint + "33", borderStyle: "dashed" as const },
  mediaBtnText: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: C.tint },
});

const profileStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  headerTitle: { fontFamily: "Nunito_700Bold", fontSize: 18, color: C.text },
  profileCard: { alignItems: "center", paddingVertical: 28, gap: 12, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.tint + "33", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: C.tint + "55" },
  name: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: C.text },
  statsRow: { flexDirection: "row", gap: 32, marginTop: 4 },
  statItem: { alignItems: "center" },
  statValue: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text },
  statLabel: { fontFamily: "Nunito_400Regular", fontSize: 12, color: C.textMuted, marginTop: 2 },
  followProfileBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.tint, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
  followProfileBtnActive: { backgroundColor: C.tint + "22", borderWidth: 1, borderColor: C.tint },
  followProfileText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: "#fff" },
  sectionTitle: { fontFamily: "Nunito_700Bold", fontSize: 16, color: C.text, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  miniPost: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  miniTitle: { fontFamily: "Nunito_700Bold", fontSize: 15, color: C.text },
  miniDesc: { fontFamily: "Nunito_400Regular", fontSize: 13, color: C.textSecondary, lineHeight: 19, marginTop: 6 },
});

const avatarStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.cardBorder },
  headerTitle: { fontFamily: "Nunito_700Bold", fontSize: 18, color: C.text },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12, justifyContent: "center" },
  iconBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.backgroundTertiary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.cardBorder },
  iconBtnActive: { backgroundColor: C.tint, borderColor: C.tint },
});
