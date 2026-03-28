import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/unauthorized");

  return (
    <DashboardShell
      title="Admin"
      nav={[{ href: "/admin", label: "Dashboard" }]}
    >
      {children}
    </DashboardShell>
  );
}
