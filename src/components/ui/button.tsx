
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 duration-200",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#DAA520] to-[#C4A052] text-primary-foreground hover:from-[#E5C88E] hover:to-[#DAA520] gradient-border h-14",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 gradient-border h-14",
        destructiveSecondary: 
          "bg-destructiveSecondary text-destructive-foreground hover:bg-destructiveSecondary/90 gradient-border h-14",
        outline:
          "border bg-black/50 hover:bg-accent/10 hover:text-accent-foreground gradient-border h-12",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 gradient-border h-14",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground h-12",
        link: "text-primary underline-offset-4 hover:underline h-auto",
      },
      size: {
        default: "px-4 py-2",
        sm: "rounded-md px-3",
        lg: "rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
