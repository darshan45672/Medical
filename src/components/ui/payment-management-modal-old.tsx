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
  Hash
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  status: PaymentStatus
  paymentDate?: string
  paymentMethod?: string
  transactionId?: string
  notes?: string
  failureReason?: string
  createdAt: string
  claim: {
    id: string
    claimNumber: string
    diagnosis: string
    patient: {
      id: string
      name: string
      email: string
    }
  }
}

interface PaymentManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: Payment | null
  onPaymentUpdate: () => void
}

export function PaymentManagementModal({
  open,
  onOpenChange,
  payment,
  onPaymentUpdate
}: PaymentManagementModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<PaymentStatus>(payment?.status || PaymentStatus.PENDING)
  const [transactionId, setTransactionId] = useState(payment?.transactionId || '')
  const [failureReason, setFailureReason] = useState(payment?.failureReason || '')
  const [notes, setNotes] = useState(payment?.notes || '')

  const handleUpdatePayment = async () => {
    if (!payment) return

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Management
          </DialogTitle>
          <DialogDescription>
            Update payment status and manage disbursement details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Overview */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Payment Details</h3>
              <PaymentStatusBadge status={payment.status} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="font-semibold">{formatCurrency(payment.amount)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span>{formatDate(payment.createdAt)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Claim:</span>
                <span className="font-mono text-sm">{payment.claim.claimNumber}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Patient:</span>
                <span>{payment.claim.patient.name}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Diagnosis:</span>
                  <p className="text-sm font-medium">{payment.claim.diagnosis}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Payment Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={PaymentStatus.PROCESSING}>Processing</SelectItem>
                  <SelectItem value={PaymentStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={PaymentStatus.FAILED}>Failed</SelectItem>
                  <SelectItem value={PaymentStatus.CANCELLED}>Cancelled</SelectItem>
                  <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
              />
            </div>

            {status === PaymentStatus.FAILED && (
              <div>
                <Label htmlFor="failureReason">Failure Reason</Label>
                <Textarea
                  id="failureReason"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Describe why the payment failed"
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleUpdatePayment}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Updating...' : 'Update Payment Status'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
