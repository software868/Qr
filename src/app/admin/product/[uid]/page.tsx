import { notFound } from "next/navigation";
import { getProductDetailAction } from "@/actions/admin";
import {
  AdminProductDetail,
  type AdminProductDetailPayload,
} from "@/components/admin/admin-product-detail";

function safeToIso(d: Date): string {
  const t = d.getTime();
  if (Number.isNaN(t)) return new Date(0).toISOString();
  return d.toISOString();
}

export default async function AdminProductPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const res = await getProductDetailAction(decodeURIComponent(uid));
  if (!res.ok || !("product" in res)) {
    notFound();
  }

  const { product, bom } = res;
  const qc = product.qcRecord;
  const rawForm = qc?.formData;
  const formData =
    rawForm && typeof rawForm === "object" && !Array.isArray(rawForm)
      ? (rawForm as { passStatus?: string; inspectorNotes?: string })
      : null;

  const payload: AdminProductDetailPayload = {
    productUid: product.productUid,
    name: product.name,
    make: product.make,
    model: product.model,
    serialNumber: product.serialNumber,
    quantity: product.quantity,
    status: product.status,
    createdAtIso: safeToIso(product.createdAt),
    dateIso: safeToIso(product.date),
    createdBy: product.createdBy,
    qcRecord: qc
      ? {
          finalProductUid: qc.finalProductUid,
          productType: qc.productType,
          createdAtIso: safeToIso(qc.createdAt),
          scannedItemUids: Array.isArray(qc.scannedItemUids) ? qc.scannedItemUids : [],
          formData,
          performedBy: qc.performedBy
            ? { name: qc.performedBy.name, email: qc.performedBy.email }
            : { name: "Unknown", email: "—" },
          images: (qc.images ?? []).map((img) => ({ id: img.id, url: img.url })),
        }
      : null,
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

  return <AdminProductDetail data={payload} />;
}
