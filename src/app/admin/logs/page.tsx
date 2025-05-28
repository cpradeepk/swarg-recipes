
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, CheckCircle2, XCircle, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { getRecipePreparationLogsForAdmin } from "@/lib/mockData"; // DB service layer
import type { RecipePreparationLog } from "@/types";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import Link from "next/link"; // For linking photo URL

export default async function AdminLogsPage() {
  const logs: RecipePreparationLog[] = await getRecipePreparationLogsForAdmin();

  const formatDuration = (seconds: number | undefined | null): string => {
    if (seconds === undefined || seconds === null) return "N/A";
    if (seconds === 0 && logs.find(log => log.durationSeconds === 0 && !log.endTime)) return "In Progress"; // Special case for 0 if endTime is null
    const M = Math.floor(seconds / 60);
    const S = seconds % 60;
    return `${M}m ${S}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary"/>
            Recipe Preparation Logs
        </CardTitle>
        <CardDescription>
          View a history of all recipe preparations made by users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {logs.length === 0 ? (
          <div className="p-6 bg-muted rounded-md text-center">
            <ScrollText className="mx-auto h-12 w-12 text-primary mb-2" />
            <p className="font-semibold">No Preparation Logs Found</p>
            <p className="text-sm text-muted-foreground">Logs will appear here as users cook recipes.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Recipe</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">Wasted</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Weight/Preps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.userNameSnapshot || 'N/A'}</TableCell>
                  <TableCell>{log.recipeName || 'N/A'}</TableCell>
                  <TableCell>{log.languageUsed || 'N/A'}</TableCell>
                  <TableCell>{format(new Date(log.startTime), "PPpp")}</TableCell>
                  <TableCell>{log.endTime ? format(new Date(log.endTime), "PPpp") : "In Progress"}</TableCell>
                  <TableCell>{formatDuration(log.durationSeconds)}</TableCell>
                  <TableCell className="text-center">
                    {log.completedAllSteps ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mx-auto" />
                    )}
                  </TableCell>
                   <TableCell className="text-center">
                    {log.feedbackIsWasted ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                       log.endTime ? <Badge variant="secondary">No</Badge> : <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.feedbackPhotoUrl ? (
                      <Link href={log.feedbackPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        <ImageIcon size={16}/> View
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                        {log.feedbackProductWeight && <div>Wt: {log.feedbackProductWeight}</div>}
                        {log.feedbackNumPreps !== null && log.feedbackNumPreps !== undefined && <div>Qty: {log.feedbackNumPreps}</div>}
                        {(!log.feedbackProductWeight && (log.feedbackNumPreps === null || log.feedbackNumPreps === undefined)) && <span className="text-muted-foreground">N/A</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
