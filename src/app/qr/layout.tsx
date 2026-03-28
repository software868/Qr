import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function QrLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "QR_USER" && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const nav =
    session.user.role === "ADMIN"
      ? [
          { href: "/admin", label: "Admin dashboard" },
          { href: "/qr", label: "New product" },
        ]
      : [{ href: "/qr", label: "New product" }];

  return (
    <DashboardShell title="QR Generator" nav={nav}>
      {children}
    </DashboardShell>
  );
}
