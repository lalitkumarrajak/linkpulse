"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label = "Copy",
  toastMessage = "Copied to clipboard",
  showLabel = false,
  className,
  variant = "ghost",
  size,
}: {
  value: string;
  label?: string;
  toastMessage?: string;
  showLabel?: boolean;
} & Pick<ButtonProps, "className" | "variant" | "size">) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (showLabel ? "sm" : "icon-sm")}
      aria-label={label}
      className={cn(!showLabel && "size-7 text-muted-foreground hover:text-foreground", className)}
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(toastMessage);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Couldn't access the clipboard");
        }
      }}
    >
      {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
      {showLabel && (copied ? "Copied" : label)}
    </Button>
  );
}
