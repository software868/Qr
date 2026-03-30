import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getMyProductsAction } from "@/actions/product";
import { QrHistorySidebar } from "@/components/qr/qr-history-sidebar";

export const dynamic = "force-dynamic";

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

  const history = await getMyProductsAction();

  return (
    <DashboardShell
      title="QR Generator"
      nav={nav}
      sidebarExtra={<QrHistorySidebar history={history} />}
    >
      {children}
    </DashboardShell>
  );
}
