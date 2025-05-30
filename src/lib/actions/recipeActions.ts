
'use server';

import { z } from 'zod';
import type { RecipeFormData } from '@/lib/schemas/recipeSchemas';
import { RecipeFormSchema } from '@/lib/schemas/recipeSchemas';
import { 
  addRecipe as addRecipeToDb, 
  updateRecipe as updateRecipeInDb,
  deleteRecipe as deleteRecipeFromDb,
  toggleRecipeVisibility as toggleRecipeVisibilityInDb
} from '@/lib/mockData'; 
import type { Recipe, Ingredient, RecipeStep } from '@/types';
import { revalidatePath } from 'next/cache';

// Helper function to map form ingredient data to DB structure for saving
const mapFormIngredients = (formDataIngredients: RecipeFormData['ingredients']): Omit<Ingredient, 'id'>[] => {
  return formDataIngredients.map((ing, index) => ({
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    imageUrl: ing.imageUrl || undefined,
    aiHint: ing.aiHint || undefined,
    item_order: index,
  }));
};

// Helper function to map form step data to DB structure for saving
const mapFormSteps = (formDataSteps: RecipeFormData['steps']): (Omit<RecipeStep, 'id' | 'ingredientIds'> & { selectedIngredientIndexes?: number[] })[] => {
  return formDataSteps.map((step, index) => ({
    stepNumber: index + 1,
    instruction: step.instruction,
    imageUrl: step.imageUrl || undefined,
    aiHint: step.aiHint || undefined,
    timerInSeconds: step.timerInSeconds,
    temperature: step.temperature || undefined,
    selectedIngredientIndexes: step.selectedIngredientIndexes || [],
  }));
};


export async function createRecipeAction(
  data: RecipeFormData
): Promise<{ success: boolean; message: string; recipeId?: string }> {
  try {
    const validatedData = RecipeFormSchema.parse(data);

    const mappedIngredients = mapFormIngredients(validatedData.ingredients);
    const mappedSteps = mapFormSteps(validatedData.steps);

    const recipeToCreate: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'ingredients' | 'steps'> & {
      ingredients: Omit<Ingredient, 'id'>[];
      steps: (Omit<RecipeStep, 'id' | 'ingredientIds'> & { selectedIngredientIndexes?: number[] })[];
    } = {
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description || undefined,
      imageUrl: validatedData.imageUrl || undefined,
      aiHint: validatedData.aiHint || undefined,
      visibility: validatedData.visibility,
      prepTime: validatedData.prepTime || undefined,
      cookTime: validatedData.cookTime || undefined,
      totalTime: validatedData.totalTime || undefined,
      servings: validatedData.servings,
      nutritionalInfoPerServing: validatedData.nutritionalInfoPerServing ? {
        calories: validatedData.nutritionalInfoPerServing.calories,
        protein: validatedData.nutritionalInfoPerServing.protein,
        fat: validatedData.nutritionalInfoPerServing.fat,
        carbs: validatedData.nutritionalInfoPerServing.carbs,
      } : undefined,
      ingredients: mappedIngredients,
      steps: mappedSteps,
    };
    
    const createdRecipe = await addRecipeToDb(recipeToCreate as any); 
    revalidatePath('/admin/recipes'); // Revalidate to show the new recipe in the table
    revalidatePath('/'); // Revalidate home page in case it affects listings
    return { success: true, message: 'Recipe created successfully!', recipeId: createdRecipe.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod validation error in createRecipeAction:", error.errors);
      return { success: false, message: 'Validation failed. Please check your input.' };
    }
    console.error('Error creating recipe in action:', error);
    const errorMessage = (error instanceof Error && error.message) ? error.message : 'An unexpected error occurred while creating the recipe.';
    return { success: false, message: errorMessage };
  }
}

