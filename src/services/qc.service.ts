import type { Prisma, ProductType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateFinalProductUid, qrDataUrlForPayload } from "@/services/product.service";
import { uploadQcImageBuffer } from "@/services/cloudinary.service";

export async function findProductByUid(productUid: string) {
  return prisma.product.findUnique({
    where: { productUid },
    include: { qcRecord: true },
  });
}

/** Sequential writes (no Prisma transaction) so standalone MongoDB without replica set works. */
export async function completeQc(input: {
  productId: string;
  productType: ProductType;
  scannedItemUids: string[];
  formData: Prisma.InputJsonValue;
  performedById: string;
  images: { buffer: Buffer; mimeType: string }[];
}) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: { qcRecord: true },
  });
  if (!product) throw new Error("Product not found");

  const existingQc = product.qcRecord;
  const alreadyScannedCount = existingQc?.scannedItemUids?.length ?? 0;
  const remainingQuantity = Math.max(0, product.quantity - alreadyScannedCount);
  if (remainingQuantity <= 0) {
    throw new Error("No remaining quantity to QC for this product");
  }
  if (input.scannedItemUids.length > remainingQuantity) {
    throw new Error(`You can QC up to ${remainingQuantity} more item(s) for this product`);
  }

  let finalUid = generateFinalProductUid();
  for (let i = 0; i < 5; i++) {
    const taken = await prisma.qcRecord.findUnique({ where: { finalProductUid: finalUid } });
    if (!taken) break;
    finalUid = generateFinalProductUid();
  }

  const uploaded: { url: string; publicId: string }[] = [];
  for (const img of input.images) {
    uploaded.push(await uploadQcImageBuffer(img.buffer, img.mimeType));
  }

  const newScannedItemUids = [
    ...(existingQc?.scannedItemUids ?? []),
    ...input.scannedItemUids,
  ];

  const record = existingQc
    ? await prisma.qcRecord.update({
        where: { id: existingQc.id },
        data: {
          // Append new items for incremental QC.
          scannedItemUids: newScannedItemUids,
          formData: input.formData,
          finalProductUid: finalUid,
          performedById: input.performedById,
          productType: input.productType,
        },
      })
    : await prisma.qcRecord.create({
        data: {
          productId: input.productId,
          productType: input.productType,
          scannedItemUids: input.scannedItemUids,
          formData: input.formData,
          finalProductUid: finalUid,
          performedById: input.performedById,
        },
      });

  // Append new uploaded images to existing record.
  const existingImageCount = await prisma.qcImage.count({ where: { qcRecordId: record.id } });
  let order = existingImageCount;
  for (const u of uploaded) {
    await prisma.qcImage.create({
      data: {
        qcRecordId: record.id,
        url: u.url,
        publicId: u.publicId,
        sortOrder: order++,
      },
    });
  }

  const newAlreadyScannedCount = newScannedItemUids.length;
  const newRemaining = Math.max(0, product.quantity - newAlreadyScannedCount);

  await prisma.product.update({
    where: { id: input.productId },
    data: { status: newRemaining === 0 ? "QC_COMPLETE" : "CREATED" },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const payload = base ? `${base}/f/${record.finalProductUid}` : record.finalProductUid;
  const finalQrDataUrl = await qrDataUrlForPayload(payload);

  return {
    qcRecordId: record.id,
    finalProductUid: record.finalProductUid,
    finalQrDataUrl,
  };
}
