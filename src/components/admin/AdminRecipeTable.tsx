
"use client";

import type { Recipe } from "@/types";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { deleteRecipeAction, toggleRecipeVisibilityAction } from "@/lib/actions/recipeActions";

interface AdminRecipeTableProps {
  recipes: Recipe[];
}

export default function AdminRecipeTable({ recipes: initialRecipes }: AdminRecipeTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // recipeId or null
  const [isToggling, setIsToggling] = useState<string | null>(null); // recipeId or null
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  const handleEdit = (recipeId: string) => {
    router.push(`/admin/recipes/edit/${recipeId}`);
  };

  const confirmDelete = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!recipeToDelete) return;
    setIsDeleting(recipeToDelete.id);
    setShowDeleteDialog(false);

    const result = await deleteRecipeAction(recipeToDelete.id);
    if (result.success) {
      toast({
        title: "Recipe Deleted",
        description: `Recipe "${recipeToDelete.name}" has been successfully deleted.`,
      });
      setRecipes(prevRecipes => prevRecipes.filter(r => r.id !== recipeToDelete.id));
    } else {
      toast({
        title: "Error Deleting Recipe",
        description: result.message || "Could not delete the recipe.",
        variant: "destructive",
      });
    }
    setRecipeToDelete(null);
    setIsDeleting(null);
  };

  const handleToggleVisibility = async (recipeId: string, currentVisibility: boolean) => {
    setIsToggling(recipeId);
    const result = await toggleRecipeVisibilityAction(recipeId, currentVisibility);
    if (result.success && result.newVisibility !== undefined) {
      toast({
        title: "Visibility Updated",
        description: `Recipe visibility set to ${result.newVisibility ? "Visible" : "Hidden"}.`,
      });
      setRecipes(prevRecipes => 
        prevRecipes.map(r => 
          r.id === recipeId ? { ...r, visibility: result.newVisibility } : r
        )
      );
    } else {
      toast({
        title: "Error Updating Visibility",
        description: result.message || "Could not update visibility.",
        variant: "destructive",
      });
    }
    setIsToggling(null);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-center">Visibility</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipes.map((recipe) => (
            <TableRow key={recipe.id}>
              <TableCell className="font-medium">{recipe.name}</TableCell>
              <TableCell>{recipe.category}</TableCell>
              <TableCell className="text-center">
                <Badge variant={recipe.visibility ? "default" : "secondary"}>
                  {recipe.visibility ? (
                    <Eye className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="mr-1 h-3.5 w-3.5" />
                  )}
                  {recipe.visibility ? "Visible" : "Hidden"}
                </Badge>
              </TableCell>
              <TableCell>
                {recipe.createdAt ? format(new Date(recipe.createdAt), "PPp") : 'N/A'}
              </TableCell>
              <TableCell>
                {recipe.updatedAt ? format(new Date(recipe.updatedAt), "PPp") : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                {isDeleting === recipe.id || isToggling === recipe.id ? (
                  <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEdit(recipe.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleVisibility(recipe.id, recipe.visibility ?? false)}
                      disabled={isToggling === recipe.id}
                    >
                      {recipe.visibility ? (
                        <EyeOff className="mr-2 h-4 w-4" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4" />
                      )}
                      {recipe.visibility ? "Hide" : "Show"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => confirmDelete(recipe)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      disabled={isDeleting === recipe.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the recipe
              "{recipeToDelete?.name}" and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecipeToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting === recipeToDelete?.id}
            >
              {isDeleting === recipeToDelete?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
