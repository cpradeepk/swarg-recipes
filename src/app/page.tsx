"use client";

import { useEffect, useState } from "react";
import { getRecipes } from "@/lib/mockData"; // Keep this import for fetching logic
import type { Recipe } from "@/types";
import RecipeCard from "@/components/recipes/RecipeCard";
import NameAuthModal from "@/components/auth/NameAuthModal";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Check authentication status from localStorage
    const authStatus = localStorage.getItem("swargRecipeUserAuthenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    setIsLoadingAuth(false);
  }, []);

  useEffect(() => {
    async function fetchRecipes() {
      if (isAuthenticated) {
        try {
          const fetchedRecipes = await getRecipes(); // Ensure getRecipes can be called client-side or move it
          setRecipes(fetchedRecipes);
        } catch (error) {
          console.error("Failed to fetch recipes:", error);
          // Handle error (e.g., show a message)
        } finally {
          setIsLoadingRecipes(false);
        }
      } else {
        // If not authenticated, don't load recipes yet, or load minimal data
        setRecipes([]); // Clear recipes if auth fails or is pending
        setIsLoadingRecipes(false);
      }
    }

    if (!isLoadingAuth) { // Only fetch recipes once auth status is determined
        fetchRecipes();
    }
  }, [isAuthenticated, isLoadingAuth]);

  const handleAuthenticationSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <NameAuthModal isOpen={!isAuthenticated} onAuthenticated={handleAuthenticationSuccess} />;
  }

  const recipesByCategory: { [key: string]: Recipe[] } = recipes.reduce((acc, recipe) => {
    const category = recipe.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(recipe);
    return acc;
  }, {} as { [key: string]: Recipe[] });

  return (
    <div className="space-y-12">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">Welcome to Swarg Recipes</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover delightful recipes and enjoy the art of cooking with our easy-to-follow guides.
        </p>
      </section>

      {isLoadingRecipes ? (
         <div className="flex flex-col items-center justify-center min-h-[20rem]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-md text-muted-foreground">Loading recipes...</p>
        </div>
      ) : Object.keys(recipesByCategory).length === 0 && !isLoadingRecipes ? (
        <p className="text-center text-xl text-muted-foreground py-10">No recipes available at the moment. Please check back later!</p>
      ) : (
        Object.entries(recipesByCategory).map(([category, recipesInCategory]) => (
          <section key={category} className="space-y-6">
            <h2 className="text-3xl font-semibold text-primary border-b-2 border-primary pb-2">
              {category}
            </h2>
            {recipesInCategory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recipesInCategory.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recipes found in this category.</p>
            )}
          </section>
        ))
      )}
    </div>
  );
}
