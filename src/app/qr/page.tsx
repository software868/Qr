import { getMyProductsAction } from "@/actions/product";
import { ProductQrForm } from "@/components/qr/product-qr-form";

export const dynamic = "force-dynamic";

export default async function QrPage() {
  const initialProducts = await getMyProductsAction();
  return <ProductQrForm initialProducts={initialProducts} />;
}
