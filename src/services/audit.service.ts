import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logAudit(
  userId: string | undefined,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        entity,
        entityId,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch {
    // non-blocking
  }
}
