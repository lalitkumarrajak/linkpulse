import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

export function CodeBlock({ code, title, className }: { code: string; title?: string; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-[#111110] text-[#e7e5e4]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 py-1 pr-1.5 pl-4">
        <span className="font-mono text-xs text-[#a3a29b]">{title ?? "bash"}</span>
        <CopyButton
          value={code}
          label="Copy code"
          className="text-[#a3a29b] hover:bg-white/10 hover:text-white"
        />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
