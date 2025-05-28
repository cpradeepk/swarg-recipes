
import { getRecipeById } from "@/lib/mockData";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";
import InteractiveCookView from "@/components/cooking/InteractiveCookView";

type RecipeCookPageProps = {
  params: { recipeId: string };
};

export default async function RecipeCookPage({ params }: RecipeCookPageProps) {
  const recipe = await getRecipeById(params.recipeId);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href={`/recipes/${recipe.id}`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Recipe Details
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </Button>
      </div>

      <InteractiveCookView recipe={recipe} />
    </div>
  );
}
