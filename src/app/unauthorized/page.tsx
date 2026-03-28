import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/layout/back-button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>You do not have permission to view this area.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <BackButton />
          <Button variant="outline" asChild className="gap-1.5">
            <Link href="/">
              <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
              Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
