import { cva, type VariantProps } from "@/lib/cva";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variant: {
      neutral: "border-border bg-muted text-muted-foreground",
      primary: "border-transparent bg-accent text-accent-foreground",
      success: "border-success/25 bg-success/10 text-success",
      warning: "border-warning/25 bg-warning/10 text-warning",
      danger: "border-destructive/25 bg-destructive/10 text-destructive",
      outline: "bg-transparent text-foreground",
    },
  },
  { variant: "neutral" },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
