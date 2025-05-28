
import { getRecipeById } from "@/lib/mockData";
import Image from "next/image";
import Link from "next/link"; // Import Link
import { Button } from "@/components/ui/button"; // Import Button
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Utensils, ChefHat, PlayCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
// RecipeStartCookingForm is no longer needed here

type RecipeDetailPageProps = {
  params: { recipeId: string };
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const recipe = await getRecipeById(params.recipeId);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden shadow-xl">
        <CardHeader className="p-0 relative">
          <Image
            src={recipe.imageUrl || "https://placehold.co/800x400.png"}
            alt={recipe.name}
            width={800}
            height={400}
            className="object-cover w-full h-64 md:h-96"
            data-ai-hint={recipe.aiHint || "food cooking"}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 md:p-8">
            <Badge variant="secondary" className="mb-2 text-sm">{recipe.category}</Badge>
            <CardTitle className="text-3xl md:text-4xl font-bold text-primary-foreground">{recipe.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <CardDescription className="text-lg text-foreground">
            {recipe.description}
          </CardDescription>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <Clock className="mx-auto h-7 w-7 text-primary mb-1.5" />
              <p className="text-xs text-muted-foreground">Prep Time</p>
              <p className="font-semibold">{recipe.prepTime || "N/A"}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <ChefHat className="mx-auto h-7 w-7 text-primary mb-1.5" />
              <p className="text-xs text-muted-foreground">Cook Time</p>
              <p className="font-semibold">{recipe.cookTime || "N/A"}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <Clock className="mx-auto h-7 w-7 text-primary mb-1.5" />
              <p className="text-xs text-muted-foreground">Total Time</p>
              <p className="font-semibold">{recipe.totalTime || "N/A"}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <Users className="mx-auto h-7 w-7 text-primary mb-1.5" />
              <p className="text-xs text-muted-foreground">Servings</p>
              <p className="font-semibold">{recipe.servings || "N/A"}</p>
            </div>
          </div>

          <Separator />
          
          <div className="bg-secondary/30 p-4 rounded-lg">
            <h3 className="text-xl font-semibold text-primary mb-3 flex items-center gap-2">
              <Utensils size={22}/> Ingredients & Nutrition
            </h3>
            <p className="text-muted-foreground text-sm mb-3">Serving scaler and dynamic nutritional information coming soon!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Ingredients:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {recipe.ingredients.map(ing => (
                    <li key={ing.id}>{ing.quantity} {ing.unit} {ing.name}</li>
                  ))}
                </ul>
              </div>
              {recipe.nutritionalInfoPerServing && (
                <div>
                  <h4 className="font-medium mb-2">Nutritional Info (per serving):</h4>
                  <ul className="text-sm space-y-1">
                    {Object.entries(recipe.nutritionalInfoPerServing).map(([key, value]) => (
                       value && <li key={key}><span className="capitalize">{key}:</span> {value}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <Separator />

          {/* Direct link to cooking page */}
          <div className="text-center">
            <Button asChild size="lg" className="text-lg py-6 px-10">
              <Link href={`/recipes/${recipe.id}/cook`}>
                <PlayCircle className="mr-2 h-6 w-6" />
                Start Cooking
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
