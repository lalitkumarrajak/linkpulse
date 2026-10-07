import { BanIcon, ClockIcon, LockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LinkDTO } from "@/server/services/links";

export function StatusBadge({ link }: { link: Pick<LinkDTO, "status" | "hasPassword"> }) {
  return (
    <span className="inline-flex items-center gap-1">
      {link.status === "active" && (
        <Badge variant="success">
          <span className="size-1.5 rounded-full bg-success" aria-hidden /> Active
        </Badge>
      )}
      {link.status === "disabled" && (
        <Badge variant="neutral">
          <BanIcon aria-hidden /> Disabled
        </Badge>
      )}
      {link.status === "expired" && (
        <Badge variant="warning">
          <ClockIcon aria-hidden /> Expired
        </Badge>
      )}
      {link.hasPassword && (
        <Badge variant="outline" title="Password protected">
          <LockIcon aria-hidden /> <span className="sr-only">Password protected</span>
        </Badge>
      )}
    </span>
  );
}
