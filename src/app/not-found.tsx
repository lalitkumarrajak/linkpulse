import { LinkIcon } from "lucide-react";
import Link from "next/link";
import { StatusScreen } from "@/components/status-screen";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <StatusScreen
      icon={LinkIcon}
      eyebrow="404"
      title="We couldn't find that link"
      description="The short link may have been mistyped or deleted by its owner."
    >
      <div className="flex justify-center gap-2">
        <Button asChild>
          <Link href="/">Go to LinkPulse</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/signup">Create your own</Link>
        </Button>
      </div>
    </StatusScreen>
  );
}
