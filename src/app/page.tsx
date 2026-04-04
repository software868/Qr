import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <span className="font-semibold">Check form</span>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto flex flex-1 flex-col px-4 py-10">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight">Check form &amp; Admin</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in, or create a staff account for the check form. Administrators manage all submissions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Check form</CardTitle>
                <CardDescription>
                  Select a product type, complete the dynamic checklist, attach photos, then get a unique ID and
                  printable QR label.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-2 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link href="/register/qc">Register</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/login?next=/qc">Sign in</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Administrator</CardTitle>
              <CardDescription>
                The first person to create an admin account sets up the organization. This link is only available
                until an admin exists.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/register">Create admin (first time only)</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
