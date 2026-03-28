"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  /** Used when there is no in-app history (e.g. direct link). */
  fallbackHref?: string;
  label?: string;
};

export function BackButton({ fallbackHref = "/", label = "Go back" }: Props) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="default"
      className="gap-1.5"
      onClick={() => {
        const ref = typeof document !== "undefined" ? document.referrer : "";
        const sameOrigin =
          ref && typeof window !== "undefined" && ref.startsWith(window.location.origin);
        if (sameOrigin) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
    >
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Button>
  );
}
