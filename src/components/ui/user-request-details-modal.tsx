'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  AlertCircle
} from 'lucide-react'
import { ClaimStatus } from '@/types'

interface ClaimRequest {
  id: string
  patient: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
    dateOfBirth?: string
  }
  claims: {
    id: string
    claimNumber: string
    diagnosis: string
    claimAmount: string
    status: string
    createdAt: string
    updatedAt: string
    approvedAmount?: string
  }[]
  totalClaimAmount: number
  latestClaimDate: string
  claimsCount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'
}

interface UserRequestDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ClaimRequest
  onStatusChange?: () => void
}

export function UserRequestDetailsModal({
  open,
  onOpenChange,
  request,
  onStatusChange
}: UserRequestDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  if (!request) return null

  const handleClaimStatusChange = async (claimId: string, newStatus: ClaimStatus) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update claim status')
      }

      toast.success(`Claim status updated to ${newStatus.replace('_', ' ').toLowerCase()}`)
      onStatusChange?.()
    } catch (error) {
      console.error('Error updating claim status:', error)
      toast.error('Failed to update claim status')
    } finally {
      setIsUpdating(false)
    }
  }

  const canUpdateStatus = (status: string) => {
    return status === 'SUBMITTED' || status === 'UNDER_REVIEW'
  }

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null
    const birth = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1
    }
    return age
  }

  const totalApprovedAmount = request.claims
    .filter(claim => claim.status === 'APPROVED' || claim.status === 'PAID')
    .reduce((sum, claim) => sum + parseFloat(claim.approvedAmount || claim.claimAmount), 0)

  const pendingAmount = request.claims
    .filter(claim => claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW')
    .reduce((sum, claim) => sum + parseFloat(claim.claimAmount), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Patient Claim Request Details
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Comprehensive view of {request.patient.name}&apos;s claim submissions and history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information Card */}
          <Card className="border border-gray-200 dark:border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Full Name
                  </label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {request.patient.name}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {request.patient.email}
                    </p>
                  </div>
                </div>

                {request.patient.phone && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Phone Number
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {request.patient.phone}
                      </p>
                    </div>
                  </div>
                )}

                {request.patient.dateOfBirth && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Age / Date of Birth
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {calculateAge(request.patient.dateOfBirth)} years old
                        <span className="text-gray-500 dark:text-gray-400 ml-2">
                          ({formatDate(request.patient.dateOfBirth)})
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {request.patient.address && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Address
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {request.patient.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Claims Summary */}
          <Card className="border border-gray-200 dark:border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Claims Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {request.claimsCount}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Claims</p>
                </div>

                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalApprovedAmount)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approved Amount</p>
                </div>

                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {formatCurrency(pendingAmount)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Claims */}
          <Card className="border border-gray-200 dark:border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Individual Claims ({request.claims.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.claims.map((claim, index) => (
                <div key={claim.id} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                          #{claim.claimNumber}
                        </span>
                        <StatusBadge status={claim.status as ClaimStatus} />
                      </div>
                      
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {claim.diagnosis}
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Claimed: {formatCurrency(parseFloat(claim.claimAmount))}</span>
                        </div>
                        
                        {claim.approvedAmount && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Approved: {formatCurrency(parseFloat(claim.approvedAmount))}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Submitted: {formatDate(claim.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Updated: {formatDate(claim.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {canUpdateStatus(claim.status) && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        {claim.status === 'SUBMITTED' && (
                          <Button
                            size="sm"
                            onClick={() => handleClaimStatusChange(claim.id, ClaimStatus.UNDER_REVIEW)}
                            disabled={isUpdating}
                            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                          >
                            {isUpdating ? <LoadingSpinner size="sm" /> : <Clock className="h-4 w-4 mr-1" />}
                            Set Under Review
                          </Button>
                        )}
                        
                        {claim.status === 'UNDER_REVIEW' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleClaimStatusChange(claim.id, ClaimStatus.APPROVED)}
                              disabled={isUpdating}
                              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                            >
                              {isUpdating ? <LoadingSpinner size="sm" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                              Approve
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={() => handleClaimStatusChange(claim.id, ClaimStatus.REJECTED)}
                              disabled={isUpdating}
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                            >
                              {isUpdating ? <LoadingSpinner size="sm" /> : <XCircle className="h-4 w-4 mr-1" />}
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {index < request.claims.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Summary */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="flex-1">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Processing Notes</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review each claim individually. Use the action buttons to approve, reject, or move claims under review.
                  All status changes are logged and will be reflected in the patient&apos;s claim history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
