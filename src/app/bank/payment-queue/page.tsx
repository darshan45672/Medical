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
import { EnhancedActionButton } from '@/components/ui/enhanced-action-button'
import { PaymentManagementModal } from '@/components/ui/payment-management-modal'
import { usePayments } from '@/hooks/use-payments'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  Clock, 
  CreditCard,
  SortAsc,
  SortDesc,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface PaymentQueueFilters {
  search: string
  status: string
  sortBy: 'amount' | 'createdAt' | 'patient'
  sortOrder: 'asc' | 'desc'
  dateRange: 'today' | 'week' | 'month' | 'all'
}

export default function PaymentQueuePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { payments: paymentsData, isLoading, error, refetch } = usePayments()
  
  const [filters, setFilters] = useState<PaymentQueueFilters>({
    search: '',
    status: 'PROCESSING',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    dateRange: 'all'
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
      toast.success('Payment queue refreshed')
    } catch {
      toast.error('Failed to refresh payment queue')
    } finally {
      setIsRefreshing(false)
    }
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

  // Filter and sort payments
  const filteredPayments = (Array.isArray(paymentsData) ? paymentsData : [])
    .filter((payment: any) => {
      // Status filter
      if (filters.status && filters.status !== 'all' && payment.status !== filters.status) {
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
        const paymentDate = new Date(payment.createdAt)
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
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * modifier
      }
    })

  const selectedPayment = selectedPaymentId 
    ? (Array.isArray(paymentsData) ? paymentsData : []).find((p: any) => p.id === selectedPaymentId) 
    : null

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
                Payment Queue
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage and process pending payments
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Processing</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {(Array.isArray(paymentsData) ? paymentsData : []).filter((p: any) => p.status === 'PROCESSING').length || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Pending</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {(Array.isArray(paymentsData) ? paymentsData : []).filter((p: any) => p.status === 'PENDING').length || 0}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed Today</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {(Array.isArray(paymentsData) ? paymentsData : []).filter((p: any) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const paymentDate = new Date(p.processedAt || p.updatedAt)
                      return p.status === 'COMPLETED' && paymentDate >= today
                    }).length || 0}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Failed</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {(Array.isArray(paymentsData) ? paymentsData : []).filter((p: any) => p.status === 'FAILED').length || 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
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
              Filter and search through payment queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient, claim ID, or transaction ID..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <div className="flex gap-2">
                <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
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

        {/* Payment Queue Table */}
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Queue ({filteredPayments.length})
              </div>
              <div className="text-sm text-gray-500">
                Total Value: {formatCurrency(
                  filteredPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Manage individual payments in the processing queue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading payment queue..." />
              </div>
            ) : error ? (
              <div className="text-center py-12 px-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Payments</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="relative mx-auto w-32 h-32 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full shadow-lg"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-blue-200 to-indigo-200 dark:from-blue-800/50 dark:to-indigo-800/50 rounded-full flex items-center justify-center">
                    <CreditCard className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Payments Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  No payments match your current filters. Try adjusting the search criteria or date range.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                    <TableRow className="border-gray-200 dark:border-slate-600">
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Payment ID</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Patient</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Claim</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Amount</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Status</TableHead>
                      <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold">Created</TableHead>
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
                          {payment.id.substring(0, 8)}...
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
                        <TableCell>
                          <PaymentStatusBadge status={payment.status} size="sm" />
                        </TableCell>
                        <TableCell className="text-gray-700 dark:text-gray-200 text-sm">
                          {formatDate(payment.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <EnhancedActionButton
                            action="manage"
                            size="sm"
                            onClick={() => {
                              setSelectedPaymentId(payment.id)
                              setIsPaymentModalOpen(true)
                            }}
                          />
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

      {/* Payment Management Modal */}
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
