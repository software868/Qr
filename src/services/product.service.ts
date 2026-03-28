import { customAlphabet } from "nanoid";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

const uidAlphabet = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 14);

export function generateProductUid(): string {
  return `PRD-${uidAlphabet()}`;
}

export function generateFinalProductUid(): string {
  return `FIN-${uidAlphabet()}`;
}

export async function qrDataUrlForPayload(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

export async function createProductWithUid(data: {
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  quantity: number;
  date: Date;
  createdById: string;
}): Promise<{ product: { id: string; productUid: string }; qrDataUrl: string }> {
  let productUid = generateProductUid();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.product.findUnique({ where: { productUid } });
    if (!exists) break;
    productUid = generateProductUid();
  }

  const product = await prisma.product.create({
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
