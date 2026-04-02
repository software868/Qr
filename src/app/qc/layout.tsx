import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function QcLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (
    session.user.role !== "QC_USER" &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "QR_USER"
  ) {
    redirect("/unauthorized");
  }

  const nav =
    session.user.role === "ADMIN"
      ? [
          { href: "/admin", label: "Admin" },
          { href: "/qc", label: "Q-Util Check" },
        ]
      : [{ href: "/qc", label: "Q-Util Check" }];

  return (
    <DashboardShell title="Q-Util Check" nav={nav}>
      {children}
    </DashboardShell>
  );
}
