"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { SignOutOnTabClose } from "@/components/auth/sign-out-on-tab-close";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SignOutOnTabClose />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
