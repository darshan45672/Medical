import { useState } from 'react'
import { PaymentStatus } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaymentStatusBadge } from './payment-status-badge'
import { toast } from 'sonner'
import { 
  CreditCard, 
  DollarSign, 
  Calendar,
  User,
  FileText,
  Hash,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Shield,
  Sparkles,
  Building,
  ArrowRight,
  Zap
} from 'lucide-react'

interface PaymentManagementModalProps {
  payment: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentUpdate: () => void
}

export function PaymentManagementModal({
  payment,
  open,
  onOpenChange,
  onPaymentUpdate
}: PaymentManagementModalProps) {
  const [status, setStatus] = useState<PaymentStatus>(payment?.status || PaymentStatus.PENDING)
  const [transactionId, setTransactionId] = useState(payment?.transactionId || '')
  const [failureReason, setFailureReason] = useState(payment?.failureReason || '')
  const [notes, setNotes] = useState(payment?.notes || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdatePayment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          transactionId: transactionId || undefined,
          failureReason: failureReason || undefined,
          notes: notes || undefined
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update payment')
      }

      toast.success('Payment status updated successfully')
      onPaymentUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating payment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update payment')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!payment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-none shadow-2xl">
        <DialogHeader className="relative pb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-t-lg -m-6 mb-0"></div>
          <div className="relative z-10">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              Payment Management
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Update payment status and manage transaction details for claim disbursement
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Information Card */}
          <div className="space-y-6">
            {/* Payment Overview */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg shadow-md">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Payment Amount</h3>
                    <p className="text-emerald-700 dark:text-emerald-300 text-sm">Claim disbursement</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(payment.amount)}
                  </div>
                  <PaymentStatusBadge status={payment.status} className="mt-2" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200 dark:border-emerald-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Created</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">{formatDate(payment.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Updated</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">{formatDate(payment.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Claim Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500 rounded-lg shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Claim Details</h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">Associated medical claim</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Claim ID:</span>
                  </div>
                  <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
                    {payment.claim.claimNumber}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Patient:</span>
                  </div>
                  <span className="text-blue-800 dark:text-blue-200 font-medium">{payment.claim.patient.name}</span>
                </div>

                <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1" />
                    <div className="flex-1">
                      <span className="text-blue-700 dark:text-blue-300 font-medium text-sm">Diagnosis:</span>
                      <p className="text-blue-800 dark:text-blue-200 text-sm mt-1 leading-relaxed">
                        {payment.claim.diagnosis}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update Form */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-800 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">Update Payment Status</h3>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">Manage payment processing workflow</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-purple-800 dark:text-purple-200 font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Payment Status
                  </Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
                    <SelectTrigger className="bg-white/70 dark:bg-slate-900/70 border-purple-300 dark:border-purple-700 focus:ring-purple-500 h-12">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentStatus.PENDING} className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending
                      </SelectItem>
                      <SelectItem value={PaymentStatus.PROCESSING} className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Processing
                      </SelectItem>
                      <SelectItem value={PaymentStatus.COMPLETED} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </SelectItem>
                      <SelectItem value={PaymentStatus.FAILED} className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Failed
                      </SelectItem>
                      <SelectItem value={PaymentStatus.CANCELLED}>Cancelled</SelectItem>
                      <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionId" className="text-purple-800 dark:text-purple-200 font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Transaction ID
                  </Label>
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction reference ID"
                    className="bg-white/70 dark:bg-slate-900/70 border-purple-300 dark:border-purple-700 focus:ring-purple-500 h-12"
                  />
                </div>

                {status === PaymentStatus.FAILED && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="failureReason" className="text-red-800 dark:text-red-200 font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Failure Reason
                    </Label>
                    <Textarea
                      id="failureReason"
                      value={failureReason}
                      onChange={(e) => setFailureReason(e.target.value)}
                      placeholder="Describe the reason for payment failure"
                      rows={3}
                      className="bg-white/70 dark:bg-slate-900/70 border-red-300 dark:border-red-700 focus:ring-red-500"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-purple-800 dark:text-purple-200 font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes or comments"
                    rows={3}
                    className="bg-white/70 dark:bg-slate-900/70 border-purple-300 dark:border-purple-700 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleUpdatePayment}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Updating Payment...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Update Payment Status
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="px-6 h-12 border-2 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
