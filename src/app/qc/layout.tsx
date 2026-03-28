import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function QcLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "QC_USER" && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const nav =
    session.user.role === "ADMIN"
      ? [
          { href: "/admin", label: "Admin dashboard" },
          { href: "/qc", label: "Run QC" },
        ]
      : [{ href: "/qc", label: "Run QC" }];

  return (
    <DashboardShell title="Quality check" nav={nav}>
      {children}
    </DashboardShell>
  );
}
