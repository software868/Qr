"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  onScan: (text: string) => void;
};

export function QrScannerButton({ onScan }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reactId = useId();
  const regionId = `qr-reader-${reactId.replace(/:/g, "")}`;
  const onScanRef = useRef(onScan);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open) return;
    setError(null);

    let cancelled = false;

    const timer = setTimeout(() => {
      const el = document.getElementById(regionId);
      if (!el || cancelled) return;

      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            onScanRef.current(decoded);
            scanner.stop().catch(() => undefined);
            scannerRef.current = null;
            setOpen(false);
          },
          () => undefined,
        )
        .catch((err) => {
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
              setError("Camera permission denied. Please allow camera access in your browser settings.");
            } else if (msg.includes("NotFoundError") || msg.includes("Requested device not found")) {
              setError("No camera found on this device.");
            } else {
              setError(`Camera error: ${msg}`);
            }
          }
        });
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => undefined);
        scannerRef.current = null;
      }
    };
  }, [open, regionId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          Scan QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR code</DialogTitle>
          <DialogDescription>Allow camera access and point at a QR code.</DialogDescription>
        </DialogHeader>
        <div
          id={regionId}
          className="w-full min-h-[280px] overflow-hidden rounded-md bg-black/5"
        />
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
