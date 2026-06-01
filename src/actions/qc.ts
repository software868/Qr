"use server";

import { z } from "zod";
import { ProductType } from "@prisma/client";
import { auth } from "@/auth";
import { createQcUtilSubmission } from "@/services/qc-util.service";
import { logAudit } from "@/services/audit.service";
import { getExpectedChecklistKeys } from "@/lib/qc-util/checklists";
import type { Prisma } from "@prisma/client";

const qcUtilSubmitSchema = z.object({
  productType: z.nativeEnum(ProductType),
  lotNumber: z.string().trim().min(1).max(120),
  inspectorNotes: z.string().trim().max(5000).optional(),
  checklist: z.record(z.string(), z.boolean()).optional(),
  checklistRows: z
    .array(
      z.object({
        key: z.string().max(200),
        label: z.string().max(1000).optional(),
        specification: z.string().max(5000).optional(),
        observation: z.string().max(5000).optional(),
        checked: z.boolean().optional(),
        custom: z.boolean().optional(),
      }),
    )
    .optional(),
});

export async function submitQcUtilFormAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  if (session.user.role !== "QC_USER" && session.user.role !== "ADMIN" && session.user.role !== "QR_USER") {
    return { ok: false as const, error: "Forbidden" };
  }

  let checklist: Record<string, boolean> = {};
  try {
    const raw = formData.get("checklist");
    if (raw) checklist = JSON.parse(String(raw)) as Record<string, boolean>;
  } catch {
    return { ok: false as const, error: "Invalid checklist data" };
  }

  let checklistRows: unknown[] = [];
  try {
    const raw = formData.get("checklistRows");
    if (raw) checklistRows = JSON.parse(String(raw)) as unknown[];
  } catch {
    return { ok: false as const, error: "Invalid checklist row data" };
  }

  const parsed = qcUtilSubmitSchema.safeParse({
    productType: formData.get("productType"),
    lotNumber: formData.get("lotNumber"),
    inspectorNotes: formData.get("inspectorNotes") ?? "",
    checklist,
    checklistRows,
  });
  if (!parsed.success) return { ok: false as const, error: "Invalid form data" };

  if (parsed.data.productType === ProductType.IPS) {
    return { ok: false as const, error: "IPS is no longer supported for new submissions." };
  }

  const checks = parsed.data.checklist ?? {};
  const checkboxKeys = getExpectedChecklistKeys(parsed.data.productType);

  if (checkboxKeys.length === 0) {
    return { ok: false as const, error: "Checklist is not configured for this product type." };
  }
  const allPass = checkboxKeys.every((k) => checks[k] === true);
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
    lotNumber: parsed.data.lotNumber,
    inspectorNotes: parsed.data.inspectorNotes ?? "",
    checklist: checks,
    checklistRows: parsed.data.checklistRows ?? [],
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
