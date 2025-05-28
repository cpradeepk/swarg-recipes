import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, Utensils } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0 relative">
        <Link href={`/recipes/${recipe.id}`} aria-label={`View recipe: ${recipe.name}`}>
          <Image
            src={recipe.imageUrl || "https://placehold.co/600x400.png"}
            alt={recipe.name}
            width={600}
            height={400}
            className="object-cover w-full h-48"
            data-ai-hint={recipe.aiHint || "food cooking"}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/recipes/${recipe.id}`}>
          <CardTitle className="text-xl font-semibold text-primary hover:underline mb-2">{recipe.name}</CardTitle>
        </Link>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {recipe.description}
        </CardDescription>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{recipe.totalTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} />
            <span>Serves {recipe.servings}</span>
          </div>
           <div className="flex items-center gap-1.5 pt-1">
            <Utensils size={14} />
            <span className="font-medium">{recipe.category}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild className="w-full" variant="default">
          <Link href={`/recipes/${recipe.id}`}>View Recipe</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
