import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[10px] font-bold uppercase tracking-[0.22em] text-[#777588]", className)} {...props} />;
}

export { Label };
