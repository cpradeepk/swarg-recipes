import { getRecipeById } from "@/lib/mockData";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Home } from "lucide-react";

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

      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Cooking: {recipe.name}</CardTitle>
          <CardDescription>Follow the steps below to create your delicious meal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-lg font-semibold text-foreground">
              Interactive cooking steps, timers, voice instructions, and progress bar will be displayed here.
            </p>
            <p className="text-muted-foreground mt-2">
              This page is under construction. Stay tuned for the full guided cooking experience!
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-primary mb-3">Recipe Steps Overview:</h3>
            <ul className="list-decimal list-inside space-y-2 bg-secondary/20 p-4 rounded-md">
              {recipe.steps.map(step => (
                <li key={step.id} className="text-foreground">
                  <span className="font-medium">Step {step.stepNumber}:</span> {step.instruction}
                  {step.timerInSeconds && <span className="text-sm text-primary ml-2">({Math.floor(step.timerInSeconds / 60)} min)</span>}
                  {step.temperature && <span className="text-sm text-accent ml-2">({step.temperature})</span>}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-between mt-8">
            <Button variant="outline" disabled>Previous Step</Button>
            <Button disabled>Next Step</Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
