
import * as React from "react"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/design-tokens"

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
            "text-gray-900 dark:text-white",
            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "pointer-events-auto", // Ensure textareas are always clickable
            borderStyle === "multicolor" && "border-[3px] border-transparent bg-clip-padding bg-origin-border bg-white",
            className
          )}
          ref={ref}
          {...props}
        />
        {borderStyle === "multicolor" && (
          <div 
            className={cn(
              "absolute inset-0 rounded-md p-[1px] -z-10 pointer-events-none",
              `bg-gradient-to-r ${colors.gradients.multicolor} opacity-40`
            )}
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
