import { BanIcon, ClockIcon, LockIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StatusScreen } from "@/components/status-screen";
import { linkService } from "@/server/services/links";
import { UnlockForm } from "./unlock-form";

export const metadata: Metadata = { robots: { index: false } };

export default async function LinkStatusPage({ params }: PageProps<"/l/[slug]">) {
  const { slug } = await params;
  const link = await linkService.resolve(decodeURIComponent(slug));
  if (!link) notFound();

  if (link.disabled)
    return (
      <StatusScreen
        icon={BanIcon}
        eyebrow={`/${slug}`}
        title="This link has been disabled"
        description="The owner of this short link has turned it off. If you think this is a mistake, contact the person who shared it with you."
      />
    );

  if (link.expiresAt && link.expiresAt <= new Date())
    return (
      <StatusScreen
        icon={ClockIcon}
        eyebrow={`/${slug}`}
        title="This link has expired"
        description={`It stopped working on ${link.expiresAt.toLocaleDateString("en-US", { dateStyle: "long" })}. Ask the sender for an updated link.`}
      />
    );

  if (link.passwordHash)
    return (
      <StatusScreen
        icon={LockIcon}
        eyebrow={`/${slug}`}
        title="Password required"
        description="This link is protected. Enter the password you were given to continue."
      >
        <UnlockForm slug={slug} />
      </StatusScreen>
    );

  redirect(`/${slug}`);
}
