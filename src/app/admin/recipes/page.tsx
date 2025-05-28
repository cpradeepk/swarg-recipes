
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListPlus, Edit3 } from "lucide-react";
import RecipeForm from "@/components/admin/RecipeForm";
import AdminRecipeTable from "@/components/admin/AdminRecipeTable"; // Import the new table component
import { getAllRecipesForAdmin } from "@/lib/mockData"; // Function to fetch all recipes

export default async function AdminRecipesPage() {
  const allRecipes = await getAllRecipesForAdmin();

  return (
    <Tabs defaultValue="manage" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
        <TabsTrigger value="manage"><Edit3 className="mr-2 h-4 w-4 inline-block" />Manage Recipes</TabsTrigger>
        <TabsTrigger value="add"><ListPlus className="mr-2 h-4 w-4 inline-block" />Add New Recipe</TabsTrigger>
      </TabsList>
      <TabsContent value="manage">
        <Card>
          <CardHeader>
            <CardTitle>Manage Existing Recipes</CardTitle>
            <CardDescription>
              View, edit, toggle visibility, or delete recipes in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {allRecipes.length > 0 ? (
              <AdminRecipeTable recipes={allRecipes} />
            ) : (
              <div className="p-6 bg-muted rounded-md text-center">
                <Edit3 className="mx-auto h-12 w-12 text-primary mb-2" />
                <p className="font-semibold">No Recipes Found</p>
                <p className="text-sm text-muted-foreground">Add your first recipe using the 'Add New Recipe' tab.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="add">
        <RecipeForm />
      </TabsContent>
    </Tabs>
  );
}
