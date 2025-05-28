
import RecipeForm from "@/components/admin/RecipeForm";
import { getRecipeById, getAllRecipesForAdmin } from "@/lib/mockData"; // Assuming getAllRecipesForAdmin is not needed here.
import type { RecipeFormData } from "@/lib/schemas/recipeSchemas";
import type { Recipe, Ingredient, RecipeStep } from "@/types";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type EditRecipePageProps = {
  params: { recipeId: string };
};

// Helper to map DB recipe data to RecipeFormData
const mapRecipeToFormData = (recipe: Recipe): RecipeFormData => {
  // Create a map of ingredient DB IDs to their index in the recipe's ingredient list
  const ingredientIdToIndexMap = new Map<string, number>();
  recipe.ingredients.forEach((ing, index) => {
    ingredientIdToIndexMap.set(ing.id, index);
  });

  return {
    name: recipe.name,
    category: recipe.category,
    description: recipe.description || '',
    imageUrl: recipe.imageUrl || '',
    aiHint: recipe.aiHint || '',
    visibility: recipe.visibility ?? true,
    prepTime: recipe.prepTime || '',
    cookTime: recipe.cookTime || '',
    totalTime: recipe.totalTime || '',
    servings: recipe.servings,
    nutritionalInfoPerServing: {
      calories: recipe.nutritionalInfoPerServing?.calories,
      protein: recipe.nutritionalInfoPerServing?.protein,
      fat: recipe.nutritionalInfoPerServing?.fat,
      carbs: recipe.nutritionalInfoPerServing?.carbs,
    },
    ingredients: recipe.ingredients.map(ing => ({
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      imageUrl: ing.imageUrl || '',
      aiHint: ing.aiHint || '',
    })),
    steps: recipe.steps.map(step => ({
      instruction: step.instruction,
      imageUrl: step.imageUrl || '',
      aiHint: step.aiHint || '',
      timerInSeconds: step.timerInSeconds,
      temperature: step.temperature || '',
      selectedIngredientIndexes: step.ingredientIds
        ?.map(ingId => ingredientIdToIndexMap.get(ingId))
        .filter(index => index !== undefined) as number[] || [],
    })),
  };
};


export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const recipe = await getRecipeById(params.recipeId);

  if (!recipe) {
    notFound();
  }

  const recipeFormData = mapRecipeToFormData(recipe);

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/admin/recipes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipe Management
          </Link>
        </Button>
      </div>
      <RecipeForm initialData={recipeFormData} recipeId={recipe.id} />
    </div>
  );
}
