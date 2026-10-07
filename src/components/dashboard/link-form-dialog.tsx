"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createLinkAction, updateLinkAction } from "@/app/dashboard/links/actions";
import { useShortHost } from "@/components/app-config";
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
import { FieldError, Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { fetchJson } from "@/lib/api-client";
import { validateSlugClient } from "@/lib/slug-rules";
import { useDebounced } from "@/lib/use-debounced";
import { buildUtmUrl, parseUtmParams, stripUtmParams, UTM_FIELDS, type UtmParams } from "@/lib/utm";
import { cn } from "@/lib/utils";
import { destinationUrlSchema } from "@/lib/validation";
import type { LinkDTO } from "@/server/services/links";
import { TagInput } from "./tag-input";

const UTM_LABELS: Record<(typeof UTM_FIELDS)[number], { label: string; placeholder: string }> = {
  source: { label: "Source", placeholder: "twitter" },
  medium: { label: "Medium", placeholder: "social" },
  campaign: { label: "Campaign", placeholder: "spring-launch" },
  term: { label: "Term", placeholder: "url shortener" },
  content: { label: "Content", placeholder: "hero-cta" },
};

function toLocalInput(iso: string | null) {
  return iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : "";
}

function Section({
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const id = `section-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between gap-4 px-3.5 py-3">
        <div>
          <label htmlFor={id} className="text-sm font-medium">
            {title}
          </label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch id={id} checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && <div className="space-y-3 border-t px-3.5 py-3.5">{children}</div>}
    </div>
  );
}

export function LinkFormDialog({
  open,
  onOpenChange,
  link,
  initialUrl,
  tagSuggestions,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link?: LinkDTO;
  initialUrl?: string;
  tagSuggestions?: string[];
  onSaved?: (link: LinkDTO) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {open && (
          <LinkForm
            key={link?.id ?? "new"}
            link={link}
            initialUrl={initialUrl}
            tagSuggestions={tagSuggestions}
            onDone={(saved) => {
              onOpenChange(false);
              onSaved?.(saved);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LinkForm({
  link,
  initialUrl,
  tagSuggestions,
  onDone,
  onCancel,
}: {
  link?: LinkDTO;
  initialUrl?: string;
  tagSuggestions?: string[];
  onDone: (link: LinkDTO) => void;
  onCancel: () => void;
}) {
  const host = useShortHost();
  const queryClient = useQueryClient();
  const isEdit = Boolean(link);
  const initialUtm = link ? parseUtmParams(link.url) : initialUrl ? parseUtmParams(initialUrl) : {};

  const [url, setUrl] = useState(() =>
    link ? stripUtmParams(link.url) : initialUrl ? stripUtmParams(initialUrl) : "",
  );
  const [slug, setSlug] = useState(link?.slug ?? "");
  const [title, setTitle] = useState(link?.title ?? "");
  const [tags, setTags] = useState<string[]>(link?.tags ?? []);
  const [expiryOn, setExpiryOn] = useState(Boolean(link?.expiresAt));
  const [expiresAt, setExpiresAt] = useState(toLocalInput(link?.expiresAt ?? null));
  const [passwordOn, setPasswordOn] = useState(Boolean(link?.hasPassword));
  const [password, setPassword] = useState("");
  const [utmOn, setUtmOn] = useState(Object.keys(initialUtm).length > 0);
  const [utm, setUtm] = useState<UtmParams>(initialUtm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const debouncedSlug = useDebounced(slug.trim());
  const slugChanged = debouncedSlug !== (link?.slug ?? "");
  const localSlugError = debouncedSlug ? validateSlugClient(debouncedSlug) : null;
  const availability = useQuery({
    queryKey: ["slug-available", debouncedSlug],
    queryFn: () =>
      fetchJson<{ available: boolean; reason?: string }>(
        `/api/app/slug?slug=${encodeURIComponent(debouncedSlug)}`,
      ),
    enabled: Boolean(debouncedSlug) && slugChanged && !localSlugError,
    staleTime: 10_000,
  });

  const finalUrl = (() => {
    const parsed = destinationUrlSchema.safeParse(url);
    if (!parsed.success) return null;
    try {
      return utmOn ? buildUtmUrl(parsed.data, utm) : parsed.data;
    } catch {
      return null;
    }
  })();

  const mutation = useMutation({
    mutationFn: async () => {
      const nextErrors: Record<string, string> = {};
      if (!finalUrl)
        nextErrors.url = destinationUrlSchema.safeParse(url).error?.issues[0]?.message ?? "Enter a valid URL";
      if (slug.trim() && validateSlugClient(slug.trim())) nextErrors.slug = validateSlugClient(slug.trim())!;
      if (expiryOn && !expiresAt) nextErrors.expiresAt = "Pick a date and time";
      if (passwordOn && !password && !link?.hasPassword) nextErrors.password = "Enter a password";
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        throw new Error("validation");
      }
      const payload = {
        url: finalUrl!,
        slug: slug.trim() || undefined,
        title: title.trim() || null,
        tags,
        expiresAt: expiryOn && expiresAt ? new Date(expiresAt).toISOString() : null,
        password: passwordOn ? password || undefined : link?.hasPassword ? null : undefined,
      };
      const result = link ? await updateLinkAction(link.id, payload) : await createLinkAction(payload);
      if (!result.ok) {
        setErrors(result.fields ?? {});
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["link", saved.id] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      if (isEdit) toast.success("Link updated");
      else
        toast.success("Short link created", {
          description: saved.shortUrl.replace(/^https?:\/\//, ""),
          action: {
            label: "Copy",
            onClick: () => navigator.clipboard.writeText(saved.shortUrl).then(() => toast.success("Copied")),
          },
        });
      onDone(saved);
    },
    onError: (error) => {
      if (error.message !== "validation") toast.error(error.message);
    },
  });

  const slugStatus =
    !debouncedSlug || !slugChanged ? null : localSlugError ? (
      <span className="flex items-center gap-1 text-destructive">
        <XCircleIcon className="size-3.5" /> {localSlugError}
      </span>
    ) : availability.isFetching ? (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Loader2Icon className="size-3.5 animate-spin" /> Checking…
      </span>
    ) : availability.data?.available ? (
      <span className="flex items-center gap-1 text-success">
        <CheckCircle2Icon className="size-3.5" /> Available
      </span>
    ) : availability.data ? (
      <span className="flex items-center gap-1 text-destructive">
        <XCircleIcon className="size-3.5" /> {availability.data.reason}
      </span>
    ) : null;

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        setErrors({});
        mutation.mutate();
      }}
      noValidate
    >
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit link" : "Create a short link"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Changes apply immediately to everyone using this link."
            : "Paste a destination and customise how it's shared."}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="link-url">Destination URL</Label>
          <Input
            id="link-url"
            autoFocus={!isEdit}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/a/very/long/path"
            inputMode="url"
            aria-invalid={Boolean(errors.url)}
            aria-describedby="link-url-error"
          />
          <FieldError id="link-url-error">{errors.url}</FieldError>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="link-slug">Short link</Label>
            <div
              className={cn(
                "flex h-9 items-center overflow-hidden rounded-lg border border-input bg-card shadow-xs focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20",
                errors.slug && "border-destructive",
              )}
            >
              <span className="flex h-full max-w-[55%] items-center truncate border-r bg-muted/60 px-2.5 text-[13px] text-muted-foreground">
                {host}/
              </span>
              <input
                id="link-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/\s/g, ""))}
                placeholder="auto-generated"
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground/80"
                aria-invalid={Boolean(errors.slug)}
                aria-describedby="link-slug-status"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div id="link-slug-status" className="min-h-4 text-xs" aria-live="polite">
              {errors.slug ? <FieldError>{errors.slug}</FieldError> : slugStatus}
              {isEdit && slugChanged && debouncedSlug && !errors.slug && (
                <p className="mt-1 text-warning">The old short link will stop working.</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-title">
              Title <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="link-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Spring launch post"
              maxLength={120}
            />
            <FieldError>{errors.title}</FieldError>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="link-tags">Tags</Label>
          <TagInput id="link-tags" value={tags} onChange={setTags} suggestions={tagSuggestions} />
          <FieldError>{errors.tags}</FieldError>
        </div>

        <div className="space-y-2.5">
          <Section
            title="Expiration"
            description="Stop redirecting after a date"
            enabled={expiryOn}
            onToggle={setExpiryOn}
          >
            <Label htmlFor="link-expiry" className="sr-only">
              Expires at
            </Label>
            <Input
              id="link-expiry"
              type="datetime-local"
              value={expiresAt}
              min={toLocalInput(new Date().toISOString())}
              onChange={(e) => setExpiresAt(e.target.value)}
              aria-invalid={Boolean(errors.expiresAt)}
            />
            <FieldError>{errors.expiresAt}</FieldError>
          </Section>
          <Section
            title="Password"
            description="Ask visitors for a password first"
            enabled={passwordOn}
            onToggle={setPasswordOn}
          >
            <Label htmlFor="link-password" className="sr-only">
              Password
            </Label>
            <Input
              id="link-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                link?.hasPassword ? "Leave blank to keep the current password" : "At least 4 characters"
              }
              aria-invalid={Boolean(errors.password)}
            />
            <FieldError>{errors.password}</FieldError>
          </Section>
          <Section
            title="UTM parameters"
            description="Track campaigns in your analytics tools"
            enabled={utmOn}
            onToggle={setUtmOn}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {UTM_FIELDS.map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`utm-${field}`} className="text-xs text-muted-foreground">
                    {UTM_LABELS[field].label}
                  </Label>
                  <Input
                    id={`utm-${field}`}
                    value={utm[field] ?? ""}
                    onChange={(e) => setUtm((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={UTM_LABELS[field].placeholder}
                    className="h-8"
                  />
                </div>
              ))}
            </div>
            {finalUrl && (
              <p className="rounded-md bg-muted/60 px-2.5 py-2 font-mono text-[12px] break-all text-muted-foreground">
                {finalUrl}
              </p>
            )}
          </Section>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          {isEdit ? "Save changes" : "Create link"}
        </Button>
      </DialogFooter>
    </form>
  );
}
