"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  onCapture: (file: File) => void;
};

export function CameraCaptureButton({ onCapture }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      // Avoid synchronous setState in effect body (lint rule).
      setTimeout(() => {
        setCaptured(null);
        setError(null);
      }, 0);
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("NotAllowed") || msg.includes("Permission")) {
            setError("Camera permission denied. Please allow camera access in your browser settings.");
          } else if (msg.includes("NotFound") || msg.includes("Requested device not found")) {
            setError("No camera found on this device.");
          } else {
            setError(`Camera error: ${msg}`);
          }
        }
      }
    };

    const timer = setTimeout(startCamera, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopStream();
    };
  }, [open, stopStream]);

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const maxWidth = 1280;
    const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
    setCaptured(dataUrl);
    stopStream();
  }

  function confirmPhoto() {
    if (!captured) return;
    const byteString = atob(captured.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: "image/jpeg" });
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file);
    setOpen(false);
  }

  function retake() {
    setCaptured(null);
    setError(null);
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError("Could not restart camera.");
      }
    };
    startCamera();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
          <span className="text-sm font-medium text-muted-foreground">Take photo</span>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Take photo</DialogTitle>
          <DialogDescription>Point the camera at the item and click capture.</DialogDescription>
        </DialogHeader>

        <canvas ref={canvasRef} className="hidden" />

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {!captured ? (
          <>
            <div className="overflow-hidden rounded-md bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full"
              />
            </div>
            <Button type="button" onClick={takePhoto} className="w-full">
              Capture
            </Button>
          </>
        ) : (
          <>
            <div className="overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={captured} alt="Captured" className="w-full" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={retake} className="flex-1">
                Retake
              </Button>
              <Button type="button" onClick={confirmPhoto} className="flex-1">
                Use photo
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
