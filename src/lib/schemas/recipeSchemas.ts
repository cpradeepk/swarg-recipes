
import { z } from 'zod';

// This can be used if you give temporary client-side IDs to ingredients before saving
// For now, we'll use indexes in the form for simplicity
// export const IngredientClientSideSchema = z.object({
//   tempId: z.string(), // or z.number() if using index
//   name: z.string().min(1, "Name is required"),
// });

export const IngredientFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative"), // Allow 0 for "to taste" items
  unit: z.string().min(1, "Unit is required"),
  imageUrl: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  aiHint: z.string().optional(),
});
export type IngredientFormData = z.infer<typeof IngredientFormSchema>;

export const RecipeStepFormSchema = z.object({
  instruction: z.string().min(1, "Instruction is required"),
  imageUrl: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  aiHint: z.string().optional(),
  timerInSeconds: z.coerce.number().int().nonnegative("Timer must be a non-negative integer").optional(),
  temperature: z.string().optional(),
  // selectedIngredientIndexes will store the indexes of ingredients from the form's ingredients array
  selectedIngredientIndexes: z.array(z.number()).optional().default([]),
});
export type RecipeStepFormData = z.infer<typeof RecipeStepFormSchema>;

export const NutritionalInfoFormSchema = z.object({
  calories: z.coerce.number().nonnegative("Calories must be non-negative").optional(),
  protein: z.coerce.number().nonnegative("Protein must be non-negative").optional(),
  fat: z.coerce.number().nonnegative("Fat must be non-negative").optional(),
  carbs: z.coerce.number().nonnegative("Carbs must be non-negative").optional(),
});
export type NutritionalInfoFormData = z.infer<typeof NutritionalInfoFormSchema>;

export const RecipeFormSchema = z.object({
  name: z.string().min(3, "Recipe name must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url({ message: "Must be a valid URL for the main image" }).optional().or(z.literal('')),
  aiHint: z.string().optional(),
  visibility: z.boolean().default(true),
  prepTime: z.string().optional().or(z.literal('')),
  cookTime: z.string().optional().or(z.literal('')),
  totalTime: z.string().optional().or(z.literal('')),
  servings: z.coerce.number().int().positive("Servings must be a positive integer if provided").optional(),
  nutritionalInfoPerServing: NutritionalInfoFormSchema.optional(),
  ingredients: z.array(IngredientFormSchema).min(1, "At least one ingredient is required"),
  steps: z.array(RecipeStepFormSchema).min(1, "At least one step is required"),
});

export type RecipeFormData = z.infer<typeof RecipeFormSchema>;
