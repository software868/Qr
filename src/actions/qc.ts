"use server";

import { z } from "zod";
import { ProductType } from "@prisma/client";
import { auth } from "@/auth";
import { getBomForType, findProductByUid, completeQc } from "@/services/qc.service";
import { logAudit } from "@/services/audit.service";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

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

  const alreadyScannedCount = product.qcRecord?.scannedItemUids?.length ?? 0;
  const remainingQuantity = Math.max(0, product.quantity - alreadyScannedCount);
  if (remainingQuantity <= 0) {
    return { ok: false as const, error: "QC completed for all items of this product" };
  }

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
      remainingQuantity,
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
  bomChecks: z.record(z.string(), z.boolean()).optional(),
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
    bomChecks: formData.get("bomChecks") ? (JSON.parse(String(formData.get("bomChecks"))) as Record<string, boolean>) : undefined,
  });
  if (!parsed.success) return { ok: false as const, error: "Invalid QC data" };

  const bomChecks = (parsed.data.bomChecks ?? {}) as Record<string, boolean>;

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
        bomChecks,
      } as Prisma.InputJsonValue,
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

const createQcProductSchema = z.object({
  productType: z.nativeEnum(ProductType),
  scannedItemUids: z.array(z.string().trim().min(1).max(128)).min(1),
  combinedUid: z.string().trim().min(3).max(64),
});

export async function createQcProductAction(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  if (session.user.role !== "QC_USER" && session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }

  const parsed = createQcProductSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Ensure UID is unique (rare collision). If taken, suffix with -1..-5.
  let productUid = parsed.data.combinedUid;
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.product.findUnique({ where: { productUid } });
    if (!exists) break;
    productUid = `${parsed.data.combinedUid}-${i + 1}`;
  }

  const product = await prisma.product.create({
    data: {
      productUid,
      name: `QC ${String(parsed.data.productType).replaceAll("_", " ")}`,
      make: String(parsed.data.productType).replaceAll("_", " "),
      model: String(parsed.data.productType).replaceAll("_", " "),
      serialNumber: productUid,
      quantity: parsed.data.scannedItemUids.length,
      date: today,
      createdById: session.user.id,
      status: "CREATED",
    },
  });

  await logAudit(session.user.id, "PRODUCT_CREATE", "Product", product.id, {
    productUid: product.productUid,
    source: "QC",
  });

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

const deleteQcProductSchema = z.object({
  productId: z.string().min(1),
});

export async function deleteQcProductAction(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  if (session.user.role !== "QC_USER" && session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden" };
  }
  const parsed = deleteQcProductSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid data" };

  // Best-effort cleanup; ignore if already removed.
  try {
    await prisma.product.delete({ where: { id: parsed.data.productId } });
  } catch {
    /* ignore */
  }
  return { ok: true as const };
}
