import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PublicProductPage({ params }: { params: Promise<{ productUid: string }> }) {
  const { productUid } = await params;
  const product = await prisma.product.findUnique({
    where: { productUid: decodeURIComponent(productUid) },
  });
  if (!product) notFound();

  const dateLabel = Number.isNaN(product.date.getTime())
    ? "—"
    : product.date.toLocaleDateString();

  return (
    <div className="container mx-auto max-w-lg py-12 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-mono text-xl">{product.productUid}</CardTitle>
            <Badge variant={product.status === "QC_COMPLETE" ? "default" : "secondary"}>{product.status}</Badge>
          </div>
          <CardDescription>Manufacturing record (read-only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Name" value={product.name} />
          <Row label="Make / Model" value={`${product.make} ${product.model}`} />
          <Row label="Serial" value={product.serialNumber} />
          <Row label="Quantity" value={String(product.quantity)} />
          <Row label="Date" value={dateLabel} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
