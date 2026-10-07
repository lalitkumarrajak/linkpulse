"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  BookOpenIcon,
  KeyRoundIcon,
  Loader2Icon,
  PlusIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAppConfig } from "@/components/app-config";
import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/components/copy-button";
import { PageHeader } from "@/components/dashboard/shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/api-client";
import { timeAgo } from "@/lib/utils";
import type { ApiKeyDTO } from "@/server/services/api-keys";
import { createApiKeyAction, revokeApiKeyAction } from "./actions";

function CreateKeyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [created, setCreated] = useState<{ key: string; name: string } | null>(null);
  const create = useMutation({
    mutationFn: async () => {
      const result = await createApiKeyAction(name);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      setCreated({ key: data.key, name: data.name });
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  function close(o: boolean) {
    onOpenChange(o);
    if (!o) {
      setTimeout(() => {
        setName("");
        setCreated(null);
        create.reset();
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Save your API key</DialogTitle>
              <DialogDescription>
                This is the only time the key for <strong className="text-foreground">{created.name}</strong>{" "}
                will be shown. We only store a hash of it.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 py-1 pr-1 pl-3">
                <code className="flex-1 truncate font-mono text-[13px]" data-testid="new-api-key">
                  {created.key}
                </code>
                <CopyButton value={created.key} label="Copy API key" showLabel variant="secondary" />
              </div>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangleIcon className="mt-px size-3.5 shrink-0 text-warning" />
                Store it in a secret manager or environment variable. Never commit it to source control.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                Keys have full access to your links. Name them after where they&apos;re used.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GitHub Actions"
                autoFocus
                maxLength={60}
                aria-invalid={create.isError}
              />
              <FieldError>{create.error?.message}</FieldError>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || !name.trim()}>
                {create.isPending && <Loader2Icon className="animate-spin" />}
                Create key
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DevelopersView() {
  const { appUrl } = useAppConfig();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const keys = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => fetchJson<ApiKeyDTO[]>("/api/app/api-keys"),
  });
  const revoke = useMutation({
    mutationFn: async (key: ApiKeyDTO) => {
      const result = await revokeApiKeyAction(key.id);
      if (!result.ok) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success("API key revoked");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="API keys"
        description="Authenticate requests to the LinkPulse REST API."
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href="/docs">
                <BookOpenIcon /> API docs
              </Link>
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}>
              <PlusIcon /> Create key
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Active keys</CardTitle>
              <CardDescription>Revoked keys stop working immediately.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {keys.isPending ? (
              <div className="space-y-2 px-5 pb-5">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : !keys.data?.length ? (
              <EmptyState
                icon={KeyRoundIcon}
                title="No API keys yet"
                description="Create a key to start creating links from scripts, CI or other apps."
                action={
                  <Button size="sm" onClick={() => setOpen(true)}>
                    <PlusIcon /> Create key
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-5 py-2.5 font-medium">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-2.5 font-medium">
                        Key
                      </th>
                      <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">
                        Last used
                      </th>
                      <th scope="col" className="px-5 py-2.5">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {keys.data.map((key) => (
                      <tr key={key.id}>
                        <td className="px-5 py-3">
                          <p className="font-medium">{key.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Created{" "}
                            {new Date(key.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                          </p>
                        </td>
                        <td className="px-3 py-3 font-mono text-[13px] whitespace-nowrap text-muted-foreground">
                          {key.prefix}••••••••
                        </td>
                        <td className="hidden px-3 py-3 whitespace-nowrap text-muted-foreground sm:table-cell">
                          {key.lastUsedAt ? timeAgo(key.lastUsedAt) : "Never"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            disabled={revoke.isPending && revoke.variables?.id === key.id}
                            onClick={() => revoke.mutate(key)}
                          >
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Quick start</CardTitle>
              <CardDescription>Create a link with your new key.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeBlock
              code={`curl -X POST ${appUrl}/api/v1/links \\
  -H "Authorization: Bearer $LINKPULSE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com", "tags": ["api"]}'`}
            />
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
                Keys are SHA-256 hashed at rest and shown only once.
              </li>
              <li className="flex gap-2">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
                Each key is limited to 60 requests per minute.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <CreateKeyDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
