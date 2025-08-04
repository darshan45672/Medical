import { PaymentStatus } from '@/types'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  CheckCircle, 
  Ban, 
  RotateCcw,
  Zap,
  AlertTriangle
} from 'lucide-react'

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PaymentStatusBadge({ status, className, size = 'md' }: PaymentStatusBadgeProps) {
  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return {
          label: 'Pending',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-300 dark:border-amber-700 shadow-sm'
        }
      case PaymentStatus.PROCESSING:
        return {
          label: 'Processing',
          variant: 'secondary' as const,
          icon: Zap,
          className: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 dark:border-blue-700 shadow-sm animate-pulse'
        }
      case PaymentStatus.COMPLETED:
        return {
          label: 'Completed',
          variant: 'secondary' as const,
          icon: CheckCircle,
          className: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-300 dark:border-emerald-700 shadow-sm'
        }
      case PaymentStatus.FAILED:
        return {
          label: 'Failed',
          variant: 'destructive' as const,
          icon: AlertTriangle,
          className: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-300 dark:border-red-700 shadow-sm'
        }
      case PaymentStatus.CANCELLED:
        return {
          label: 'Cancelled',
          variant: 'secondary' as const,
          icon: Ban,
          className: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-300 dark:border-gray-700 shadow-sm'
        }
      case PaymentStatus.REFUNDED:
        return {
          label: 'Refunded',
          variant: 'secondary' as const,
          icon: RotateCcw,
          className: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200 dark:from-purple-900/30 dark:to-violet-900/30 dark:text-purple-300 dark:border-purple-700 shadow-sm'
        }
      default:
        return {
          label: 'Unknown',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-300 dark:border-gray-700 shadow-sm'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  }

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} ${className} flex items-center gap-1.5 font-medium border transition-all duration-200`}
    >
      <Icon className={`${iconSizes[size]} ${status === PaymentStatus.PROCESSING ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  )
}
