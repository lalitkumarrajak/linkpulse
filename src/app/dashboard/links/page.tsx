import type { Metadata } from "next";
import { LinksView } from "./links-view";

export const metadata: Metadata = { title: "Links" };

export default async function LinksPage({ searchParams }: PageProps<"/dashboard/links">) {
  const params = await searchParams;
  const create = Array.isArray(params.create) ? params.create[0] : params.create;
  return <LinksView createUrl={create} />;
}
