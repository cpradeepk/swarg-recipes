
'use server';

import { z } from 'zod';
import type { RecipeFormData } from '@/lib/schemas/recipeSchemas';
import { RecipeFormSchema } from '@/lib/schemas/recipeSchemas';
import { addRecipe } from '@/lib/mockData'; // We will create this function
import type { Recipe, Ingredient, RecipeStep, NutritionalInfo } from '@/types';

// Helper to generate unique IDs (simple version for mock data)
const generateId = (prefix: string = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export async function createRecipeAction(
  data: RecipeFormData
): Promise<{ success: boolean; message: string; recipeId?: string }> {
  try {
    const validatedData = RecipeFormSchema.parse(data);

    const newRecipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
      name: validatedData.name,
      category: validatedData.category,
      description: validatedData.description,
      imageUrl: validatedData.imageUrl,
      aiHint: validatedData.aiHint,
      visibility: validatedData.visibility,
      prepTime: validatedData.prepTime,
      cookTime: validatedData.cookTime,
      totalTime: validatedData.totalTime,
      servings: validatedData.servings,
      nutritionalInfoPerServing: validatedData.nutritionalInfoPerServing ? {
        calories: validatedData.nutritionalInfoPerServing.calories,
        protein: validatedData.nutritionalInfoPerServing.protein,
        fat: validatedData.nutritionalInfoPerServing.fat,
        carbs: validatedData.nutritionalInfoPerServing.carbs,
      } : undefined,
      ingredients: validatedData.ingredients.map(ing => ({
        id: generateId('ing'), // Generate ID here
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        imageUrl: ing.imageUrl || undefined,
        aiHint: ing.aiHint || undefined,
      })),
      steps: validatedData.steps.map((step, index) => ({
        id: generateId('step'), // Generate ID here
        stepNumber: index + 1, // Assign step number
        instruction: step.instruction,
        imageUrl: step.imageUrl || undefined,
        aiHint: step.aiHint || undefined,
        timerInSeconds: step.timerInSeconds,
        temperature: step.temperature || undefined,
        // ingredientIds: [] // Placeholder, will be handled if UI supports association
      })),
    };

    const createdRecipe = await addRecipe(newRecipe);

    return { success: true, message: 'Recipe created successfully!', recipeId: createdRecipe.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Log detailed Zod errors for server-side debugging
      console.error("Zod validation error in createRecipeAction:", error.errors);
      return { success: false, message: 'Validation failed. Please check your input.' };
    }
    console.error('Error creating recipe:', error);
    return { success: false, message: 'An unexpected error occurred while creating the recipe.' };
  }
}
