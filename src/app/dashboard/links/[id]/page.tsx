import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { ServiceError } from "@/server/errors";
import { linkService } from "@/server/services/links";
import { LinkDetailView } from "./link-detail-view";

async function load(id: string) {
  const user = await requireUser();
  try {
    return await linkService.get(user.id, id);
  } catch (error) {
    if (error instanceof ServiceError && error.code === "not_found") notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/dashboard/links/[id]">): Promise<Metadata> {
  const link = await load((await params).id);
  return { title: `/${link.slug} analytics` };
}

export default async function LinkDetailPage({ params }: PageProps<"/dashboard/links/[id]">) {
  const link = await load((await params).id);
  return <LinkDetailView initialLink={link} />;
}
