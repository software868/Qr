import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PublicQcUtilEntryPage({ params }: { params: Promise<{ entryUid: string }> }) {
  const { entryUid } = await params;
  const entry = await prisma.qcUtilEntry.findUnique({
    where: { entryUid: decodeURIComponent(entryUid) },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!entry) notFound();

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-xl">{entry.entryUid}</CardTitle>
          <CardDescription>Check form entry (read-only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Product type</p>
            <p>{String(entry.productType).replaceAll("_", " ")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Recorded</p>
            <p>{entry.createdAt.toLocaleString()}</p>
          </div>
          {(entry.images?.length ?? 0) > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {(entry.images ?? []).map((img) => (
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
