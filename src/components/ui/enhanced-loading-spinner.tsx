"use client"

import { cn } from '@/lib/utils'

interface EnhancedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  variant?: 'default' | 'gradient' | 'pulse' | 'dots'
}

export function EnhancedLoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  variant = 'gradient'
}: EnhancedLoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  if (variant === 'dots') {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce",
                size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-5 h-5"
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse font-medium">
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className={cn(
          "rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse",
          sizeClasses[size]
        )} />
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse font-medium">
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'gradient') {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className="relative">
          <div className={cn(
            "border-4 border-transparent rounded-full animate-spin",
            "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
            sizeClasses[size]
          )}
          style={{
            background: 'conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), white 0)',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), white 0)'
          }}
          />
        </div>
        {text && (
          <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse font-medium">
            {text}
          </p>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative">
        <div className={cn(sizeClasses[size], "border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin")}></div>
        <div className={cn("absolute inset-0", sizeClasses[size], "border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin")}></div>
      </div>
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse font-medium">
          {text}
        </p>
      )}
    </div>
  )
}

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({ isLoading, message = "Loading...", className }: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div className={cn(
      "absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 rounded-lg",
      className
    )}>
      <EnhancedLoadingSpinner variant="gradient" size="lg" />
      <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  )
}
