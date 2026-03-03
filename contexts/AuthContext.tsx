import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

const AUTH_TOKEN_KEY = "phynix_auth_token";
const AUTH_USER_KEY = "phynix_user";

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  profile_pic: string | null;
  bio: string | null;
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; profilePic?: string; bio?: string }) => Promise<{ success: boolean; error?: string }>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  updateProfile: async () => ({ success: false }),
  setUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

async function authFetch(path: string, options: RequestInit = {}) {
  const baseUrl = getApiUrl();
  const url = new URL(path, baseUrl);
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers,
  });
  return res;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);

      if (!storedToken || !storedUser) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);

      try {
        const res = await authFetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserState(data.user);
          await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        } else {
          setUserState(JSON.parse(storedUser));
        }
      } catch {
        setUserState(JSON.parse(storedUser));
      }
    } catch {
      // no stored auth
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuth = async (userData: AuthUser, authToken: string) => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    await AsyncStorage.setItem("phynix_grower_name", userData.display_name);
    setToken(authToken);
    setUserState(userData);
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await authFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      await saveAuth(data.user, data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const res = await authFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }
      await saveAuth(data.user, data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUserState(null);
  }, []);

  const updateProfile = useCallback(async (data: { displayName?: string; profilePic?: string; bio?: string }) => {
    try {
      const res = await authFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || "Update failed" };
      }
      setUserState(result.user);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
      if (data.displayName) {
        await AsyncStorage.setItem("phynix_grower_name", data.displayName);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  }, []);

  const setUser = useCallback((u: AuthUser) => {
    setUserState(u);
    AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}
