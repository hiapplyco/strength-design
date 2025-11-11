import * as React from "react"
import { cn } from "@/lib/utils"

export function Sidebar({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("h-screen w-64 bg-background border-r", className)}>
      {children}
    </div>
  )
}

export function SidebarContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col flex-1 overflow-auto", className)}>
      {children}
    </div>
  )
}

export function SidebarTrigger({ className, children }: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn("fixed top-4 left-4 z-50", className)}>
      {children}
    </button>
  )
}

export function SidebarMenu({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
    </div>
  )
}

export function SidebarMenuItem({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  )
}