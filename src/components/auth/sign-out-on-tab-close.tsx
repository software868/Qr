"use client";

import { getCsrfToken, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

const AUTH_BASE = "/api/auth";

function currentNavigationType(): string | undefined {
  const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  return entries[0]?.type;
}

/**
 * Ends the server session when the user leaves the page in a way that tears down the tab
 * (close tab/window, navigate away from the site). Skips reload so refresh stays signed in.
 * Uses keepalive so the sign-out request can finish after the page unloads.
 */
export function SignOutOnTabClose() {
  const { status } = useSession();
  const csrfRef = useRef("");
  const keyboardReloadRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated") {
      csrfRef.current = "";
      return;
    }

    const refreshCsrf = () => {
      void getCsrfToken().then((t) => {
        if (t) csrfRef.current = t;
      });
    };

    refreshCsrf();
    const interval = window.setInterval(refreshCsrf, 10 * 60 * 1000);
    const onFocus = () => refreshCsrf();
    window.addEventListener("focus", onFocus);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshCsrf();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F5" ||
        (e.ctrlKey && (e.key === "r" || e.key === "R")) ||
        (e.metaKey && (e.key === "r" || e.key === "R"))
      ) {
        keyboardReloadRef.current = true;
      }
    };
    window.addEventListener("keydown", onKeyDown, true);

    const onPageHide = (e: PageTransitionEvent) => {
      if (e.persisted) return;
      // Leaving login/register after a successful sign-in is a normal same-site navigation;
      // signing out here would clear the session before the next page loads (breaks /admin, /qc, etc.).
      const path = window.location.pathname;
      if (path === "/login" || path.startsWith("/register")) return;
      if (keyboardReloadRef.current) {
        keyboardReloadRef.current = false;
        return;
      }
      if (currentNavigationType() === "reload") return;

      const token = csrfRef.current;
      if (!token) return;

      const callbackUrl = `${window.location.origin}/login`;
      const body = new URLSearchParams({ csrfToken: token, callbackUrl });
      const url = `${AUTH_BASE}/signout`;

      // Prefer sendBeacon on unload; fall back to fetch keepalive.
      // Note: we intentionally omit X-Auth-Return-Redirect here — we don't want redirects during unload.
      const ok = navigator.sendBeacon?.(url, body);
      if (!ok) {
        void fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
          keepalive: true,
          credentials: "include",
        });
      }
    };

    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [status]);

  return null;
}
