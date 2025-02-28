
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative rounded-md">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-transparent bg-black/70 px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 relative z-10",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] -z-10 p-[1px]"></div>
        <div className="absolute inset-[1px] rounded-[calc(0.375rem-1px)] bg-black/70 -z-[5]"></div>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
