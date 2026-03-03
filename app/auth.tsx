import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";

const C = Colors.dark;

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    if (mode === "register") {
      if (!displayName.trim()) {
        setError("Please enter a display name");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }
    }

    setLoading(true);
    try {
      const result = mode === "login"
        ? await login(email.trim(), password)
        : await register(email.trim(), password, displayName.trim());

      if (!result.success) {
        setError(result.error || "Something went wrong");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <Image
              source={require("@/assets/images/phynix-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Phynix</Text>
            <Text style={styles.tagline}>Grow smarter. Grow together.</Text>
          </View>

          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleBtn, mode === "login" && styles.toggleActive]}
              onPress={() => { setMode("login"); setError(""); }}
            >
              <Text style={[styles.toggleText, mode === "login" && styles.toggleTextActive]}>Sign In</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, mode === "register" && styles.toggleActive]}
              onPress={() => { setMode("register"); setError(""); }}
            >
              <Text style={[styles.toggleText, mode === "register" && styles.toggleTextActive]}>Create Account</Text>
            </Pressable>
          </View>

          <View style={styles.formCard}>
            {mode === "register" && (
              <>
                <Text style={styles.label}>Display Name</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Your grower name"
                    placeholderTextColor={C.textMuted}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </>
            )}

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder={mode === "register" ? "Min 6 characters" : "Your password"}
                placeholderTextColor={C.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType={mode === "register" ? "next" : "done"}
                onSubmitEditing={mode === "login" ? handleSubmit : undefined}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={C.textMuted} />
              </Pressable>
            </View>

            {mode === "register" && (
              <>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor={C.textMuted}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </View>
              </>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#ef5350" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={["#4caf50", "#2e7d32"]} style={styles.submitGrad}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitText}>
                      {mode === "login" ? "Sign In" : "Create Account"}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <Text style={styles.switchText}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <Text
              style={styles.switchLink}
              onPress={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a130b",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  appName: {
    fontSize: 36,
    fontFamily: "Nunito_800ExtraBold",
    color: "#4caf50",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: C.textSecondary,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#111a12",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: "#1a2e1b",
  },
  toggleText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: C.textMuted,
  },
  toggleTextActive: {
    color: "#4caf50",
  },
  formCard: {
    backgroundColor: "#111a12",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1a2e1b",
  },
  label: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: C.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d1a0e",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1a2e1b",
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: C.text,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    padding: 10,
    backgroundColor: "rgba(239,83,80,0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239,83,80,0.3)",
  },
  errorText: {
    color: "#ef5350",
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    flex: 1,
  },
  submitBtn: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  switchText: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: C.textMuted,
    marginBottom: 20,
  },
  switchLink: {
    color: "#4caf50",
    fontFamily: "Nunito_700Bold",
  },
});
