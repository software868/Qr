import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { UserRole } from "@prisma/client";
import { canAccessPath, defaultPathForRole } from "@/lib/auth/permissions";

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const useSecureCookies =
  process.env.NEXTAUTH_URL?.startsWith("https://") === true ||
  process.env.VERCEL === "1";

const sessionCookieName = useSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/qr" || pathname.startsWith("/qr/")) {
    return NextResponse.redirect(new URL("/qc", request.url));
  }

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(ico|png|jpg|jpeg|svg|webp)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret,
    secureCookie: useSecureCookies,
    cookieName: sessionCookieName,
    salt: sessionCookieName,
  });

  const role = token?.role as UserRole | undefined;

  const isPublic =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/f/") ||
    pathname.startsWith("/q/");

  if (pathname === "/" && role) {
    return NextResponse.redirect(new URL(defaultPathForRole(role), request.url));
  }

  if (isPublic) {
    if (
      token &&
      (pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/register/"))
    ) {
      const dest = role ? defaultPathForRole(role) : "/admin";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (!canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