export async function updateRecipeAction(
  recipeId: string,
  data: RecipeFormData
): Promise<{ success: boolean; message: string; recipeId?: string }> {
  try {
    const validatedData = RecipeFormSchema.parse(data);

    const mappedIngredients = mapFormIngredients(validatedData.ingredients);
    const mappedSteps = mapFormSteps(validatedData.steps);

    const recipeToUpdate: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'ingredients' | 'steps'> & {
      ingredients: Omit<Ingredient, 'id'>[];
      steps: (Omit<RecipeStep, 'id' | 'ingredientIds'> & { selectedIngredientIndexes?: number[] })[];
    } = {
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description || undefined,
      imageUrl: validatedData.imageUrl || undefined,
      aiHint: validatedData.aiHint || undefined,
      visibility: validatedData.visibility,
      prepTime: validatedData.prepTime || undefined,
      cookTime: validatedData.cookTime || undefined,
      totalTime: validatedData.totalTime || undefined,
      servings: validatedData.servings,
      nutritionalInfoPerServing: validatedData.nutritionalInfoPerServing ? {
        calories: validatedData.nutritionalInfoPerServing.calories,
        protein: validatedData.nutritionalInfoPerServing.protein,
        fat: validatedData.nutritionalInfoPerServing.fat,
        carbs: validatedData.nutritionalInfoPerServing.carbs,
      } : undefined,
      ingredients: mappedIngredients,
      steps: mappedSteps,
    };

    const updatedRecipe = await updateRecipeInDb(recipeId, recipeToUpdate as any);

    if (updatedRecipe) {
      revalidatePath('/admin/recipes'); // Revalidate the admin recipes table
      revalidatePath(`/admin/recipes/edit/${recipeId}`); // Revalidate the edit page itself
      revalidatePath(`/recipes/${recipeId}`); // Revalidate the public recipe view
      revalidatePath('/'); // Revalidate home page
      return { success: true, message: 'Recipe updated successfully!', recipeId: updatedRecipe.id };
    } else {
      return { success: false, message: 'Failed to update recipe. Recipe not found or an error occurred.' };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Zod validation error in updateRecipeAction:", error.errors);
      return { success: false, message: 'Validation failed. Please check your input.' };
    }
    console.error('Error updating recipe in action:', error);
    const errorMessage = (error instanceof Error && error.message) ? error.message : 'An unexpected error occurred while updating the recipe.';
    return { success: false, message: errorMessage };
  }
}

export async function deleteRecipeAction(recipeId: string): Promise<{ success: boolean; message: string }> {
  try {
    const success = await deleteRecipeFromDb(recipeId);
    if (success) {
      revalidatePath('/admin/recipes');
      revalidatePath('/');
      return { success: true, message: 'Recipe deleted successfully!' };
    } else {
      return { success: false, message: 'Failed to delete recipe. Recipe not found or an error occurred.' };
    }
  } catch (error) {
    console.error('Error deleting recipe in action:', error);
    const errorMessage = (error instanceof Error && error.message) ? error.message : 'An unexpected error occurred.';
    return { success: false, message: errorMessage };
  }
}

export async function toggleRecipeVisibilityAction(recipeId: string, currentVisibility: boolean): Promise<{ success: boolean; message: string, newVisibility?: boolean }> {
  try {
    const newVisibility = !currentVisibility;
    const updatedRecipe = await toggleRecipeVisibilityInDb(recipeId, newVisibility);
    if (updatedRecipe) {
      revalidatePath('/admin/recipes');
      revalidatePath(`/recipes/${recipeId}`);
      revalidatePath('/');
      return { success: true, message: `Recipe visibility set to ${newVisibility ? 'Visible' : 'Hidden'}.`, newVisibility };
    } else {
      return { success: false, message: 'Failed to update recipe visibility.' };
    }
  } catch (error) {
    console.error('Error toggling recipe visibility in action:', error);
    const errorMessage = (error instanceof Error && error.message) ? error.message : 'An unexpected error occurred.';
    return { success: false, message: errorMessage };
  }
}
