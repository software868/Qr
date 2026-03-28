"use client";

/**
 * Catches root-level errors. Shows digest so you can match Vercel / server logs in production.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 font-sans text-foreground">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Check Vercel Function Logs for the same digest. If you just deployed, confirm the latest build includes
          the admin product / MongoDB ObjectId fix.
        </p>
        {error.digest && (
          <code className="rounded border bg-muted px-2 py-1 text-xs">Digest: {error.digest}</code>
        )}
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => reset()}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
