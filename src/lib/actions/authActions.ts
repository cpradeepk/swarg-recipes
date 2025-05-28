
'use server';

import { getUserByEmail, findOrCreateUserByName as findOrCreateUserByNameDb } from "@/lib/mockData"; // mockData is now db service
import type { User } from "@/types";

interface ActionResult {
  success: boolean;
  user?: User | null;
  error?: string;
}

export async function loginUserAction(email: string): Promise<ActionResult> {
  try {
    // Ensure email is treated as required here for admin login
    if (!email) {
        return { success: false, error: "Email is required for admin login." };
    }
    const user = await getUserByEmail(email);
    if (user) {
      return { success: true, user };
    } else {
      // getUserByEmail might create an admin user if email matches pattern,
      // so this path might mean email pattern didn't match for auto-creation
      // or a non-admin email was not found.
      return { success: false, error: "Admin user not found or credentials incorrect." };
    }
  } catch (error) {
    console.error("Error in loginUserAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during login.";
    return { success: false, error: errorMessage };
  }
}

interface FindOrCreateUserResult {
    success: boolean;
    userId?: string;
    userName?: string;
    error?: string;
}

export async function findOrCreateUserByNameAction(name: string): Promise<FindOrCreateUserResult> {
    if (!name || name.trim() === "") {
        return { success: false, error: "Name cannot be empty." };
    }
    try {
        const user = await findOrCreateUserByNameDb(name.trim());
        if (user) {
            return { success: true, userId: user.id, userName: user.name };
        } else {
            return { success: false, error: "Could not find or create user." };
        }
    } catch (error) {
        console.error("Error in findOrCreateUserByNameAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        return { success: false, error: errorMessage };
    }
}
