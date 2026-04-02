"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Search, Table2 } from "lucide-react";
import { getAllQcUtilEntriesAction, searchQcUtilEntriesAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const VIEW_STORAGE_KEY = "admin-qc-util-view";

type ViewMode = "table" | "cards";

type EntryRow = {
  id: string;
  entryUid: string;
  productType: string;
  createdAt: Date;
  performedBy: { name: string; email: string };
};

function typeLabel(t: string) {
  return t.replaceAll("_", " ");
}

function submittedByLabel(e: EntryRow): string {
  return `${e.performedBy.name} (${e.performedBy.email})`;
}

function formatWhen(d: Date) {
  return new Date(d).toLocaleString();
}

export function AdminQcUtilSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState<EntryRow[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode | null;
      if (saved === "table" || saved === "cards") {
        setTimeout(() => setViewMode(saved), 0);
      }
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
      const res = await getAllQcUtilEntriesAction();
      if (res.ok) setEntries(res.entries as EntryRow[]);
      else setEntries([]);
    });
  }, []);

  const runSearch = useCallback((query: string) => {
    startTransition(async () => {
      const res = await searchQcUtilEntriesAction(query);
      if (res.ok) setEntries(res.entries as EntryRow[]);
      else setEntries([]);
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

  const goToEntry = useCallback(
    (entryUid: string) => {
      router.push(`/admin/entry/${encodeURIComponent(entryUid)}`);
    },
    [router],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative max-w-xl min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filter by entry UID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search entries"
          />
        </div>
        <div
          className="flex shrink-0 rounded-lg border bg-muted/40 p-1"
          role="group"
          aria-label="Entry list view"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("gap-1.5 rounded-md px-3", viewMode === "table" && "bg-background shadow-sm")}
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
            className={cn("gap-1.5 rounded-md px-3", viewMode === "cards" && "bg-background shadow-sm")}
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

      {!pending && entries && entries.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {q.trim().length > 0 ? "No entries match your search." : "No Q-Util submissions yet."}
        </p>
      )}

      {!pending && entries && entries.length > 0 && viewMode === "table" && (
        <>
          <div className="space-y-2 sm:hidden">
            {entries.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => goToEntry(e.entryUid)}
                className="w-full rounded-lg border bg-card p-3 text-left text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-mono text-xs font-medium break-all">{e.entryUid}</span>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Type: </span>
                  {typeLabel(e.productType)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Submitted: </span>
                  {formatWhen(e.createdAt)}
                </p>
                <p className="mt-1 text-xs break-words">
                  <span className="text-muted-foreground">By: </span>
                  {submittedByLabel(e)}
                </p>
                <p className="mt-1 text-xs text-primary">Tap for full details →</p>
              </button>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-md border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Entry UID</TableHead>
                  <TableHead className="min-w-[120px]">Product type</TableHead>
                  <TableHead className="min-w-[160px]">Date</TableHead>
                  <TableHead className="min-w-[200px]">Submitted by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer hover:bg-muted/50"
                    tabIndex={0}
                    role="link"
                    onClick={() => goToEntry(e.entryUid)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        goToEntry(e.entryUid);
                      }
                    }}
                  >
                    <TableCell className="align-top font-mono text-xs">{e.entryUid}</TableCell>
                    <TableCell className="align-top text-sm">{typeLabel(e.productType)}</TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatWhen(e.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[280px] align-top break-words text-sm text-muted-foreground">
                      {submittedByLabel(e)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!pending && entries && entries.length > 0 && viewMode === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((e) => (
            <Link key={e.id} href={`/admin/entry/${encodeURIComponent(e.entryUid)}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader className="pb-2">
                  <CardTitle className="break-all font-mono text-base">{e.entryUid}</CardTitle>
                  <CardDescription>{typeLabel(e.productType)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-xs text-muted-foreground">
                  <p>{formatWhen(e.createdAt)}</p>
                  <p className="pt-1 text-foreground">
                    <span className="text-muted-foreground">By </span>
                    <span className="font-medium">{e.performedBy.name}</span>
                    <span className="text-muted-foreground"> ({e.performedBy.email})</span>
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
