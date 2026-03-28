import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PublicFinalProductPage({ params }: { params: Promise<{ finalUid: string }> }) {
  const { finalUid } = await params;
  const qc = await prisma.qcRecord.findUnique({
    where: { finalProductUid: decodeURIComponent(finalUid) },
    include: {
      product: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!qc) notFound();

  return (
    <div className="container mx-auto max-w-lg py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-xl">{qc.finalProductUid}</CardTitle>
          <CardDescription>Final QC trace (read-only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Manufacturing UID</p>
            <p className="font-mono">{qc.product.productUid}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Product</p>
            <p>
              {qc.product.name} — {qc.product.make} {qc.product.model}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">QC type</p>
            <p>{qc.productType.replaceAll("_", " ")}</p>
          </div>
          {(qc.images?.length ?? 0) > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {(qc.images ?? []).map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-32 w-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
