import { useState } from 'react'
import { PaymentStatus } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { GradientButton } from './gradient-button'
import { toast } from 'sonner'
import { 
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
  Zap,
  Copy,
  Activity,
  Banknote,
  Timer,
  CheckCheck,
  Receipt,
  CreditCardIcon
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  if (!payment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white dark:bg-slate-900 border-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]">
        
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-8 -m-6 mb-6 rounded-t-xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/30 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <Banknote className="h-8 w-8 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-bold text-white mb-2">
                    Payment Management
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 text-lg">
                    Secure payment processing and transaction management
                  </DialogDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white mb-2">
                  {formatCurrency(payment.amount)}
                </div>
                <PaymentStatusBadge status={payment.status} size="lg" />
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-blue-200" />
                  <div>
                    <p className="text-blue-100 text-sm">Claim ID</p>
                    <p className="text-white font-semibold font-mono">{payment.claim.claimNumber}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-200" />
                  <div>
                    <p className="text-blue-100 text-sm">Patient</p>
                    <p className="text-white font-semibold">{payment.claim.patient.name}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-200" />
                  <div>
                    <p className="text-blue-100 text-sm">Created</p>
                    <p className="text-white font-semibold">{formatDate(payment.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
          
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Claim Information Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Medical Claim Details</h3>
                    <p className="text-blue-700 dark:text-blue-300">Associated insurance claim information</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(payment.claim.claimNumber)}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy ID
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 font-medium text-sm">Claim Number</p>
                      <p className="text-blue-900 dark:text-blue-100 font-mono text-lg">{payment.claim.claimNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 font-medium text-sm">Patient Name</p>
                      <p className="text-blue-900 dark:text-blue-100 font-semibold text-lg">{payment.claim.patient.name}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 font-medium text-sm">Diagnosis</p>
                      <p className="text-blue-900 dark:text-blue-100 leading-relaxed">{payment.claim.diagnosis}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Timeline */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-slate-600 rounded-xl shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Transaction Timeline</h3>
                  <p className="text-slate-700 dark:text-slate-300">Payment processing history and milestones</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Payment Created</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{formatDate(payment.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 dark:text-green-400 font-semibold">Completed</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Status Updates</p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Last updated: {formatDate(payment.updatedAt)}</p>
                  </div>
                  <div className="text-right">
                    <PaymentStatusBadge status={payment.status} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Status Management */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">Status Management</h3>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">Update payment processing status</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-purple-800 dark:text-purple-200 font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Payment Status
                  </Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
                    <SelectTrigger className="h-12 bg-white/80 dark:bg-slate-900/80 border-purple-300 dark:border-purple-700 focus:ring-purple-500 focus:border-purple-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentStatus.PENDING}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <span>Pending</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={PaymentStatus.PROCESSING}>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-500" />
                          <span>Processing</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={PaymentStatus.COMPLETED}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Completed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={PaymentStatus.FAILED}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span>Failed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={PaymentStatus.CANCELLED}>Cancelled</SelectItem>
                      <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionId" className="text-purple-800 dark:text-purple-200 font-semibold flex items-center gap-2">
                    <CreditCardIcon className="h-4 w-4" />
                    Transaction Reference
                  </Label>
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction reference ID"
                    className="h-12 bg-white/80 dark:bg-slate-900/80 border-purple-300 dark:border-purple-700 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {status === PaymentStatus.FAILED && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="failureReason" className="text-red-800 dark:text-red-200 font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Failure Reason
                    </Label>
                    <Textarea
                      id="failureReason"
                      value={failureReason}
                      onChange={(e) => setFailureReason(e.target.value)}
                      placeholder="Describe the reason for payment failure"
                      rows={3}
                      className="bg-white/80 dark:bg-slate-900/80 border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-purple-800 dark:text-purple-200 font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes or comments"
                    rows={4}
                    className="bg-white/80 dark:bg-slate-900/80 border-purple-300 dark:border-purple-700 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <GradientButton
                onClick={handleUpdatePayment}
                disabled={isLoading}
                isLoading={isLoading}
                loadingText="Processing..."
                gradient="blue"
                className="w-full h-14 text-lg font-semibold"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  Update Payment Status
                  <ArrowRight className="h-5 w-5" />
                </div>
              </GradientButton>
              
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full h-12 border-2 text-base hover:bg-gray-50 dark:hover:bg-slate-800"
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
