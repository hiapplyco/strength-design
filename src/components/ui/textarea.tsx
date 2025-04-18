
import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  borderStyle?: "default" | "multicolor";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, borderStyle = "default", ...props }, ref) => {
    return (
      <div className="relative rounded-md">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm", 
            "text-gray-800 dark:text-white", // More visible dark text in light mode
            "placeholder:text-gray-500 dark:placeholder:text-gray-400", // Improved placeholder visibility
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            borderStyle === "multicolor" && "border-[3px] border-transparent bg-clip-padding bg-origin-border bg-white",
            borderStyle === "multicolor" && "before:absolute before:inset-0 before:rounded-md before:p-[3px] before:bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] before:mask-composite:subtract",
            className
          )}
          ref={ref}
          {...props}
        />
        {borderStyle === "multicolor" && (
          <div 
            className="absolute inset-0 rounded-md p-[1px] -z-10 
            bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-40"
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

