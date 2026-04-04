import { notFound } from "next/navigation";
import { getQcUtilEntryDetailAction } from "@/actions/admin";
import {
  AdminQcUtilEntryView,
  type AdminQcUtilEntryViewData,
} from "@/components/admin/admin-qc-util-entry-view";

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

  const { entry } = res;
  const rawForm = entry.formData;
  const formData =
    rawForm && typeof rawForm === "object" && !Array.isArray(rawForm)
      ? (rawForm as {
          passStatus?: string;
          inspectorNotes?: string;
          checklist?: Record<string, boolean>;
          bomChecks?: Record<string, boolean>;
        })
      : null;

  const payload: AdminQcUtilEntryViewData = {
    entryUid: entry.entryUid,
    productType: entry.productType,
    createdAtIso: safeToIso(entry.createdAt),
    performedBy: entry.performedBy,
    formData,
    images: (entry.images ?? []).map((img) => ({ id: img.id, url: img.url })),
  };

  return <AdminQcUtilEntryView data={payload} />;
}
