"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3Icon,
  CopyIcon,
  CopyPlusIcon,
  ExternalLinkIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PowerIcon,
  QrCodeIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteLinkAction, duplicateLinkAction, setLinkDisabledAction } from "@/app/dashboard/links/actions";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ActionResult } from "@/server/action-result";
import type { LinkDTO } from "@/server/services/links";
import { LinkFormDialog } from "./link-form-dialog";
import { QrDialog } from "./qr-dialog";

function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export function useLinkMutations() {
  const queryClient = useQueryClient();
  const invalidate = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ["links"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    if (id) queryClient.invalidateQueries({ queryKey: ["link", id] });
  };
  return {
    toggle: useMutation({
      mutationFn: async (link: LinkDTO) => unwrap(await setLinkDisabledAction(link.id, !link.disabled)),
      onSuccess: (link) => {
        invalidate(link.id);
        toast.success(link.disabled ? "Link disabled" : "Link enabled");
      },
      onError: (e) => toast.error(e.message),
    }),
    duplicate: useMutation({
      mutationFn: async (link: LinkDTO) => unwrap(await duplicateLinkAction(link.id)),
      onSuccess: (link) => {
        invalidate();
        toast.success("Link duplicated", { description: `/${link.slug}` });
      },
      onError: (e) => toast.error(e.message),
    }),
    remove: useMutation({
      mutationFn: async (link: LinkDTO) => unwrap(await deleteLinkAction(link.id)),
      onSuccess: () => {
        invalidate();
        toast.success("Link deleted");
      },
      onError: (e) => toast.error(e.message),
    }),
  };
}

export function LinkActions({
  link,
  tagSuggestions,
  showAnalytics = true,
  onDeleted,
  trigger,
}: {
  link: LinkDTO;
  tagSuggestions?: string[];
  showAnalytics?: boolean;
  onDeleted?: () => void;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { toggle, duplicate, remove } = useLinkMutations();

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for /${link.slug}`}>
              <MoreHorizontalIcon />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() =>
              navigator.clipboard.writeText(link.shortUrl).then(
                () => toast.success("Copied to clipboard"),
                () => toast.error("Couldn't access the clipboard"),
              )
            }
          >
            <CopyIcon /> Copy short link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setQrOpen(true)}>
            <QrCodeIcon /> QR code
          </DropdownMenuItem>
          {showAnalytics && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/links/${link.id}`}>
                <BarChart3Icon /> View analytics
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon /> Open destination
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => duplicate.mutate(link)}>
            <CopyPlusIcon /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toggle.mutate(link)}>
            <PowerIcon /> {link.disabled ? "Enable" : "Disable"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
            <Trash2Icon /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LinkFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        link={link}
        tagSuggestions={tagSuggestions}
      />
      <QrDialog open={qrOpen} onOpenChange={setQrOpen} shortUrl={link.shortUrl} slug={link.slug} />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete /{link.slug}?</DialogTitle>
            <DialogDescription>
              The short link stops working immediately and its {link.clickCount.toLocaleString()} recorded
              clicks are permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="text-sm text-muted-foreground">
            Tip: disabling a link keeps its analytics while preventing redirects.
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(link, {
                  onSuccess: () => {
                    setDeleteOpen(false);
                    if (onDeleted) onDeleted();
                    else router.refresh();
                  },
                })
              }
            >
              {remove.isPending && <Loader2Icon className="animate-spin" />}
              Delete link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
