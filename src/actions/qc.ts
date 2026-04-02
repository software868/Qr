"use server";

import { z } from "zod";
import { ProductType } from "@prisma/client";
import { auth } from "@/auth";
import { getBomForType } from "@/services/qc.service";
import { createQcUtilSubmission } from "@/services/qc-util.service";
import { logAudit } from "@/services/audit.service";
import type { Prisma } from "@prisma/client";

export async function getBomTemplateAction(productType: ProductType) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  if (session.user.role !== "QC_USER" && session.user.role !== "ADMIN" && session.user.role !== "QR_USER") {
    return { ok: false as const, error: "Forbidden" };
  }
  const bom = await getBomForType(productType);
  return { ok: true as const, bom };
}

const qcUtilSubmitSchema = z.object({
  productType: z.nativeEnum(ProductType),
  inspectorNotes: z.string().trim().max(5000).optional(),
  bomChecks: z.record(z.string(), z.boolean()).optional(),
});

export async function submitQcUtilFormAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  if (session.user.role !== "QC_USER" && session.user.role !== "ADMIN" && session.user.role !== "QR_USER") {
    return { ok: false as const, error: "Forbidden" };
  }

  let bomChecks: Record<string, boolean> = {};
  try {
    const raw = formData.get("bomChecks");
    if (raw) bomChecks = JSON.parse(String(raw)) as Record<string, boolean>;
  } catch {
    return { ok: false as const, error: "Invalid checklist data" };
  }

  const parsed = qcUtilSubmitSchema.safeParse({
    productType: formData.get("productType"),
    inspectorNotes: formData.get("inspectorNotes") ?? "",
    bomChecks,
  });
  if (!parsed.success) return { ok: false as const, error: "Invalid form data" };

  const bom = await getBomForType(parsed.data.productType);
  const lines = bom?.lines ?? [];
  const checkboxKeys = lines.map((l) => `bomOk:${l.id}`);
  const checks = parsed.data.bomChecks ?? {};
  const allPass =
    checkboxKeys.length === 0 || checkboxKeys.every((k) => checks[k] === true);
  if (!allPass) {
    return { ok: false as const, error: "All checklist items must pass before submission." };
  }

  const files = formData.getAll("images") as File[];
  const buffers: { buffer: Buffer; mimeType: string }[] = [];
  for (const f of files) {
    if (f.size === 0) continue;
    if (!f.type.startsWith("image/")) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    buffers.push({ buffer: buf, mimeType: f.type || "image/jpeg" });
  }

  const storedForm: Prisma.InputJsonValue = {
    passStatus: "pass",
    inspectorNotes: parsed.data.inspectorNotes ?? "",
    bomChecks: checks,
  };

  try {
    const result = await createQcUtilSubmission({
      productType: parsed.data.productType,
      formData: storedForm,
      performedById: session.user.id,
      images: buffers,
    });

    await logAudit(session.user.id, "QC_UTIL_SUBMIT", "QcUtilEntry", result.entryId, {
      entryUid: result.entryUid,
    });

    return {
      ok: true as const,
      entryUid: result.entryUid,
      qrDataUrl: result.qrDataUrl,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Submission failed";
    return { ok: false as const, error: msg };
  }
}
