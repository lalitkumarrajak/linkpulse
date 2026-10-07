"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { unlockLinkAction } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2Icon className="animate-spin" />}
      Continue
    </Button>
  );
}

export function UnlockForm({ slug }: { slug: string }) {
  const [state, action] = useActionState(unlockLinkAction, {});
  return (
    <form action={action} className="space-y-3 text-left">
      <input type="hidden" name="slug" value={slug} />
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoFocus
          required
          aria-invalid={Boolean(state.error)}
          aria-describedby="unlock-error"
        />
        <FieldError id="unlock-error">{state.error}</FieldError>
      </div>
      <Submit />
    </form>
  );
}
