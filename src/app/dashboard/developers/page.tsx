import type { Metadata } from "next";
import { DevelopersView } from "./developers-view";

export const metadata: Metadata = { title: "API keys" };

export default function DevelopersPage() {
  return <DevelopersView />;
}
