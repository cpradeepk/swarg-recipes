
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListPlus, Edit3, Eye } from "lucide-react";
import RecipeForm from "@/components/admin/RecipeForm"; // Import the new form

export default function AdminRecipesPage() {
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
            <p className="text-muted-foreground">
              Recipe table and management functionalities will be displayed here. This includes options to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
              <li>View all recipes (visible and hidden).</li>
              <li>Edit a recipe's details, ingredients, and steps.</li>
              <li>Toggle a recipe's visibility to users.</li>
              <li>Delete a recipe (with confirmation).</li>
            </ul>
            <div className="p-6 bg-muted rounded-md text-center">
                <Eye className="mx-auto h-12 w-12 text-primary mb-2" />
                <p className="font-semibold">Recipe Management Area</p>
                <p className="text-sm text-muted-foreground">Full recipe list and editing tools coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="add">
        {/* Replace placeholder with the RecipeForm component */}
        <RecipeForm />
      </TabsContent>
    </Tabs>
  );
}
