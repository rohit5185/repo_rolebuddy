import type { HTMLAttributes } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]", {
  variants: {
    variant: {
      default: "border-transparent bg-[#3b2ae1] text-white",
      secondary: "border-[#c7c4d9]/60 bg-[#f5f2ff] text-[#1b1b24]",
      outline: "border-[#c7c4d9]/70 text-[#1b1b24]",
      success: "border-transparent bg-[#1f6d42] text-white",
      warning: "border-transparent bg-[#9a5b00] text-white"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };