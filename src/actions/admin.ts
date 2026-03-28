"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getBomForType } from "@/services/qc.service";

const productSelect = {
  id: true,
  productUid: true,
  name: true,
  make: true,
  model: true,
  serialNumber: true,
  status: true,
  createdAt: true,
  qcRecord: {
    select: {
      performedBy: {
        select: { name: true, email: true },
      },
    },
  },
} as const;

export async function getAllProductsAction() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: productSelect,
  });

  return { ok: true as const, products };
}

export async function searchProductsAction(query: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const q = query.trim();
  if (q.length === 0) {
    return getAllProductsAction();
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { productUid: { contains: q, mode: "insensitive" } },
        { serialNumber: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: productSelect,
  });

  return { ok: true as const, products };
}

export async function getProductDetailAction(uid: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Unauthorized" };
  }

  // MongoDB `id` is ObjectId; PRD-… UIDs are not valid hex — never pass them as `id` or Prisma throws.
  const where = /^[a-f\d]{24}$/i.test(uid)
    ? { OR: [{ productUid: uid }, { id: uid }] as const }
    : { productUid: uid };

  const product = await prisma.product.findFirst({
    where,
    include: {
      createdBy: { select: { name: true, email: true } },
      qcRecord: {
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          performedBy: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!product) {
    return { ok: false as const, error: "Not found" };
  }

  const bom = product.qcRecord ? await getBomForType(product.qcRecord.productType) : null;

  return { ok: true as const, product, bom };
}

export async function exportProductsCsvAction() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      qcRecord: {
        select: { finalProductUid: true, productType: true },
      },
    },
  });

  const header = [
    "productUid",
    "name",
    "make",
    "model",
    "serialNumber",
    "quantity",
    "status",
    "finalProductUid",
    "qcType",
    "createdAt",
  ].join(",");

  const rows = products.map((p) =>
    [
      p.productUid,
      escapeCsv(p.name),
      escapeCsv(p.make),
      escapeCsv(p.model),
      escapeCsv(p.serialNumber),
      p.quantity,
      p.status,
      p.qcRecord?.finalProductUid ?? "",
      p.qcRecord?.productType ?? "",
      p.createdAt.toISOString(),
    ].join(","),
  );

  return { ok: true as const, csv: [header, ...rows].join("\n") };
}

function escapeCsv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
