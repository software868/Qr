"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-16">
      <p className="text-center text-muted-foreground">Something went wrong loading this page.</p>
      {isDev && (
        <pre className="max-h-48 max-w-full overflow-auto rounded-md border bg-muted p-3 text-left text-xs text-destructive">
          {error.message}
          {error.digest ? `\nDigest: ${error.digest}` : ""}
        </pre>
      )}
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
