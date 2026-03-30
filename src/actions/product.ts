"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createProductWithUid, qrDataUrlForPayload } from "@/services/product.service";
import { logAudit } from "@/services/audit.service";

const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  make: z.string().trim().min(1).max(120),
  model: z.string().trim().min(1).max(120),
  serialNumber: z.string().trim().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(1_000_000),
});

export async function createProductAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Unauthorized." };
  }
  if (session.user.role !== "QR_USER" && session.user.role !== "ADMIN") {
    return { ok: false as const, error: "Forbidden." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    make: formData.get("make"),
    model: formData.get("model"),
    serialNumber: formData.get("serialNumber"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Please check all fields." };
  }

  const d = parsed.data;
  // Always store today's date (no user edit).
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nameInput = d.name.trim();
  const nameKey = nameInput.toLowerCase();

  // Enforce unique name per user (case-insensitive) by updating the existing record instead
  // of creating a new one. UID is regenerated every time.
  // Global upsert by normalized name:
  // If any user created a product with this name, we update that same row (new UID + new QR).
  const existing = await prisma.product.findFirst({
    where: {
      name: { equals: nameInput, mode: "insensitive" },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (!existing) {
    const result = await createProductWithUid({
      ...d,
      createdById: session.user.id,
      date: today,
    });

    await logAudit(session.user.id, "PRODUCT_CREATE", "Product", result.product.id, {
      productUid: result.product.productUid,
      nameKey,
    });

    return {
      ok: true as const,
      productUid: result.product.productUid,
      qrDataUrl: result.qrDataUrl,
      product: {
        name: d.name,
        make: d.make,
        model: d.model,
        serialNumber: d.serialNumber,
        quantity: d.quantity,
      },
    };
  }

  // Update existing record and regenerate UID/QR
  const result = await createProductWithUid({
    ...d,
    createdById: session.user.id,
    // Update instead of create to avoid duplicates by name.
    productIdToUpdate: existing.id,
    date: today,
  });

  await logAudit(session.user.id, "PRODUCT_UPDATE", "Product", existing.id, {
    productUid: result.product.productUid,
    nameKey,
  });

  return {
    ok: true as const,
    productUid: result.product.productUid,
    qrDataUrl: result.qrDataUrl,
    product: {
      name: d.name,
      make: d.make,
      model: d.model,
      serialNumber: d.serialNumber,
      quantity: d.quantity,
    },
  };
}

export type ProductWithQr = {
  productUid: string;
  qrDataUrl: string;
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  quantity: number;
};

export async function getMyProductsAction(): Promise<ProductWithQr[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  if (session.user.role !== "QR_USER" && session.user.role !== "ADMIN") return [];

  const products = await prisma.product.findMany({
    // Visible to all QR users (not only the creator).
    // Prefer `updatedAt` so repeated submissions of the same name float to the top.
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      productUid: true,
      name: true,
      make: true,
      model: true,
      serialNumber: true,
      quantity: true,
      qcRecord: {
        select: {
          scannedItemUids: true,
        },
      },
    },
  });

  const results: ProductWithQr[] = [];
  for (const p of products) {
    const qrDataUrl = await qrDataUrlForPayload(p.productUid);
    const scannedCount = p.qcRecord?.scannedItemUids?.length ?? 0;
    const remainingQuantity = Math.max(0, p.quantity - scannedCount);
    results.push({
      productUid: p.productUid,
      qrDataUrl,
      name: p.name,
      make: p.make,
      model: p.model,
      serialNumber: p.serialNumber,
      quantity: remainingQuantity,
    });
  }
  return results;
}
