import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ListChecks, FileText, Settings, Users } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to the Admin Dashboard</CardTitle>
          <CardDescription>Manage recipes, view logs, and configure application settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select an option from the navigation or use the quick links below to get started.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <ListChecks className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Recipe Management</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Add, edit, and manage all recipes in the system. Control visibility and details.</CardDescription>
          </CardContent>
          <CardContent>
             <Button asChild className="w-full">
                <Link href="/admin/recipes">Manage Recipes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Recipe Preparation Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>View logs of recipe preparations by users, including timings and completion status.</CardDescription>
          </CardContent>
           <CardContent>
             <Button asChild className="w-full">
                <Link href="/admin/logs">View Logs</Link>
            </Button>
          </CardContent>
        </Card>
        
        {/* Placeholder for future admin features */}
        <Card className="hover:shadow-lg transition-shadow opacity-50 cursor-not-allowed">
          <CardHeader>
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>Manage user accounts and permissions (coming soon).</CardDescription>
          </CardContent>
           <CardContent>
             <Button disabled className="w-full">Manage Users</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
