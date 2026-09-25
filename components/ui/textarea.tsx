"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "border-input placeholder:text-muted-foreground/70 hover:border-ring/60 focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-24 w-full rounded-lg border bg-background px-3 py-2.5 text-sm shadow-xs transition-[color,border-color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 group-data-[invalid=true]/field:border-destructive group-data-[invalid=true]/field:ring-3 group-data-[invalid=true]/field:ring-destructive/15",
        className,
      )}
      {...props}
    />
  );
}
