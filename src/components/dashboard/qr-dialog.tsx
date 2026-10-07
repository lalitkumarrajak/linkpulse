"use client";

import { DownloadIcon } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";

const COLORS = [
  { value: "#0b0b0b", label: "Black" },
  { value: "#1c5cab", label: "Blue" },
  { value: "#4a3aa7", label: "Violet" },
  { value: "#0f7b3f", label: "Green" },
] as const;

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

export function QrDialog({
  open,
  onOpenChange,
  shortUrl,
  slug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortUrl: string;
  slug: string;
}) {
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toString(shortUrl, {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: color, light: "#ffffff" },
    })
      .then((markup) => !cancelled && setSvg(markup))
      .catch(() => toast.error("Couldn't generate QR code"));
    return () => {
      cancelled = true;
    };
  }, [open, shortUrl, color]);

  async function downloadPng() {
    const dataUrl = await QRCode.toDataURL(shortUrl, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: color, light: "#ffffff" },
    });
    download(dataUrl, `qr-${slug}.png`);
  }

  function downloadSvg() {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    download(url, `qr-${slug}.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR code</DialogTitle>
          <DialogDescription>Scans open your short link, so every scan is tracked.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="mx-auto w-full max-w-56 overflow-hidden rounded-xl border bg-white p-2 shadow-xs">
            {svg ? (
              <div
                role="img"
                aria-label={`QR code for ${shortUrl}`}
                className="[&_svg]:h-auto [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <div className="aspect-square animate-pulse rounded bg-neutral-100" />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 py-1 pr-1 pl-3">
            <span className="truncate font-mono text-[13px]">{shortUrl.replace(/^https?:\/\//, "")}</span>
            <CopyButton value={shortUrl} label="Copy short link" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Color</span>
            <Segmented
              label="QR color"
              value={color}
              onChange={setColor}
              options={COLORS.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={downloadSvg} disabled={!svg}>
            <DownloadIcon /> SVG
          </Button>
          <Button onClick={downloadPng}>
            <DownloadIcon /> PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
