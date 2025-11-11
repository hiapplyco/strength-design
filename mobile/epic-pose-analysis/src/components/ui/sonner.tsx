
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      expand={true}
      richColors={true}
      closeButton={true}
      toastOptions={{
        classNames: {
          toast: [
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground",
            "group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
            "group-[.toaster]:backdrop-blur-sm group-[.toaster]:border",
            "group-[.toaster]:transition-all group-[.toaster]:duration-200",
            "group-[.toaster]:hover:shadow-xl group-[.toaster]:hover:scale-[1.02]"
          ].join(" "),
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: [
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            "group-[.toast]:hover:bg-primary/90 group-[.toast]:rounded-md",
            "group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm",
            "group-[.toast]:font-medium group-[.toast]:transition-colors"
          ].join(" "),
          cancelButton: [
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            "group-[.toast]:hover:bg-muted/80 group-[.toast]:rounded-md",
            "group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm"
          ].join(" "),
          closeButton: [
            "group-[.toast]:bg-background group-[.toast]:text-foreground",
            "group-[.toast]:border-border group-[.toast]:hover:bg-muted",
            "group-[.toast]:rounded-md group-[.toast]:transition-colors"
          ].join(" "),
          success: "group-[.toast]:border-green-500/20 group-[.toast]:bg-green-50/50 dark:group-[.toast]:bg-green-950/20",
          error: "group-[.toast]:border-red-500/20 group-[.toast]:bg-red-50/50 dark:group-[.toast]:bg-red-950/20",
          warning: "group-[.toast]:border-amber-500/20 group-[.toast]:bg-amber-50/50 dark:group-[.toast]:bg-amber-950/20",
          info: "group-[.toast]:border-blue-500/20 group-[.toast]:bg-blue-50/50 dark:group-[.toast]:bg-blue-950/20",
        },
        duration: 4000,
      }}
      {...props}
    />
  )
}

export { Toaster }
