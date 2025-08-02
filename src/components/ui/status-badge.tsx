import { Badge } from '@/components/ui/badge'
import { getStatusColor } from '@/lib/utils'
import { ClaimStatus } from '@/types'

interface StatusBadgeProps {
  status: ClaimStatus
}

const statusLabels: Record<ClaimStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAID: 'Paid',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={getStatusColor(status)}>
      {statusLabels[status]}
    </Badge>
  )
}