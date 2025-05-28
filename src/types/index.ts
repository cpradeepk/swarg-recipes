export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  imageUrl?: string;
  aiHint?: string; 
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  instruction: string;
  imageUrl?: string;
  aiHint?: string; 
  timerInSeconds?: number;
  temperature?: string;
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
  description: string;
  imageUrl: string;
  aiHint?: string;
  visibility?: boolean;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: number;
  nutritionalInfoPerServing?: NutritionalInfo;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  createdAt?: Date; // Optional for mock data
  updatedAt?: Date; // Optional for mock data
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  aiHint?: string; 
}

export interface RecipePreparationLog {
  id: string;
  userId: string;
  userName: string;
  recipeId: string;
  recipeName: string;
  startTime: Date;
  endTime?: Date;
  duration?: string;
  languageUsed?: string;
}
