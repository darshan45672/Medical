import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { useUpdateClaim, useDeleteClaim } from '@/hooks/use-claims'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  FileText, 
  User, 
  Building2, 
  CalendarDays, 
  Stethoscope,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { UserRole, ClaimStatus } from '@/types'

interface ClaimDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  claim: any | null
  session?: any
}

export function ClaimDetailsModal({ open, onOpenChange, claim, session }: ClaimDetailsModalProps) {
  const updateClaimMutation = useUpdateClaim()
  const deleteClaimMutation = useDeleteClaim()

  if (!claim) return null

  const isInsuranceUser = session?.user?.role === UserRole.INSURANCE
  const canEdit = !isInsuranceUser && (claim.status === 'DRAFT' || claim.status === 'UNDER_REVIEW')
  const canDelete = claim.status === 'DRAFT'
  
  // Insurance actions based on claim status
  const canApprove = isInsuranceUser && claim.status === 'UNDER_REVIEW'
  const canReject = isInsuranceUser && claim.status === 'UNDER_REVIEW'
  const canSetUnderReview = isInsuranceUser && claim.status === 'SUBMITTED'

  const handleEdit = () => {
    // TODO: Implement edit functionality - could open an edit modal or navigate to edit page
    toast.info('Edit functionality will be implemented soon')
  }

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('Only draft claims can be deleted')
      return
    }

    if (window.confirm('Are you sure you want to delete this claim? This action cannot be undone.')) {
      try {
        await deleteClaimMutation.mutateAsync(claim.id)
        toast.success('Claim deleted successfully')
        onOpenChange(false)
      } catch {
        toast.error('Failed to delete claim')
      }
    }
  }

  const handleStatusChange = async (newStatus: ClaimStatus) => {
    try {
      await updateClaimMutation.mutateAsync({
        id: claim.id,
        data: { status: newStatus }
      })
      
      const statusMessages: Record<ClaimStatus, string> = {
        [ClaimStatus.DRAFT]: 'Claim saved as draft',
        [ClaimStatus.SUBMITTED]: 'Claim submitted',
        [ClaimStatus.UNDER_REVIEW]: 'Claim status updated to Under Review',
        [ClaimStatus.APPROVED]: 'Claim has been approved successfully',
        [ClaimStatus.REJECTED]: 'Claim has been rejected',
        [ClaimStatus.PAID]: 'Claim has been marked as paid'
      }
      
      toast.success(statusMessages[newStatus] || 'Claim status updated')
      onOpenChange(false)
    } catch {
      toast.error('Failed to update claim status')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gray-200 dark:border-slate-700 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Claim Details
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete information about your insurance claim
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Claim Overview */}
          <Card className="border border-gray-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Claim Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(canEdit || canDelete) && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Claim Actions Available
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {canEdit && canDelete && 'You can edit or delete this claim as it is still in draft status.'}
                        {canEdit && !canDelete && 'You can edit this claim as it is under review.'}
                        {!canEdit && canDelete && 'You can delete this claim as it is still in draft status.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Claim Number
                  </label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {claim.claimNumber}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Status
                  </label>
                  <div className="mt-1">
                    <StatusBadge status={claim.status} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Claim Amount
                  </label>
                  <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(claim.claimAmount)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Submitted Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(claim.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card className="border border-gray-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-red-600 dark:text-red-400" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Diagnosis
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {claim.diagnosis}
                </p>
              </div>
              {claim.treatment && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Treatment
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {claim.treatment}
                  </p>
                </div>
              )}
              {claim.treatmentDate && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Treatment Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                    {formatDate(claim.treatmentDate)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Information */}
          {claim.patient && (
            <Card className="border border-gray-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Patient Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {claim.patient.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {claim.patient.email}
                    </p>
                  </div>
                  {claim.patient.phone && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Phone
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {claim.patient.phone}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Doctor Information */}
          {claim.doctor && (
            <Card className="border border-gray-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Doctor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Doctor Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      Dr. {claim.doctor.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {claim.doctor.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {claim.documents && claim.documents.length > 0 && (
            <Card className="border border-gray-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {claim.documents.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {doc.fileName || `Document ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : 'Unknown size'}
                          </p>
                        </div>
                      </div>
                      {doc.fileUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Notes */}
          {claim.notes && (
            <Card className="border border-gray-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {claim.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4 flex justify-between items-center">
          <div className="flex gap-2">
            {/* Patient/Doctor Actions */}
            {canEdit && (
              <Button
                onClick={handleEdit}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white cursor-pointer"
                disabled={updateClaimMutation.isPending}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Claim
              </Button>
            )}
            {canDelete && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 cursor-pointer"
                disabled={deleteClaimMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Claim
              </Button>
            )}

            {/* Insurance Actions */}
            {isInsuranceUser && (
              <>
                {canSetUnderReview && (
                  <Button
                    onClick={() => handleStatusChange(ClaimStatus.UNDER_REVIEW)}
                    className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white cursor-pointer"
                    disabled={updateClaimMutation.isPending}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Set Under Review
                  </Button>
                )}
                {canApprove && (
                  <Button
                    onClick={() => handleStatusChange(ClaimStatus.APPROVED)}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white cursor-pointer"
                    disabled={updateClaimMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                )}
                {canReject && (
                  <Button
                    onClick={() => handleStatusChange(ClaimStatus.REJECTED)}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white cursor-pointer"
                    disabled={updateClaimMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                )}
              </>
            )}
          </div>
          
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
