
"use client";

import type { User } from "@/types";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getUserByEmail } from "@/lib/mockData"; // Using getUserByEmail which now fetches from DB
import { useRouter } from "next/navigation";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>; // Password removed for now
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
        // Re-validate or refresh user data from DB if necessary, for now trust localStorage
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("swargfood-user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => { // Password parameter removed
    setIsLoading(true);
    try {
      // Simulate API call duration if needed, or rely on DB query time
      // await new Promise(resolve => setTimeout(resolve, 300)); 
      
      const user = await getUserByEmail(email);

      if (user) {
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
        // User not found
        setCurrentUser(null);
        localStorage.removeItem("swargfood-user");
        // Toast notification for login failure is handled in LoginPage
        throw new Error("User not found or credentials incorrect.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setCurrentUser(null);
      localStorage.removeItem("swargfood-user");
      // Re-throw to be caught by the form handler for toast
      throw error;
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

  // Use is_admin from the currentUser object if available, otherwise fallback to email check.
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
