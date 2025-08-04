"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { ButtonHTMLAttributes, forwardRef } from "react"

type ActionType = "process" | "manage" | "view" | "edit" | "delete" | "approve" | "reject"

interface EnhancedActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  action: ActionType
  loading?: boolean
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
  children?: React.ReactNode
}

const actionStyles: Record<ActionType, string> = {
  process: "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl",
  manage: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl",
  view: "bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white border-0 shadow-lg hover:shadow-xl",
  edit: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl",
  delete: "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl",
  approve: "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0 shadow-lg hover:shadow-xl",
  reject: "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-lg hover:shadow-xl"
}

const actionLabels: Record<ActionType, string> = {
  process: "Process",
  manage: "Manage",
  view: "View",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve",
  reject: "Reject"
}

const EnhancedActionButton = forwardRef<HTMLButtonElement, EnhancedActionButtonProps>(
  ({ action, loading = false, variant = "default", size = "sm", className, children, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8 px-3 text-xs font-medium",
      md: "h-10 px-4 text-sm font-medium",
      lg: "h-12 px-6 text-base font-medium"
    }

    return (
      <Button
        ref={ref}
        variant={variant === "default" ? "default" : variant}
        className={cn(
          sizeClasses[size],
          variant === "default" && actionStyles[action],
          "relative transition-all duration-300 transform hover:scale-105 focus:scale-105",
          "backdrop-blur-sm border-0 rounded-lg font-semibold cursor-pointer",
          "focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50",
          loading && "cursor-not-allowed opacity-80",
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        )}
        {children || actionLabels[action]}
      </Button>
    )
  }
)

EnhancedActionButton.displayName = "EnhancedActionButton"

export { EnhancedActionButton }
export type { EnhancedActionButtonProps, ActionType }
