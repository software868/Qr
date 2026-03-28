import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@prisma/client";
import { canAccessPath, defaultPathForRole } from "@/lib/auth/permissions";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp)$/)
  ) {
    return NextResponse.next();
  }

  const isPublic =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/f/");

  const token = await getToken({
    req: request,
    secret: authSecret,
  });

  if (pathname === "/" && token?.role) {
    const role = token.role as UserRole;
    return NextResponse.redirect(new URL(defaultPathForRole(role), request.url));
  }

  if (isPublic) {
    if (
      token &&
      (pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/register/"))
    ) {
      const role = token.role as UserRole | undefined;
      const dest =
        role === "ADMIN" ? "/admin" : role === "QR_USER" ? "/qr" : role === "QC_USER" ? "/qc" : "/admin";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = token.role as UserRole | undefined;
  if (!canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
