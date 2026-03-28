import { getMyProductsAction } from "@/actions/product";
import { ProductQrForm } from "@/components/qr/product-qr-form";

export default async function QrPage() {
  const initialProducts = await getMyProductsAction();
  return <ProductQrForm initialProducts={initialProducts} />;
}
