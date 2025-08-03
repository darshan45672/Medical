'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { StatusBadge } from '@/components/ui/status-badge'
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  DollarSign,
  User,
  Clock,
  CheckCircle,
  SlidersHorizontal,
  Eye,
  Download,
  RefreshCw,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ClaimStatus, UserRole } from '@/types'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface InsuranceClaim {
  id: string
  claimNumber: string
  diagnosis: string
  description?: string
  treatmentDate: string
  claimAmount: string
  approvedAmount?: string
  status: string
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  paidAt?: string
  rejectionReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
  patient: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
  }
  doctor?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  documents: Array<{
    id: string
    type: string
    filename: string
    originalName: string
    url: string
  }>
  claimReports: Array<{
    id: string
    report: {
      id: string
      reportType: string
      title: string
      description: string
      documentUrl?: string
    }
  }>
}

export default function InsuranceClaimsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [claims, setClaims] = useState<InsuranceClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [amountFilter, setAmountFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status' | 'patient'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.role === UserRole.INSURANCE) {
      fetchClaims()
    }
  }, [session])

  const fetchClaims = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/claims')
      if (response.ok) {
        const data = await response.json()
        // Filter out draft claims
        const nonDraftClaims = (data.claims || []).filter((claim: InsuranceClaim) => claim.status !== 'DRAFT')
        setClaims(nonDraftClaims)
      } else {
        console.error('Failed to fetch claims')
        toast.error('Failed to fetch claims')
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
      toast.error('Error fetching claims')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchClaims()
      toast.success('Claims refreshed successfully')
    } catch {
      toast.error('Failed to refresh claims')
    } finally {
      setRefreshing(false)
    }
  }

  // Filter and sort claims
  const filteredAndSortedClaims = claims
    .filter(claim => {
      const matchesSearch = 
        claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter

      // Date filter
      let matchesDate = true
      if (dateFilter !== 'all') {
        const claimDate = new Date(claim.createdAt)
        const now = new Date()
        
        switch (dateFilter) {
          case 'today':
            matchesDate = claimDate.toDateString() === now.toDateString()
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = claimDate >= weekAgo
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = claimDate >= monthAgo
            break
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            matchesDate = claimDate >= quarterAgo
            break
        }
      }

      // Amount filter
      let matchesAmount = true
      if (amountFilter !== 'all') {
        const amount = parseFloat(claim.claimAmount)
        
        switch (amountFilter) {
          case 'low':
            matchesAmount = amount < 1000
            break
          case 'medium':
            matchesAmount = amount >= 1000 && amount < 5000
            break
          case 'high':
            matchesAmount = amount >= 5000 && amount < 10000
            break
          case 'very-high':
            matchesAmount = amount >= 10000
            break
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate && matchesAmount
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          break
        case 'amount':
          comparison = parseFloat(b.claimAmount) - parseFloat(a.claimAmount)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'patient':
          comparison = a.patient?.name.localeCompare(b.patient?.name || '') || 0
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'asc' ? -comparison : comparison
    })

  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  const getStatusCounts = () => {
    return {
      all: claims.length,
      [ClaimStatus.SUBMITTED]: claims.filter(c => c.status === ClaimStatus.SUBMITTED).length,
      [ClaimStatus.UNDER_REVIEW]: claims.filter(c => c.status === ClaimStatus.UNDER_REVIEW).length,
      [ClaimStatus.APPROVED]: claims.filter(c => c.status === ClaimStatus.APPROVED).length,
      [ClaimStatus.REJECTED]: claims.filter(c => c.status === ClaimStatus.REJECTED).length,
      [ClaimStatus.PAID]: claims.filter(c => c.status === ClaimStatus.PAID).length,
    }
  }

  const getStatsCards = () => {
    const totalAmount = claims.reduce((sum, claim) => sum + parseFloat(claim.claimAmount), 0)
    const approvedAmount = claims
      .filter(claim => claim.status === ClaimStatus.APPROVED || claim.status === ClaimStatus.PAID)
      .reduce((sum, claim) => sum + parseFloat(claim.approvedAmount || claim.claimAmount), 0)
    const pendingAmount = claims
      .filter(claim => claim.status === ClaimStatus.SUBMITTED || claim.status === ClaimStatus.UNDER_REVIEW)
      .reduce((sum, claim) => sum + parseFloat(claim.claimAmount), 0)

    return { totalAmount, approvedAmount, pendingAmount }
  }

  const handleViewClaimDetails = (claim: InsuranceClaim) => {
    router.push(`/claims/${claim.id}`)
  }

  const statusCounts = getStatusCounts()
  const stats = getStatsCards()

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== UserRole.INSURANCE) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-md group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back to Dashboard</span>
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Insurance Claims Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Review, manage, and process all submitted insurance claims
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredAndSortedClaims.length} of {claims.length} claims
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Claims</CardTitle>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{claims.length}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">All submitted claims</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</CardTitle>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total claim value</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Approved Amount</CardTitle>
              <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.approvedAmount)}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Successfully processed</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Amount</CardTitle>
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(stats.pendingAmount)}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by claim number, patient name, diagnosis, or doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {showFilters && <span className="ml-2 text-blue-600 dark:text-blue-400">•</span>}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400"
                    >
                      <option value="all">All Statuses ({statusCounts.all})</option>
                      <option value={ClaimStatus.SUBMITTED}>Submitted ({statusCounts[ClaimStatus.SUBMITTED]})</option>
                      <option value={ClaimStatus.UNDER_REVIEW}>Under Review ({statusCounts[ClaimStatus.UNDER_REVIEW]})</option>
                      <option value={ClaimStatus.APPROVED}>Approved ({statusCounts[ClaimStatus.APPROVED]})</option>
                      <option value={ClaimStatus.REJECTED}>Rejected ({statusCounts[ClaimStatus.REJECTED]})</option>
                      <option value={ClaimStatus.PAID}>Paid ({statusCounts[ClaimStatus.PAID]})</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Range
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="quarter">Last Quarter</option>
                    </select>
                  </div>

                  {/* Amount Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Claim Amount
                    </label>
                    <select
                      value={amountFilter}
                      onChange={(e) => setAmountFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400"
                    >
                      <option value="all">All Amounts</option>
                      <option value="low">Under $1,000</option>
                      <option value="medium">$1,000 - $4,999</option>
                      <option value="high">$5,000 - $9,999</option>
                      <option value="very-high">$10,000+</option>
                    </select>
                  </div>
                </div>

                {/* Sort Options */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Sort by:</span>
                  {[
                    { key: 'date', label: 'Date', icon: CalendarDays },
                    { key: 'amount', label: 'Amount', icon: DollarSign },
                    { key: 'status', label: 'Status', icon: Activity },
                    { key: 'patient', label: 'Patient', icon: User }
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      onClick={() => handleSortChange(key as typeof sortBy)}
                      variant={sortBy === key ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {label}
                      {sortBy === key && (
                        sortOrder === 'asc' ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claims Table */}
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Claims Overview</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {filteredAndSortedClaims.length === 0 ? 
                'No claims match your current filters' : 
                `Showing ${filteredAndSortedClaims.length} of ${claims.length} claims`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredAndSortedClaims.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No claims found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {claims.length === 0 
                    ? 'No claims have been submitted yet.' 
                    : 'Try adjusting your search terms or filters to find what you\'re looking for.'
                  }
                </p>
                {claims.length > 0 && (
                  <Button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setDateFilter('all')
                      setAmountFilter('all')
                    }}
                    variant="outline"
                    className="border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Claim #</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Patient</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Diagnosis</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Amount</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Submitted</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Doctor</TableHead>
                      <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedClaims.map((claim) => (
                      <TableRow key={claim.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors duration-200">
                        <TableCell className="font-mono text-sm font-medium">{claim.claimNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{claim.patient?.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{claim.patient?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={claim.diagnosis}>
                            {claim.diagnosis}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(parseFloat(claim.claimAmount))}</TableCell>
                        <TableCell>
                          <StatusBadge status={claim.status as ClaimStatus} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(claim.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {claim.doctor?.name || 'N/A'}
                            </span>
                            {claim.doctor?.phone && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {claim.doctor.phone}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleViewClaimDetails(claim)}
                              variant="ghost"
                              className="hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 p-2"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {claim.documents.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 p-2"
                                title="View Documents"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
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
    </div>
  )
}
