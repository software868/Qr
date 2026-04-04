import Link from "next/link";
import type { ReactNode } from "react";
import { UserMenu } from "@/components/layout/user-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon?: ReactNode };

export function DashboardShell({
  title,
  nav,
  children,
  sidebarExtra,
}: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
  sidebarExtra?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b bg-card md:w-56 md:border-b-0 md:border-r">
        <div className="flex h-14 items-center border-b px-4 md:h-16">
          <Link href="/" className="font-semibold tracking-tight">
            Check form
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {sidebarExtra ? <div className="px-2 pb-3 md:px-3">{sidebarExtra}</div> : null}
      </aside>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:h-16 md:px-6">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <UserMenu />
        </header>
        <Separator className="md:hidden" />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
