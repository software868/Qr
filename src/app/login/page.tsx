"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const nextParam = searchParams.get("next") ?? "";
  const registered = searchParams.get("registered");
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setErrorMsg(
          res?.error === "CredentialsSignin"
            ? "Invalid email or password."
            : `Login failed: ${res?.error ?? "No response"}`
        );
        setPending(false);
        return;
      }

      if (!res.ok) {
        setErrorMsg(`Login failed (status ${res.status}).`);
        setPending(false);
        return;
      }

      const dest =
        nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
          ? nextParam
          : callbackUrl && callbackUrl.startsWith("/") && callbackUrl !== "/login"
            ? callbackUrl
            : "/";

      window.location.href = dest;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md border shadow-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your work email and password.</CardDescription>
      </CardHeader>
      <CardContent>
        {registered && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            Account created successfully! Please sign in.
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {errorMsg && (
            <p className="text-sm text-destructive">{errorMsg}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New user?{" "}
          <Link href="/register/qr" className="underline underline-offset-4">
            QR Generator
          </Link>
          {" · "}
          <Link href="/register/qc" className="underline underline-offset-4">
            QC
          </Link>
          {" · "}
          <Link href="/register" className="underline underline-offset-4">
            Admin (first setup)
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
