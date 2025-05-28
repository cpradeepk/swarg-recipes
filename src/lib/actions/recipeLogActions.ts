
'use server';

import { 
    createRecipeLogEntry as createRecipeLogEntryDb,
    updateRecipeLogEntry as updateRecipeLogEntryDb,
    getRecipeById // To fetch recipe name for logging
} from '@/lib/mockData'; // mockData is now db service layer
import type { RecipePreparationLogFeedback } from '@/types';
import { revalidatePath } from 'next/cache';

interface StartLogResult {
    success: boolean;
    logId?: string;
    error?: string;
}

export async function startRecipeLogAction(
    userId: string,
    userName: string, // Pass username for snapshot
    recipeId: string,
    startTime: Date,
    languageUsed: string
): Promise<StartLogResult> {
    if (!userId || !recipeId || !startTime) {
        return { success: false, error: "Missing required data to start log." };
    }
    try {
        const recipe = await getRecipeById(recipeId);
        const recipeNameSnapshot = recipe?.name || "Unknown Recipe";

        const logId = await createRecipeLogEntryDb({
            userId,
            userNameSnapshot: userName,
            recipeId,
            recipeNameSnapshot,
            startTime,
            languageUsed,
        });
        if (logId) {
            return { success: true, logId };
        } else {
            return { success: false, error: "Failed to create log entry." };
        }
    } catch (error) {
        console.error("Error in startRecipeLogAction:", error);
        return { success: false, error: "Server error while starting log." };
    }
}

interface EndLogResult {
    success: boolean;
    error?: string;
}

export async function endRecipeLogAction(
    logId: string,
    endTime: Date,
    durationSeconds: number,
    completedAllSteps: boolean,
    feedback: RecipePreparationLogFeedback
): Promise<EndLogResult> {
    if (!logId || !endTime || durationSeconds < 0) {
        return { success: false, error: "Missing required data to end log." };
    }
    try {
        const success = await updateRecipeLogEntryDb(logId, {
            endTime,
            durationSeconds,
            completedAllSteps,
            feedbackPhotoUrl: feedback.photoUrl,
            feedbackProductWeight: feedback.productWeight,
            feedbackNumPreps: feedback.numPreps,
            feedbackIsWasted: feedback.isWasted,
        });

        if (success) {
            revalidatePath('/admin/logs'); // Revalidate admin logs page
            return { success: true };
        } else {
            return { success: false, error: "Failed to update log entry." };
        }
    } catch (error) {
        console.error("Error in endRecipeLogAction:", error);
        return { success: false, error: "Server error while ending log." };
    }
}
