import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import type { UserRole } from "@prisma/client";
import { canAccessPath, defaultPathForRole } from "@/lib/auth/permissions";

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(ico|png|jpg|jpeg|svg|webp)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const session = request.auth;
  const role = session?.user?.role as UserRole | undefined;

  console.log("[MIDDLEWARE]", pathname, "| role:", role ?? "none", "| session:", session ? "yes" : "no");

  const isPublic =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/f/");

  if (pathname === "/" && role) {
    return NextResponse.redirect(new URL(defaultPathForRole(role), request.url));
  }

  if (isPublic) {
    if (
      session &&
      (pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/register/"))
    ) {
      const dest = role ? defaultPathForRole(role) : "/admin";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (!canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
