"use client";

import type { User } from "@/types";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { mockUsers } from "@/lib/mockData"; // Using mock users for login
import { useRouter } from "next/navigation";

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
    // Simulate loading user from localStorage or session
    const storedUser = localStorage.getItem("swargfood-user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("swargfood-user", JSON.stringify(user));
      const loggedInUserIsAdmin = user.email?.toLowerCase().endsWith("@swargfood.com") ?? false;
      if (loggedInUserIsAdmin) {
        router.push("/admin"); // Redirect admin to admin panel
      } else {
        router.push("/"); // Redirect non-admin to home
      }
    } else {
      // User not found
      setCurrentUser(null);
      localStorage.removeItem("swargfood-user");
      // Toast notification is handled in LoginPage
    }
    setIsLoading(false);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("swargfood-user");
    router.push("/"); // Redirect to home after logout
  };

  const promptLogin = () => {
    router.push('/login');
  };

  const isAdmin = currentUser?.email?.toLowerCase().endsWith("@swargfood.com") ?? false;

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
