"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { getAllProductsAction, searchProductsAction } from "@/actions/admin";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type ProductRow = {
  id: string;
  productUid: string;
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  status: string;
  createdAt: Date;
};

export function AdminSearch() {
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [pending, startTransition] = useTransition();

  const loadAll = useCallback(() => {
    startTransition(async () => {
      const res = await getAllProductsAction();
      if (res.ok) setProducts(res.products as ProductRow[]);
      else setProducts([]);
    });
  }, []);

  const runSearch = useCallback((query: string) => {
    startTransition(async () => {
      const res = await searchProductsAction(query);
      if (res.ok) setProducts(res.products as ProductRow[]);
      else setProducts([]);
    });
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = q.trim();
      if (trimmed.length === 0) loadAll();
      else runSearch(trimmed);
    }, 300);
    return () => clearTimeout(t);
  }, [q, runSearch, loadAll]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Filter by UID, serial, or name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search products"
        />
      </div>

      {pending && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      {!pending && products && products.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {q.trim().length > 0 ? "No products match your search." : "No products have been created yet."}
        </p>
      )}

      {!pending && products && products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/admin/product/${encodeURIComponent(p.productUid)}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-mono text-base">{p.productUid}</CardTitle>
                    <Badge variant={p.status === "QC_COMPLETE" ? "default" : "secondary"}>{p.status}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{p.name}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <p>
                    {p.make} · {p.model}
                  </p>
                  <p className="font-mono">SN: {p.serialNumber}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
