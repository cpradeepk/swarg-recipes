
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  imageUrl?: string;
  aiHint?: string;
  item_order?: number; // From DB
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  instruction: string;
  imageUrl?: string;
  aiHint?: string;
  timerInSeconds?: number;
  temperature?: string;
  // ingredientIds will store the actual DB IDs of ingredients associated with this step
  ingredientIds?: string[];
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  aiHint?: string;
  visibility?: boolean;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: number;
  nutritionalInfoPerServing?: NutritionalInfo;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string; // Will be VARCHAR(36) from DB
  email: string;
  name?: string;
  avatarUrl?: string;
  aiHint?: string;
  is_admin?: boolean; // From DB
  // password_hash is intentionally omitted from client-side type
}

export interface RecipePreparationLog {
  id: string;
  userId: string;
  userName: string; // This might be denormalized or fetched via JOIN
  recipeId: string;
  recipeName: string; // This might be denormalized or fetched via JOIN
  startTime: Date;
  endTime?: Date;
  duration?: string; // Consider storing as seconds (number) for easier calculation
  languageUsed?: string;
  // DB uses duration_seconds (INT) and created_at
}
