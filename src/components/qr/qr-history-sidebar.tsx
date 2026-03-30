"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductWithQr } from "@/actions/product";

const SELECT_EVENT = "qr-history-select";
const ADD_EVENT = "qr-history-add";

export function QrHistorySidebar({ history }: { history: ProductWithQr[] }) {
  const [items, setItems] = useState<ProductWithQr[]>(history);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Keep sidebar in sync when a new QR is generated.
    const onAdd = (e: Event) => {
      const detail = (e as CustomEvent).detail as ProductWithQr | undefined;
      if (!detail) return;
      setItems((prev) => [detail, ...prev]);
    };
    window.addEventListener(ADD_EVENT, onAdd);
    return () => window.removeEventListener(ADD_EVENT, onAdd);
  }, []);

  const normalizeName = (s: string) => s.trim().toLowerCase();

  const deduped = useMemo(() => {
    const seen = new Set<string>();
    const out: ProductWithQr[] = [];
    // items is already in desc order (most recent first). Keep the first occurrence.
    for (const p of items) {
      const key = normalizeName(p.name);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
    return out;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = deduped;
    if (!q) return base;
    return base.filter((p) => p.name.toLowerCase().includes(q));
  }, [deduped, query]);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">Projects</Label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          aria-label="Search projects by name"
          className="h-8"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">No projects found.</p>
      ) : (
        <div className="max-h-[280px] space-y-1 overflow-auto pr-1">
          {filtered.slice(0, 50).map((p) => (
            <button
              key={p.productUid}
              type="button"
              className="w-full rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent(SELECT_EVENT, {
                    detail: { name: p.name, make: p.make, model: p.model },
                  }),
                );
              }}
            >
              <span className="block truncate">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

