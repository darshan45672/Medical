'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { UserRequestDetailsModal } from '@/components/ui/user-request-details-modal'
import { Header } from '@/components/layout/header'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  Users, 
  Search, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Calendar,
  Phone,
  Mail,
  User,
  ChevronLeft,
  SlidersHorizontal
} from 'lucide-react'
import { UserRole } from '@/types'

interface ClaimRequest {
  id: string
  patient: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
  }
  claims: {
    id: string
    claimNumber: string
    diagnosis: string
    claimAmount: string
    status: string
    createdAt: string
    updatedAt: string
  }[]
  totalClaimAmount: number
  latestClaimDate: string
  claimsCount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'
}

export default function ClaimRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ClaimRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('latest')
  const [selectedRequest, setSelectedRequest] = useState<ClaimRequest | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user?.role !== UserRole.INSURANCE) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const determineOverallStatus = (claims: any[]): 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' => {
    const hasUnderReview = claims.some(claim => claim.status === 'UNDER_REVIEW')
    const hasApproved = claims.some(claim => claim.status === 'APPROVED' || claim.status === 'PAID')
    const hasRejected = claims.some(claim => claim.status === 'REJECTED')

    if (hasRejected) return 'REJECTED'
    if (hasUnderReview) return 'UNDER_REVIEW'
    if (hasApproved) return 'APPROVED'
    return 'PENDING'
  }

  const fetchClaimRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users?with_claims=true')
      if (!response.ok) {
        throw new Error('Failed to fetch claim requests')
      }
      
      const data = await response.json()
      
      // Transform the data to group claims by user
      const requests: ClaimRequest[] = data.users
        .filter((user: any) => user.patientClaims && user.patientClaims.length > 0)
        .map((user: any) => {
          const claims = user.patientClaims.filter((claim: any) => claim.status !== 'DRAFT')
          const totalAmount = claims.reduce((sum: number, claim: any) => sum + parseFloat(claim.claimAmount), 0)
          const latestClaim = claims.reduce((latest: any, claim: any) => 
            new Date(claim.createdAt) > new Date(latest.createdAt) ? claim : latest
          )
          
          return {
            id: user.id,
            patient: {
              id: user.id,
              name: user.name || 'Unknown User',
              email: user.email,
              phone: user.phone,
              address: user.address,
            },
            claims,
            totalClaimAmount: totalAmount,
            latestClaimDate: latestClaim.createdAt,
            claimsCount: claims.length,
            status: determineOverallStatus(claims)
          }
        })
      
      setClaimRequests(requests)
    } catch (error) {
      console.error('Error fetching claim requests:', error)
      toast.error('Failed to fetch claim requests')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Filter and sort effect
  useEffect(() => {
    let filtered = [...claimRequests]

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      
      filtered = filtered.filter(request => {
        // Check patient information
        const nameMatch = request.patient.name?.toLowerCase().includes(term) || false
        const emailMatch = request.patient.email?.toLowerCase().includes(term) || false
        const phoneMatch = request.patient.phone?.toLowerCase().includes(term) || false
        
        // Check claims information
        const claimMatch = request.claims?.some((claim: any) => 
          claim.claimNumber?.toLowerCase().includes(term) ||
          claim.diagnosis?.toLowerCase().includes(term)
        ) || false
        
        return nameMatch || emailMatch || phoneMatch || claimMatch
      })
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.patient.name.localeCompare(b.patient.name)
        case 'amount_high':
          return b.totalClaimAmount - a.totalClaimAmount
        case 'amount_low':
          return a.totalClaimAmount - b.totalClaimAmount
        case 'claims_count':
          return b.claimsCount - a.claimsCount
        case 'oldest':
          return new Date(a.latestClaimDate).getTime() - new Date(b.latestClaimDate).getTime()
        case 'latest':
        default:
          return new Date(b.latestClaimDate).getTime() - new Date(a.latestClaimDate).getTime()
      }
    })

    setFilteredRequests(filtered)
  }, [claimRequests, searchTerm, statusFilter, sortBy])

  useEffect(() => {
    fetchClaimRequests()
  }, [fetchClaimRequests])

  const handleViewDetails = (request: ClaimRequest) => {
    setSelectedRequest(request)
    setIsDetailsModalOpen(true)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      case 'UNDER_REVIEW':
        return <Eye className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (!session || session.user.role !== UserRole.INSURANCE) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                Claim Requests
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Review and manage patient claim requests
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button onClick={fetchClaimRequests} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <Search className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{claimRequests.length}</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {claimRequests.filter(r => r.status === 'PENDING').length}
                  </p>
                </div>
                <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Under Review</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {claimRequests.filter(r => r.status === 'UNDER_REVIEW').length}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <Eye className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(claimRequests.reduce((sum, r) => sum + r.totalClaimAmount, 0))}
                  </p>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <Card className="mb-6 border-0 shadow-lg bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Search by name, email, or claim..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status Filter
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="amount_high">Amount (High-Low)</SelectItem>
                      <SelectItem value="amount_low">Amount (Low-High)</SelectItem>
                      <SelectItem value="claims_count">Claims Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredRequests.length} of {claimRequests.length} claim requests
                {searchTerm && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    • Searching for: &quot;{searchTerm}&quot;
                  </span>
                )}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="flex items-center gap-1"
                >
                  <XCircle className="h-4 w-4" />
                  Clear Search
                </Button>
              )}
            </div>

            {/* Claims Grid */}
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No claim requests found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {claimRequests.length === 0 
                      ? "There are no claim requests to display at this time."
                      : "Try adjusting your search or filter criteria."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-md bg-white dark:bg-slate-800 hover:scale-[1.02]">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            {request.patient.name}
                          </CardTitle>
                        </div>
                        <Badge className={`${getStatusBadgeColor(request.status)} flex items-center gap-1`}>
                          {getStatusIcon(request.status)}
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="truncate">{request.patient.email}</span>
                        </div>
                        
                        {request.patient.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span>{request.patient.phone}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span>Latest: {formatDate(request.latestClaimDate)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {request.claimsCount} claim{request.claimsCount !== 1 ? 's' : ''}
                            </span>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(request.totalClaimAmount)}
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => handleViewDetails(request)}
                            className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <UserRequestDetailsModal
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          request={selectedRequest}
          onStatusChange={fetchClaimRequests}
        />
      )}
    </div>
  )
}
