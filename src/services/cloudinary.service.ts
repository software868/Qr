import { v2 as cloudinary } from "cloudinary";

function ensureConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_* environment variables.");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

export async function uploadQcImageBuffer(buffer: Buffer, mimeType: string): Promise<{ url: string; publicId: string }> {
  ensureConfigured();
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "product-qc",
    resource_type: "image",
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteCloudinaryAsset(publicId: string) {
  try {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // ignore
  }
}
