import type { UserRole } from "@prisma/client";

export function canAccessPath(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/qr")) return role === "ADMIN" || role === "QR_USER";
  if (pathname.startsWith("/qc")) return role === "ADMIN" || role === "QC_USER";
  return true;
}

export function defaultPathForRole(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "QR_USER":
      return "/qr";
    case "QC_USER":
      return "/qc";
    default:
      return "/";
  }
}
