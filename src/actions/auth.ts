"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/services/audit.service";

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
});

export async function registerFirstAdmin(formData: FormData) {
  const adminCount = await prisma.user.count({ where: { role: UserRole.ADMIN } });
  if (adminCount > 0) {
    return { ok: false as const, error: "Registration is closed. An administrator already exists." };
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }

  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return { ok: false as const, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: UserRole.ADMIN,
    },
  });

  await logAudit(user.id, "USER_REGISTER", "User", user.id, { role: "ADMIN" });

  return { ok: true as const };
}

const staffRegisterSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
  role: z.enum(["QR_USER", "QC_USER"]),
});

/** Public self-registration for QR Generator or QC (linked from the home page). */
export async function registerStaffPublic(formData: FormData, role: "QR_USER" | "QC_USER") {
  const parsed = staffRegisterSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role,
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Please check all fields." };
  }

  const { email, password, name, role: r } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return { ok: false as const, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: r === "QR_USER" ? UserRole.QR_USER : UserRole.QC_USER,
    },
  });

  await logAudit(undefined, "USER_REGISTER", "User", user.id, { role: r, source: "public" });

  return { ok: true as const };
}

export async function registerQrGeneratorUser(formData: FormData) {
  return registerStaffPublic(formData, "QR_USER");
}

export async function registerQcUser(formData: FormData) {
  return registerStaffPublic(formData, "QC_USER");
}
