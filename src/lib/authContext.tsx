
"use client";

import type { User } from "@/types";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
// Removed direct import of getUserByEmail
import { useRouter } from "next/navigation";
import { loginUserAction } from "@/lib/actions/authActions"; // Import the server action

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  promptLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("swargfood-user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("swargfood-user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      // Call the server action instead of directly calling getUserByEmail
      const result = await loginUserAction(email);

      if (result.success && result.user) {
        const user = result.user;
        // IMPORTANT: Password verification is SKIPPED here.
        // In a real app, you would hash the provided password and compare it with user.password_hash.
        console.warn("SECURITY RISK: Password verification is currently bypassed in authContext.tsx.");

        setCurrentUser(user);
        localStorage.setItem("swargfood-user", JSON.stringify(user));
        
        if (user.is_admin) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem("swargfood-user");
        throw new Error(result.error || "User not found or credentials incorrect.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setCurrentUser(null);
      localStorage.removeItem("swargfood-user");
      throw error; // Re-throw to be caught by the form handler for toast
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("swargfood-user");
    router.push("/");
  };

  const promptLogin = () => {
    router.push('/login');
  };

  const isAdmin = currentUser?.is_admin ?? (currentUser?.email?.toLowerCase().endsWith("@swargfood.com") ?? false);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, isAdmin, promptLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
