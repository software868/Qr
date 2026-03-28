"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Search, Table2 } from "lucide-react";
import { getAllProductsAction, searchProductsAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const VIEW_STORAGE_KEY = "admin-products-view";

type ViewMode = "table" | "cards";

type ProductRow = {
  id: string;
  productUid: string;
  name: string;
  make: string;
  model: string;
  serialNumber: string;
  status: string;
  createdAt: Date;
  qcRecord: {
    performedBy: { name: string; email: string };
  } | null;
};

function submittedByLabel(p: ProductRow): string {
  if (p.status === "QC_COMPLETE" && p.qcRecord?.performedBy) {
    return `${p.qcRecord.performedBy.name} (${p.qcRecord.performedBy.email})`;
  }
  return "—";
}

export function AdminSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode | null;
      if (saved === "table" || saved === "cards") setViewMode(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setView = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

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

  const goToProduct = useCallback(
    (productUid: string) => {
      router.push(`/admin/product/${encodeURIComponent(productUid)}`);
    },
    [router],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative max-w-xl flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filter by UID, serial, or name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search products"
          />
        </div>
        <div
          className="flex shrink-0 rounded-lg border bg-muted/40 p-1"
          role="group"
          aria-label="Product list view"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5 rounded-md px-3",
              viewMode === "table" && "bg-background shadow-sm",
            )}
            onClick={() => setView("table")}
            aria-pressed={viewMode === "table"}
          >
            <Table2 className="h-4 w-4" aria-hidden />
            Table
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5 rounded-md px-3",
              viewMode === "cards" && "bg-background shadow-sm",
            )}
            onClick={() => setView("cards")}
            aria-pressed={viewMode === "cards"}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            Cards
          </Button>
        </div>
      </div>

      {pending && viewMode === "table" && (
        <div className="space-y-2 rounded-md border p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {pending && viewMode === "cards" && (
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

      {!pending && products && products.length > 0 && viewMode === "table" && (
        <>
          {/* Mobile: compact stacked rows */}
          <div className="space-y-2 sm:hidden">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => goToProduct(p.productUid)}
                className="w-full rounded-lg border bg-card p-3 text-left text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-medium break-all">{p.productUid}</span>
                  <Badge variant={p.status === "QC_COMPLETE" ? "default" : "secondary"} className="shrink-0">
                    {p.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Submitted by: </span>
                  <span className="break-words">{submittedByLabel(p)}</span>
                </p>
                <p className="mt-1 text-xs text-primary">Tap for full details →</p>
              </button>
            ))}
          </div>

          {/* sm+: data table with horizontal scroll on narrow widths */}
          <div className="hidden sm:block overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Product UID</TableHead>
                  <TableHead className="whitespace-nowrap">QC status</TableHead>
                  <TableHead className="min-w-[180px]">Submitted by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/50"
                    tabIndex={0}
                    role="link"
                    onClick={() => goToProduct(p.productUid)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToProduct(p.productUid);
                      }
                    }}
                  >
                    <TableCell className="font-mono text-xs align-top">{p.productUid}</TableCell>
                    <TableCell className="align-top">
                      <Badge variant={p.status === "QC_COMPLETE" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] text-sm text-muted-foreground align-top break-words">
                      {submittedByLabel(p)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!pending && products && products.length > 0 && viewMode === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/admin/product/${encodeURIComponent(p.productUid)}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-mono text-base break-all">{p.productUid}</CardTitle>
                    <Badge variant={p.status === "QC_COMPLETE" ? "default" : "secondary"} className="shrink-0">
                      {p.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{p.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    {p.make} · {p.model}
                  </p>
                  <p className="font-mono">SN: {p.serialNumber}</p>
                  {p.status === "QC_COMPLETE" && p.qcRecord?.performedBy && (
                    <p className="pt-1 text-foreground">
                      <span className="text-muted-foreground">QC by </span>
                      <span className="font-medium">{p.qcRecord.performedBy.name}</span>
                      <span className="text-muted-foreground"> ({p.qcRecord.performedBy.email})</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
