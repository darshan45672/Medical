import { Button } from '@/components/ui/button'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface GradientButtonProps extends React.ComponentProps<"button"> {
  gradient?: 'blue' | 'purple' | 'green' | 'amber' | 'red'
  isLoading?: boolean
  loadingText?: string
}

const gradientStyles = {
  blue: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl',
  purple: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl',
  green: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl',
  amber: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl',
  red: 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl'
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, gradient = 'blue', isLoading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          gradientStyles[gradient],
          'transition-all duration-300 font-medium border-0 cursor-pointer',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            {loadingText || 'Loading...'}
          </div>
        ) : (
          children
        )}
      </Button>
    )
  }
)

GradientButton.displayName = 'GradientButton'
