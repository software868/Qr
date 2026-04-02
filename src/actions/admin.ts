"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getBomForType } from "@/services/qc.service";

const entryListSelect = {
  id: true,
  entryUid: true,
  productType: true,
  createdAt: true,
  performedBy: { select: { name: true, email: true } },
} as const;

export async function getAllQcUtilEntriesAction() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const entries = await prisma.qcUtilEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: entryListSelect,
  });

  return { ok: true as const, entries };
}

export async function searchQcUtilEntriesAction(query: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const q = query.trim();
  if (q.length === 0) {
    return getAllQcUtilEntriesAction();
  }

  const entries = await prisma.qcUtilEntry.findMany({
    where: {
      OR: [{ entryUid: { contains: q, mode: "insensitive" } }],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: entryListSelect,
  });

  return { ok: true as const, entries };
}

export async function getQcUtilEntryDetailAction(entryUid: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const decoded = decodeURIComponent(entryUid);
  const entry = await prisma.qcUtilEntry.findUnique({
    where: { entryUid: decoded },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      performedBy: { select: { name: true, email: true } },
    },
  });

  if (!entry) {
    return { ok: false as const, error: "Not found" };
  }

  let bom = null;
  try {
    bom = await getBomForType(entry.productType);
  } catch {
    /* ignore */
  }

  return { ok: true as const, entry, bom };
}

export async function exportQcUtilEntriesCsvAction() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false as const, error: "Unauthorized" };
  }

  const entries = await prisma.qcUtilEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      performedBy: { select: { email: true, name: true } },
    },
  });

  const header = ["entryUid", "productType", "submittedByName", "submittedByEmail", "createdAt", "formJson"].join(
    ",",
  );

  const rows = entries.map((e) =>
    [
      e.entryUid,
      e.productType,
      escapeCsv(e.performedBy.name),
      escapeCsv(e.performedBy.email),
      e.createdAt.toISOString(),
      escapeCsv(JSON.stringify(e.formData)),
    ].join(","),
  );

  return { ok: true as const, csv: [header, ...rows].join("\n") };
}

function escapeCsv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
