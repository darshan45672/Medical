'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EnhancedLoadingSpinner } from '@/components/ui/enhanced-loading-spinner'
import { PaymentStatusBadge } from '@/components/ui/payment-status-badge'
import { PaymentManagementModal } from '@/components/ui/payment-management-modal'
import { usePayments } from '@/hooks/use-payments'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  History, 
  SortAsc,
  SortDesc,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface PaymentHistoryFilters {
  search: string
  status: string
  sortBy: 'amount' | 'processedAt' | 'patient' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'
  paymentMethod: string
}

export default function PaymentHistoryPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { payments: paymentsData, isLoading, error, refetch } = usePayments()
  
  const [filters, setFilters] = useState<PaymentHistoryFilters>({
    search: '',
    status: 'all',
    sortBy: 'processedAt',
    sortOrder: 'desc',
    dateRange: 'all',
    paymentMethod: 'all'
  })
  
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Redirect if not bank user
  useEffect(() => {
    if (session && session.user.role !== 'BANK') {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Payment history refreshed')
    } catch {
      toast.error('Failed to refresh payment history')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportHistory = () => {
    // Implementation for exporting payment history
    toast.info('Export functionality coming soon')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  // Filter and sort payments - focus on completed/processed payments
  const filteredPayments = (Array.isArray(paymentsData) ? paymentsData : [])
    .filter((payment: any) => {
      // Show only processed payments (not pending or processing)
      if (!['COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(payment.status)) {
        return false
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && payment.status !== filters.status) {
        return false
      }

      // Payment method filter
      if (filters.paymentMethod && filters.paymentMethod !== 'all' && payment.paymentMethod !== filters.paymentMethod) {
        return false
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const patientName = payment.claim?.patient?.name?.toLowerCase() || ''
        const claimId = payment.claimId.toLowerCase()
        const transactionId = payment.transactionId?.toLowerCase() || ''
        
        if (!patientName.includes(searchLower) && 
            !claimId.includes(searchLower) && 
            !transactionId.includes(searchLower)) {
          return false
        }
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const paymentDate = new Date(payment.processedAt || payment.updatedAt)
        const now = new Date()
        
        switch (filters.dateRange) {
          case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            if (paymentDate < today) return false
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            if (paymentDate < weekAgo) return false
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            if (paymentDate < monthAgo) return false
            break
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            if (paymentDate < quarterAgo) return false
            break
          case 'year':
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            if (paymentDate < yearAgo) return false
            break
        }
      }

      return true
    })
    .sort((a: any, b: any) => {
      const modifier = filters.sortOrder === 'asc' ? 1 : -1
      
      switch (filters.sortBy) {
        case 'amount':
          return (a.amount - b.amount) * modifier
        case 'patient':
          const nameA = a.claim?.patient?.name || ''
          const nameB = b.claim?.patient?.name || ''
          return nameA.localeCompare(nameB) * modifier
        case 'processedAt':
          const dateA = new Date(a.processedAt || a.updatedAt).getTime()
          const dateB = new Date(b.processedAt || b.updatedAt).getTime()
          return (dateA - dateB) * modifier
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * modifier
      }
    })

  const selectedPayment = selectedPaymentId 
    ? (Array.isArray(paymentsData) ? paymentsData : []).find((p: any) => p.id === selectedPaymentId) 
    : null

  // Calculate summary statistics
  const totalTransactions = filteredPayments.length
  const totalAmount = filteredPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
  const successfulTransactions = filteredPayments.filter((p: any) => p.status === 'COMPLETED').length
  const failedTransactions = filteredPayments.filter((p: any) => p.status === 'FAILED').length
  const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0

  if (!session || session.user.role !== 'BANK') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2 border-gray-300 dark:border-slate-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Payment History
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Complete transaction history and payment records
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleExportHistory}
              variant="outline"
              className="border-gray-300 dark:border-slate-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {totalTransactions.toLocaleString()}
                  </p>
                </div>
                <History className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Amount</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Success Rate</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {successRate.toFixed(1)}%
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Failed Payments</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {failedTransactions}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter and search through payment history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search payments..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Method Filter */}
              <Select value={filters.paymentMethod} onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CARD">Card Payment</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <div className="flex gap-2">
                <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processedAt">Date Processed</SelectItem>
                    <SelectItem value="createdAt">Date Created</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="patient">Patient Name</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFilters({ 
                    ...filters, 
                    sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                  })}
                >
                  {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History Table */}
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payment History ({filteredPayments.length})
              </div>
              <div className="text-sm text-gray-500">
                Filtered Total: {formatCurrency(totalAmount)}
              </div>
            </CardTitle>
            <CardDescription>
              Complete history of processed payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading payment history..." />
              </div>
            ) : error ? (
              <div className="text-center py-12 px-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading History</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="relative mx-auto w-32 h-32 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 rounded-full shadow-lg"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-gray-200 to-slate-200 dark:from-gray-800/50 dark:to-slate-800/50 rounded-full flex items-center justify-center">
                    <History className="h-12 w-12 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Payment History</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  No processed payments match your current filters. Try adjusting the search criteria or date range.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                    <TableRow className="border-gray-200 dark:border-slate-600">
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Transaction ID</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Patient</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Claim</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Amount</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Method</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Status</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Processed</TableHead>
                      <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment: any, index: number) => (
                      <TableRow 
                        key={payment.id} 
                        className={`border-gray-200 dark:border-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-800/50'
                        }`}
                      >
                        <TableCell className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                          {payment.transactionId || payment.id.substring(0, 8) + '...'}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200 font-medium">
                          {payment.claim?.patient?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-gray-700 dark:text-gray-200">
                          {payment.claim?.claimNumber || payment.claimId.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200 font-semibold">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200">
                          {payment.paymentMethod || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={payment.status} size="sm" />
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200 text-sm">
                          {formatDate(payment.processedAt || payment.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPaymentId(payment.id)
                                setIsPaymentModalOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <PaymentManagementModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          payment={selectedPayment}
          onPaymentUpdate={() => {
            refetch()
            setSelectedPaymentId(null)
          }}
        />
      )}
    </div>
  )
}
