
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Determine if this is a file input to apply specific styling
    const isFileInput = type === "file";
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border border-transparent bg-black/70 px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm relative",
          "before:absolute before:inset-0 before:rounded-md before:p-[1px] before:bg-gradient-to-r before:from-[#4CAF50] before:via-[#9C27B0] before:to-[#FF1493] before:-z-10 before:pointer-events-none",
          "after:absolute after:inset-[1px] after:rounded-[calc(0.375rem-1px)] after:bg-black/70 after:-z-10 after:pointer-events-none",
          isFileInput && "h-auto py-1 px-3 text-xs file:mr-2 file:py-1 file:px-2", // Smaller height for file inputs
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
