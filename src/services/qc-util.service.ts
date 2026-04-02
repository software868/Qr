import type { Prisma, ProductType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateQcUtilEntryUid, qrDataUrlForPayload } from "@/services/product.service";
import { uploadQcImageBuffer } from "@/services/cloudinary.service";

export async function createQcUtilSubmission(input: {
  productType: ProductType;
  formData: Prisma.InputJsonValue;
  performedById: string;
  images: { buffer: Buffer; mimeType: string }[];
}) {
  let entryUid = generateQcUtilEntryUid();
  for (let i = 0; i < 5; i++) {
    const taken = await prisma.qcUtilEntry.findUnique({ where: { entryUid } });
    if (!taken) break;
    entryUid = generateQcUtilEntryUid();
  }

  const uploaded: { url: string; publicId: string }[] = [];
  for (const img of input.images) {
    uploaded.push(await uploadQcImageBuffer(img.buffer, img.mimeType));
  }

  const entry = await prisma.qcUtilEntry.create({
    data: {
      entryUid,
      productType: input.productType,
      formData: input.formData,
      performedById: input.performedById,
    },
  });

  let order = 0;
  for (const u of uploaded) {
    await prisma.qcUtilImage.create({
      data: {
        qcUtilEntryId: entry.id,
        url: u.url,
        publicId: u.publicId,
        sortOrder: order++,
      },
    });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const payload = base ? `${base}/q/${entry.entryUid}` : entry.entryUid;
  const qrDataUrl = await qrDataUrlForPayload(payload);

  return { entryId: entry.id, entryUid: entry.entryUid, qrDataUrl };
}
