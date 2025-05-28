import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export default function AdminLogsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recipe Preparation Logs</CardTitle>
        <CardDescription>
          View a history of all recipe preparations made by users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          A table displaying recipe preparation logs will be shown here. It will include:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
          <li>User name</li>
          <li>Recipe name</li>
          <li>Date of preparation</li>
          <li>Start time</li>
          <li>End time (or "In Progress")</li>
          <li>Duration of preparation</li>
        </ul>
        <p className="text-muted-foreground">
          Logs will be sortable, with the most recent entries appearing first.
        </p>
        <div className="p-6 bg-muted rounded-md text-center">
            <ScrollText className="mx-auto h-12 w-12 text-primary mb-2" />
            <p className="font-semibold">Preparation Logs Area</p>
            <p className="text-sm text-muted-foreground">Detailed log table coming soon.</p>
        </div>
      </CardContent>
    </Card>
  );
}
