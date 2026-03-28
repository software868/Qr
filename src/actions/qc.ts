"use server";

import { z } from "zod";
import { ProductType } from "@prisma/client";
import { auth } from "@/auth";
import { getBomForType, findProductByUid, completeQc } from "@/services/qc.service";
import { logAudit } from "@/services/audit.service";

export async function getBomTemplateAction(productType: ProductType) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  if (session.user.role !== "QC_USER" && session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }
  const bom = await getBomForType(productType);
  return { ok: true as const, bom };
}

const lookupSchema = z.object({ productUid: z.string().trim().min(3).max(64) });

export async function lookupProductForQcAction(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  if (session.user.role !== "QC_USER" && session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }

  const parsed = lookupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid UID" };

  const product = await findProductByUid(parsed.data.productUid);
  if (!product) return { ok: false as const, error: "Product not found" };
  if (product.qcRecord) return { ok: false as const, error: "QC already completed for this product" };

  return {
    ok: true as const,
    product: {
      id: product.id,
      productUid: product.productUid,
      name: product.name,
      make: product.make,
      model: product.model,
      serialNumber: product.serialNumber,
      quantity: product.quantity,
      date: product.date.toISOString(),
    },
  };
}

const qcFormSchema = z.object({
  productId: z.string().min(1),
  productType: z.nativeEnum(ProductType),
  scannedItemUids: z.array(z.string().trim().min(1).max(128)).min(1),
  inspectorNotes: z.string().trim().max(5000).optional(),
  passStatus: z.enum(["pass", "fail", "conditional"]),
});

export async function submitQcFormAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  if (session.user.role !== "QC_USER" && session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }

  const scannedRaw = formData.get("scannedItemUids");
  let scannedItemUids: string[] = [];
  try {
    scannedItemUids = JSON.parse(String(scannedRaw ?? "[]")) as string[];
  } catch {
    return { ok: false as const, error: "Invalid scanned items" };
  }

  const parsed = qcFormSchema.safeParse({
    productId: formData.get("productId"),
    productType: formData.get("productType"),
    scannedItemUids,
    inspectorNotes: formData.get("inspectorNotes") ?? "",
    passStatus: formData.get("passStatus"),
  });
  if (!parsed.success) return { ok: false as const, error: "Invalid QC data" };

  const files = formData.getAll("images") as File[];
  const buffers: { buffer: Buffer; mimeType: string }[] = [];
  for (const f of files) {
    if (f.size === 0) continue;
    if (!f.type.startsWith("image/")) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    buffers.push({ buffer: buf, mimeType: f.type || "image/jpeg" });
  }

  try {
    const result = await completeQc({
      productId: parsed.data.productId,
      productType: parsed.data.productType,
      scannedItemUids: parsed.data.scannedItemUids,
      formData: {
        passStatus: parsed.data.passStatus,
        inspectorNotes: parsed.data.inspectorNotes ?? "",
      },
      performedById: session.user.id,
      images: buffers,
    });

    await logAudit(session.user.id, "QC_COMPLETE", "QcRecord", result.qcRecordId, {
      finalProductUid: result.finalProductUid,
    });

    return {
      ok: true as const,
      finalProductUid: result.finalProductUid,
      finalQrDataUrl: result.finalQrDataUrl,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "QC failed";
    return { ok: false as const, error: msg };
  }
}
