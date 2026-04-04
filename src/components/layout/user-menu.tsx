"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

function roleLabel(role: string | undefined): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "QC_USER":
      return "Quality checker";
    case "QR_USER":
      return "Staff";
    default:
      return role ?? "Signed in";
  }
}

export function UserMenu() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" aria-label="Open account menu">
            <User className="h-4 w-4 shrink-0" aria-hidden />
            <span className="max-w-[160px] truncate">{user?.email ?? "Account"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account</p>
              {user?.name ? <p className="text-sm font-semibold leading-tight">{user.name}</p> : null}
              <p className="text-xs text-muted-foreground break-all">{user?.email}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Role: </span>
                {roleLabel(user?.role)}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 pb-1">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Closing any signed-in tab or leaving the site ends your session (including other open tabs). Use{" "}
              <span className="font-medium text-foreground">Sign out</span> to leave without closing the tab.
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
