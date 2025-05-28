
'use server';

import { getUserByEmail } from "@/lib/mockData";
import type { User } from "@/types";

interface ActionResult {
  success: boolean;
  user?: User | null;
  error?: string;
}

export async function loginUserAction(email: string): Promise<ActionResult> {
  try {
    const user = await getUserByEmail(email);
    if (user) {
      return { success: true, user };
    } else {
      return { success: false, error: "User not found or credentials incorrect." };
    }
  } catch (error) {
    console.error("Error in loginUserAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during login.";
    return { success: false, error: errorMessage };
  }
}
