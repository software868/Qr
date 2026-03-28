import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function QrLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "QR_USER" && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <DashboardShell title="QR Generator" nav={[{ href: "/qr", label: "New product" }]}>
      {children}
    </DashboardShell>
  );
}
