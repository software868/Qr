import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { RegisterForm } from "@/app/register/register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
  if (adminCount > 0) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <RegisterForm />
    </div>
  );
}
