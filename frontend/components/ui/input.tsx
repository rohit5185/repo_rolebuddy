import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      suppressHydrationWarning
      className={cn(
        "flex h-11 w-full rounded-none border-0 border-b border-[#c7c4d9]/70 bg-white/40 px-0 py-2 text-sm text-[#1b1b24] placeholder:text-[#c7c4d9] focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#3b2ae1] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
