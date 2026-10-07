import { redirect } from "next/navigation";
import { AppConfigProvider } from "@/components/app-config";
import { DashboardShell } from "@/components/dashboard/shell";
import { appUrl } from "@/lib/app-url";
import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  return (
    <AppConfigProvider value={{ appUrl: appUrl(), user }}>
      <DashboardShell>{children}</DashboardShell>
    </AppConfigProvider>
  );
}
