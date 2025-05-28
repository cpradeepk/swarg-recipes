
'use server';

import { z } from 'zod';
import type { RecipeFormData } from '@/lib/schemas/recipeSchemas';
import { RecipeFormSchema } from '@/lib/schemas/recipeSchemas';
import { addRecipe as addRecipeToDb } from '@/lib/mockData'; 
import type { Recipe, Ingredient, RecipeStep } from '@/types';

// Helper function to map form ingredient data to DB structure for saving
// Note: The actual ID generation for ingredients will happen in addRecipeToDb
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
// Note: The actual ID generation for steps will happen in addRecipeToDb
// This also handles mapping selectedIngredientIndexes to a structure that addRecipeToDb can use
const mapFormSteps = (formDataSteps: RecipeFormData['steps']): (Omit<RecipeStep, 'id' | 'ingredientIds'> & { selectedIngredientIndexes?: number[] })[] => {
  return formDataSteps.map((step, index) => ({
    stepNumber: index + 1,
    instruction: step.instruction,
    imageUrl: step.imageUrl || undefined,
    aiHint: step.aiHint || undefined,
    timerInSeconds: step.timerInSeconds,
    temperature: step.temperature || undefined,
    selectedIngredientIndexes: step.selectedIngredientIndexes || [], // Pass along the indexes
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
    
    // The addRecipeToDb function will now handle creating ingredients, steps, 
    // and the step-ingredient associations.
    const createdRecipe = await addRecipeToDb(recipeToCreate as any); // Cast as any for now due to nested structures

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
