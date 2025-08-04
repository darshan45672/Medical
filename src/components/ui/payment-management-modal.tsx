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
  CheckCircle2,
  AlertCircle,
  Clock,
  X
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

  if (!payment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Management</DialogTitle>
          <DialogDescription>
            Update payment status and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Claim ID:</span>
                <p className="text-gray-600 dark:text-gray-300">{payment.claim.claimNumber}</p>
              </div>
              <div>
                <span className="font-medium">Patient:</span>
                <p className="text-gray-600 dark:text-gray-300">{payment.claim.patient.name}</p>
              </div>
              <div>
                <span className="font-medium">Amount:</span>
                <p className="text-gray-600 dark:text-gray-300">{formatCurrency(payment.amount)}</p>
              </div>
              <div>
                <span className="font-medium">Current Status:</span>
                <div className="mt-1">
                  <PaymentStatusBadge status={payment.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Update Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Payment Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentStatus.PENDING}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value={PaymentStatus.PROCESSING}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Processing
                    </div>
                  </SelectItem>
                  <SelectItem value={PaymentStatus.COMPLETED}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value={PaymentStatus.FAILED}>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Failed
                    </div>
                  </SelectItem>
                  <SelectItem value={PaymentStatus.CANCELLED}>
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-gray-500" />
                      Cancelled
                    </div>
                  </SelectItem>
                  <SelectItem value={PaymentStatus.REFUNDED}>
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-orange-500" />
                      Refunded
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId" className="text-sm font-medium">Transaction ID</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
                className="h-10"
              />
            </div>

            {status === PaymentStatus.FAILED && (
              <div className="space-y-2">
                <Label htmlFor="failureReason" className="text-sm font-medium">Failure Reason</Label>
                <Textarea
                  id="failureReason"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Describe the reason for payment failure"
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="px-6 py-2 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors duration-200 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePayment}
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Updating..." : "Update Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
