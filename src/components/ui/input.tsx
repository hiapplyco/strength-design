
import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  borderStyle?: "gold" | "multicolor";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, borderStyle = "multicolor", ...props }, ref) => {
    // Determine if this is a file input to apply specific styling
    const isFileInput = type === "file";
    
    return (
      <div className="relative rounded-md">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-md border border-transparent bg-background px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm relative z-10",
            isFileInput && "h-auto py-1 px-3 text-xs file:mr-2 file:py-1 file:px-2", // Smaller height for file inputs
            className
          )}
          ref={ref}
          {...props}
        />
        {borderStyle === "multicolor" && (
          <>
            <div 
              className="absolute inset-0 rounded-md p-[1px] -z-10 
              bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40"
            />
            <div className="absolute inset-[1px] rounded-[calc(0.375rem-1px)] bg-background -z-[5]" />
          </>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

