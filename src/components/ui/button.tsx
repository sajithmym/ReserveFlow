import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs",
        outline: "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
        ghost: "text-stone-600 hover:bg-stone-100",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
      size: { default: "h-10 px-4 py-2", sm: "h-9 px-3", lg: "h-12 px-6", icon: "size-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
