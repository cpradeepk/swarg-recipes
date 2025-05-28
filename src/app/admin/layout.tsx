"use client";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/"); // Or a specific "access denied" page
    }
  }, [currentUser, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4">
        <ShieldAlert className="w-24 h-24 text-destructive mb-8" />
        <h1 className="text-4xl font-bold text-destructive mb-4">Access Denied</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          You do not have permission to view this page.
        </p>
        <Button asChild size="lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-primary mb-6 pb-2 border-b-2 border-primary">Admin Panel</h1>
      {children}
    </div>
  );
}
