import { BarChart3Icon, GlobeIcon, QrCodeIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const highlights = [
  {
    icon: BarChart3Icon,
    title: "Real-time analytics",
    text: "Clicks, referrers, countries and devices — updated as they happen.",
  },
  {
    icon: QrCodeIcon,
    title: "QR codes built in",
    text: "Download crisp PNG or SVG codes for print and slides.",
  },
  {
    icon: GlobeIcon,
    title: "Developer API",
    text: "Create and manage links programmatically with scoped API keys.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Logo />
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
      <aside className="relative hidden overflow-hidden border-l bg-muted/40 lg:block">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-center gap-10 p-14">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Why LinkPulse</p>
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Every link tells a story. Read it in real time.
            </h2>
          </div>
          <ul className="space-y-6">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg border bg-card shadow-xs">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
