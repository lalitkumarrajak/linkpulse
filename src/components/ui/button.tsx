import { Slot } from "radix-ui";
import { cva, type VariantProps } from "@/lib/cva";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variant: {
      primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
      secondary: "border bg-card text-foreground shadow-xs hover:bg-muted",
      ghost: "text-foreground hover:bg-muted",
      destructive: "bg-destructive text-destructive-foreground shadow-sm hover:opacity-90",
      link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
    },
    size: {
      sm: "h-8 px-3 text-[13px]",
      md: "h-9 px-4",
      lg: "h-11 px-5 text-[15px]",
      icon: "size-9",
      "icon-sm": "size-8",
    },
  },
  { variant: "primary", size: "md" },
);

export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
