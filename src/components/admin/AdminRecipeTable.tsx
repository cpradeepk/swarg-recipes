
"use client";

import type { Recipe } from "@/types";
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
import { Eye, EyeOff, Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns'; // For date formatting
import { useRouter } from "next/navigation"; // Import useRouter

interface AdminRecipeTableProps {
  recipes: Recipe[]; // Expecting recipes with at least id, name, category, visibility, createdAt, updatedAt
}

export default function AdminRecipeTable({ recipes }: AdminRecipeTableProps) {
  const router = useRouter(); // Initialize router

  // Placeholder functions for actions - to be implemented later
  const handleEdit = (recipeId: string) => {
    router.push(`/admin/recipes/edit/${recipeId}`);
  };

  const handleDelete = (recipeId: string) => {
    console.log("Delete recipe:", recipeId);
    // Show confirmation dialog, then call delete action
  };

  const handleToggleVisibility = (recipeId: string, currentVisibility: boolean) => {
    console.log("Toggle visibility for recipe:", recipeId, "to", !currentVisibility);
    // Call toggle visibility action
  };

  return (
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
                    onClick={() => handleDelete(recipe.id)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
