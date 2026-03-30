"use server";

import { NextResponse } from "next/server";
import { ProductType } from "@prisma/client";
import { auth } from "@/auth";
import { getBomForType } from "@/services/qc.service";

type Field =
  | { key: string; type: "checkbox"; label: string; required?: boolean }
  | { key: string; type: "textarea"; label: string; required?: boolean };

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false as const, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "QC_USER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false as const, error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const productTypeRaw = url.searchParams.get("productType") ?? "";
  const productType = ProductType[productTypeRaw as keyof typeof ProductType];
  if (!productType) {
    return NextResponse.json({ ok: false as const, error: "Invalid productType" }, { status: 400 });
  }

  const bom = await getBomForType(productType);
  const lines = bom?.lines ?? [];

  const fields: Field[] = [
    ...lines.map((l) => ({
      key: `bomOk:${l.id}`,
      type: "checkbox" as const,
      label: `${l.partCode} — ${l.description} (qty ${l.expectedQty})`,
      required: true,
    })),
    { key: "inspectorNotes", type: "textarea" as const, label: "Inspector notes", required: false },
  ];

  return NextResponse.json({
    ok: true as const,
    productType,
    fields,
    allowImages: true,
  });
}

