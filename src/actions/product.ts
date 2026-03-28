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
  date: z.coerce.date(),
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
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Please check all fields." };
  }

  const d = parsed.data;
  const result = await createProductWithUid({
    ...d,
    createdById: session.user.id,
  });

  await logAudit(session.user.id, "PRODUCT_CREATE", "Product", result.product.id, { productUid: result.product.productUid });

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
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      productUid: true,
      name: true,
      make: true,
      model: true,
      serialNumber: true,
      quantity: true,
    },
  });

  const results: ProductWithQr[] = [];
  for (const p of products) {
    const qrDataUrl = await qrDataUrlForPayload(p.productUid);
    results.push({
      productUid: p.productUid,
      qrDataUrl,
      name: p.name,
      make: p.make,
      model: p.model,
      serialNumber: p.serialNumber,
      quantity: p.quantity,
    });
  }
  return results;
}
