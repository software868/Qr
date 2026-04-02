import { notFound } from "next/navigation";
import { getQcUtilEntryDetailAction } from "@/actions/admin";
import {
  AdminQcUtilDetail,
  type AdminQcUtilDetailPayload,
} from "@/components/admin/admin-qc-util-detail";

function safeToIso(d: Date): string {
  const t = d.getTime();
  if (Number.isNaN(t)) return new Date(0).toISOString();
  return d.toISOString();
}

export default async function AdminQcUtilEntryPage({
  params,
}: {
  params: Promise<{ entryUid: string }>;
}) {
  const { entryUid } = await params;
  const res = await getQcUtilEntryDetailAction(decodeURIComponent(entryUid));
  if (!res.ok || !("entry" in res)) {
    notFound();
  }

  const { entry, bom } = res;
  const rawForm = entry.formData;
  const formData =
    rawForm && typeof rawForm === "object" && !Array.isArray(rawForm)
      ? (rawForm as {
          passStatus?: string;
          inspectorNotes?: string;
          bomChecks?: Record<string, boolean>;
        })
      : null;

  const payload: AdminQcUtilDetailPayload = {
    entryUid: entry.entryUid,
    productType: entry.productType,
    createdAtIso: safeToIso(entry.createdAt),
    performedBy: entry.performedBy,
    formData,
    images: (entry.images ?? []).map((img) => ({ id: img.id, url: img.url })),
    bom: bom
      ? {
          lines: (bom.lines ?? []).map((line) => ({
            id: line.id,
            partCode: line.partCode,
            description: line.description,
            expectedQty: line.expectedQty,
          })),
        }
      : null,
  };

  return <AdminQcUtilDetail data={payload} />;
}
