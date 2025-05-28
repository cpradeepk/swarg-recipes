import { getRecipes } from "@/lib/mockData";
import type { Recipe } from "@/types";
import RecipeCard from "@/components/recipes/RecipeCard";
import { Separator } from "@/components/ui/separator";

export default async function Home() {
  const recipes = await getRecipes();

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
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">Welcome to SwargFood Simplified</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover delightful recipes and enjoy the art of cooking with our easy-to-follow guides.
        </p>
      </section>

      {Object.entries(recipesByCategory).map(([category, recipesInCategory]) => (
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
      ))}
      {Object.keys(recipesByCategory).length === 0 && (
         <p className="text-center text-xl text-muted-foreground py-10">No recipes available at the moment. Please check back later!</p>
      )}
    </div>
  );
}
