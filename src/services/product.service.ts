import { customAlphabet } from "nanoid";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

// Shorter, prefix-free Product UID (used inside the QR payload too).
const uidAlphabet = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 10);

export function generateProductUid(): string {
  return uidAlphabet();
}

export function generateFinalProductUid(): string {
  return `FIN-${uidAlphabet()}`;
}

/** Unique ID for check form entries (encoded in label QR). */
export function generateQcUtilEntryUid(): string {
  return `QUT-${uidAlphabet()}`;
}

export async function qrDataUrlForPayload(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

export async function createProductWithUid(data: {
  productIdToUpdate?: string;
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  quantity: number;
  date: Date;
  createdById: string;
}): Promise<{
  product: {
    id: string;
    productUid: string;
    name: string;
    make: string;
    model: string;
    serialNumber: string;
    quantity: number;
  };
  qrDataUrl: string;
}> {
  const getUniqueProductUid = async () => {
    let productUid = generateProductUid();
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.product.findUnique({ where: { productUid } });
      if (!exists) break;
      productUid = generateProductUid();
    }
    return productUid;
  };

  const productUid = await getUniqueProductUid();

  const product = data.productIdToUpdate
    ? await prisma.product.update({
        where: { id: data.productIdToUpdate },
        data: {
          productUid,
          name: data.name,
          make: data.make,
          model: data.model,
          serialNumber: data.serialNumber,
          quantity: data.quantity,
          date: data.date,
          // Update creator to the user who submitted the newest details.
          createdById: data.createdById,
        },
      })
    : await prisma.product.create({
        data: {
          productUid,
          name: data.name,
          make: data.make,
          model: data.model,
          serialNumber: data.serialNumber,
          quantity: data.quantity,
          date: data.date,
          createdById: data.createdById,
        },
      });

  const qrDataUrl = await qrDataUrlForPayload(product.productUid);

  return {
    product: {
      id: product.id,
      productUid: product.productUid,
      name: data.name,
      make: data.make,
      model: data.model,
      serialNumber: data.serialNumber,
      quantity: data.quantity,
    },
    qrDataUrl,
  };
}
