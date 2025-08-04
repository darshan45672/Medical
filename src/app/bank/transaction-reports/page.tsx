'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EnhancedLoadingSpinner } from '@/components/ui/enhanced-loading-spinner'
import { usePayments } from '@/hooks/use-payments'
import { useClaims } from '@/hooks/use-claims'
import { 
  ArrowLeft, 
  RefreshCw, 
  BarChart3, 
  PieChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface ReportFilters {
  period: 'week' | 'month' | 'quarter' | 'year' | 'custom'
  reportType: 'summary' | 'detailed' | 'trends' | 'performance'
}

export default function TransactionReportsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { payments: paymentsData, isLoading: isLoadingPayments, error: paymentsError, refetch: refetchPayments } = usePayments()
  const { data: claimsData, isLoading: isLoadingClaims, error: claimsError, refetch: refetchClaims } = useClaims()
  
  const [filters, setFilters] = useState<ReportFilters>({
    period: 'month',
    reportType: 'summary'
  })
  
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
      await Promise.all([refetchPayments(), refetchClaims()])
      toast.success('Reports data refreshed')
    } catch {
      toast.error('Failed to refresh reports data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExportReport = () => {
    // Implementation for exporting reports
    toast.info('Export functionality coming soon')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date()
    const ranges = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      custom: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Default to month
    }
    return ranges[filters.period]
  }

  // Filter data based on selected period
  const dateRange = getDateRange()
  const filteredPayments = paymentsData?.filter((payment: any) => 
    new Date(payment.createdAt) >= dateRange
  ) || []

  const filteredClaims = (Array.isArray(claimsData) ? claimsData : [])?.filter((claim: any) => 
    new Date(claim.createdAt) >= dateRange
  ) || []

  // Calculate summary statistics
  const totalTransactions = filteredPayments.length
  const totalAmount = filteredPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
  const completedTransactions = filteredPayments.filter((p: any) => p.status === 'COMPLETED')
  const failedTransactions = filteredPayments.filter((p: any) => p.status === 'FAILED')
  const processingTransactions = filteredPayments.filter((p: any) => p.status === 'PROCESSING')
  
  const successRate = totalTransactions > 0 ? (completedTransactions.length / totalTransactions) * 100 : 0
  const averageTransactionAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0
  const totalCompletedAmount = completedTransactions.reduce((sum: number, payment: any) => sum + payment.amount, 0)

  // Payment method breakdown
  const paymentMethodStats = filteredPayments.reduce((acc: any, payment: any) => {
    const method = payment.paymentMethod || 'Unknown'
    if (!acc[method]) {
      acc[method] = { count: 0, amount: 0 }
    }
    acc[method].count++
    acc[method].amount += payment.amount
    return acc
  }, {})

  // Status breakdown
  const statusStats = {
    COMPLETED: completedTransactions.length,
    FAILED: failedTransactions.length,
    PROCESSING: processingTransactions.length,
    PENDING: filteredPayments.filter((p: any) => p.status === 'PENDING').length,
    CANCELLED: filteredPayments.filter((p: any) => p.status === 'CANCELLED').length,
    REFUNDED: filteredPayments.filter((p: any) => p.status === 'REFUNDED').length,
  }

  // Claims processing stats
  const approvedClaims = filteredClaims.filter((c: any) => c.status === 'APPROVED')
  const rejectedClaims = filteredClaims.filter((c: any) => c.status === 'REJECTED')
  const claimApprovalRate = filteredClaims.length > 0 ? (approvedClaims.length / filteredClaims.length) * 100 : 0
  const averageClaimAmount = filteredClaims.length > 0 
    ? filteredClaims.reduce((sum: number, claim: any) => sum + parseFloat(claim.claimAmount), 0) / filteredClaims.length 
    : 0

  if (!session || session.user.role !== 'BANK') {
    return null
  }

  const isLoading = isLoadingPayments || isLoadingClaims
  const error = paymentsError || claimsError

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
                Transaction Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Comprehensive analytics and reporting dashboard
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleExportReport}
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

        {/* Report Filters */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>
              Configure report parameters and time periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Time Period
                </label>
                <Select value={filters.period} onValueChange={(value) => setFilters({ ...filters, period: value as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                    <SelectItem value="year">Last 365 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Report Type
                </label>
                <Select value={filters.reportType} onValueChange={(value) => setFilters({ ...filters, reportType: value as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary Overview</SelectItem>
                    <SelectItem value="detailed">Detailed Analysis</SelectItem>
                    <SelectItem value="trends">Trend Analysis</SelectItem>
                    <SelectItem value="performance">Performance Metrics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {totalTransactions.toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Last {filters.period}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Value</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Completed: {formatCurrency(totalCompletedAmount)}
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
                    {formatPercentage(successRate)}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    {completedTransactions.length} completed
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg Transaction</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {formatCurrency(averageTransactionAmount)}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    Per transaction
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content based on report type */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading report data..." />
          </div>
        ) : error ? (
          <div className="text-center py-12 px-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{typeof error === 'string' ? error : error?.message || 'Unknown error occurred'}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Status Breakdown */}
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Payment Status Breakdown
                </CardTitle>
                <CardDescription>Distribution of payment statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(statusStats).map(([status, count]) => {
                    const percentage = totalTransactions > 0 ? (count / totalTransactions) * 100 : 0
                    const statusConfig = {
                      COMPLETED: { color: 'bg-green-500', icon: CheckCircle2, textColor: 'text-green-700 dark:text-green-300' },
                      FAILED: { color: 'bg-red-500', icon: XCircle, textColor: 'text-red-700 dark:text-red-300' },
                      PROCESSING: { color: 'bg-amber-500', icon: Clock, textColor: 'text-amber-700 dark:text-amber-300' },
                      PENDING: { color: 'bg-blue-500', icon: Clock, textColor: 'text-blue-700 dark:text-blue-300' },
                      CANCELLED: { color: 'bg-gray-500', icon: XCircle, textColor: 'text-gray-700 dark:text-gray-300' },
                      REFUNDED: { color: 'bg-purple-500', icon: TrendingDown, textColor: 'text-purple-700 dark:text-purple-300' },
                    }
                    const config = statusConfig[status as keyof typeof statusConfig]
                    const Icon = config.icon

                    return (
                      <div key={status} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${config.textColor}`} />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{status}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                            <div 
                              className={`${config.color} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16 text-right">
                            {count} ({formatPercentage(percentage)})
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods Analysis */}
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>Breakdown by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(paymentMethodStats).map(([method, stats]: [string, any]) => {
                    const percentage = totalTransactions > 0 ? (stats.count / totalTransactions) * 100 : 0
                    return (
                      <div key={method} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{method}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {stats.count} transactions
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatPercentage(percentage)} of total
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(stats.amount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Claims Processing Metrics */}
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Claims Processing
                </CardTitle>
                <CardDescription>Claims approval and processing metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {approvedClaims.length}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">Approved Claims</p>
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {rejectedClaims.length}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">Rejected Claims</p>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {formatPercentage(claimApprovalRate)}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Approval Rate</p>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {formatCurrency(averageClaimAmount)}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Avg Claim Value</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Performance Summary
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Processing Time</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">~2.5 hours avg</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Daily Transaction Volume</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {Math.round(totalTransactions / (filters.period === 'week' ? 7 : filters.period === 'month' ? 30 : filters.period === 'quarter' ? 90 : 365))} per day
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Peak Processing Hours</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">10 AM - 2 PM</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">System Uptime</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">99.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
