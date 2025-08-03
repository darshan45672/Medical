'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Banknote,
  SlidersHorizontal,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ClaimStatus, UserRole } from '@/types'
import { toast } from 'sonner'

interface PatientClaim {
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
  createdAt: string
  doctor?: {
    id: string
    name: string
    specialization?: string
  }
  documents: Array<{
    id: string
    type: string
    filename: string
    originalName: string
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

export default function ClaimsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [claims, setClaims] = useState<PatientClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.role === UserRole.PATIENT) {
      fetchClaims()
    }
  }, [session])

  const fetchClaims = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/claims')
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims || [])
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

  // Filter and sort claims
  const filteredAndSortedClaims = claims
    .filter(claim => {
      const matchesSearch = 
        claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter
      
      return matchesSearch && matchesStatus
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
        default:
          comparison = 0
      }
      
      return sortOrder === 'asc' ? -comparison : comparison
    })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ClaimStatus.DRAFT:
        return <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:bg-gray-950/30">
          <FileText className="h-3 w-3 mr-1" />
          Draft
        </Badge>
      case ClaimStatus.SUBMITTED:
        return <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:bg-blue-950/30">
          <Clock className="h-3 w-3 mr-1" />
          Submitted
        </Badge>
      case ClaimStatus.UNDER_REVIEW:
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:bg-yellow-950/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Under Review
        </Badge>
      case ClaimStatus.APPROVED:
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-400 dark:bg-green-950/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      case ClaimStatus.REJECTED:
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 dark:border-red-600 dark:text-red-400 dark:bg-red-950/30">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      case ClaimStatus.PAID:
        return <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/30">
          <Banknote className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleFilterClick = (status: string) => {
    setStatusFilter(statusFilter === status ? 'all' : status)
  }

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
      [ClaimStatus.DRAFT]: claims.filter(c => c.status === ClaimStatus.DRAFT).length,
      [ClaimStatus.SUBMITTED]: claims.filter(c => c.status === ClaimStatus.SUBMITTED).length,
      [ClaimStatus.UNDER_REVIEW]: claims.filter(c => c.status === ClaimStatus.UNDER_REVIEW).length,
      [ClaimStatus.APPROVED]: claims.filter(c => c.status === ClaimStatus.APPROVED).length,
      [ClaimStatus.REJECTED]: claims.filter(c => c.status === ClaimStatus.REJECTED).length,
      [ClaimStatus.PAID]: claims.filter(c => c.status === ClaimStatus.PAID).length,
    }
  }

  const statusCounts = getStatusCounts()

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== UserRole.PATIENT) {
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
                My Claims
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage and track all your insurance claims
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredAndSortedClaims.length} of {claims.length} claims
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg mb-8">
          <CardContent className="p-6">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by claim number, diagnosis, doctor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>

            {/* Status Filters */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleFilterClick('all')}
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    statusFilter === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                      : 'hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  All Claims ({statusCounts.all})
                </Button>
                <Button
                  onClick={() => handleFilterClick(ClaimStatus.DRAFT)}
                  variant={statusFilter === ClaimStatus.DRAFT ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    statusFilter === ClaimStatus.DRAFT
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-lg'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-950/20 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Draft ({statusCounts[ClaimStatus.DRAFT]})
                </Button>
                <Button
                  onClick={() => handleFilterClick(ClaimStatus.SUBMITTED)}
                  variant={statusFilter === ClaimStatus.SUBMITTED ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    statusFilter === ClaimStatus.SUBMITTED
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg'
                      : 'hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  Submitted ({statusCounts[ClaimStatus.SUBMITTED]})
                </Button>
                <Button
                  onClick={() => handleFilterClick(ClaimStatus.UNDER_REVIEW)}
                  variant={statusFilter === ClaimStatus.UNDER_REVIEW ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    statusFilter === ClaimStatus.UNDER_REVIEW
                      ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 shadow-lg'
                      : 'hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:border-yellow-300 dark:hover:border-yellow-600'
                  }`}
                >
                  Under Review ({statusCounts[ClaimStatus.UNDER_REVIEW]})
                </Button>
                <Button
                  onClick={() => handleFilterClick(ClaimStatus.APPROVED)}
                  variant={statusFilter === ClaimStatus.APPROVED ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    statusFilter === ClaimStatus.APPROVED
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg'
                      : 'hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300 dark:hover:border-green-600'
                  }`}
                >
                  Approved ({statusCounts[ClaimStatus.APPROVED]})
                </Button>
                <Button
                  onClick={() => handleFilterClick(ClaimStatus.REJECTED)}
                  variant={statusFilter === ClaimStatus.REJECTED ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    statusFilter === ClaimStatus.REJECTED
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg'
                      : 'hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-600'
                  }`}
                >
                  Rejected ({statusCounts[ClaimStatus.REJECTED]})
                </Button>
                <Button
                  onClick={() => handleFilterClick(ClaimStatus.PAID)}
                  variant={statusFilter === ClaimStatus.PAID ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    statusFilter === ClaimStatus.PAID
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg'
                      : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-600'
                  }`}
                >
                  Paid ({statusCounts[ClaimStatus.PAID]})
                </Button>
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleSortChange('date')}
                  variant={sortBy === 'date' ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    sortBy === 'date'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg'
                      : 'hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-600'
                  }`}
                >
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  onClick={() => handleSortChange('amount')}
                  variant={sortBy === 'amount' ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    sortBy === 'amount'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg'
                      : 'hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-600'
                  }`}
                >
                  Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  onClick={() => handleSortChange('status')}
                  variant={sortBy === 'status' ? 'default' : 'outline'}
                  size="sm"
                  className={`transition-all duration-300 hover:scale-105 ${
                    sortBy === 'status'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg'
                      : 'hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 dark:hover:border-purple-600'
                  }`}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claims List */}
        {filteredAndSortedClaims.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="text-center py-12">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {claims.length === 0 ? 'No claims found' : 'No claims match your filters'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {claims.length === 0 
                  ? "You haven't submitted any claims yet." 
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {claims.length === 0 && (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Your First Claim
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedClaims.map((claim) => (
              <Card key={claim.id} className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg font-mono">
                        {claim.claimNumber}
                      </h3>
                      {claim.doctor && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          Dr. {claim.doctor.name}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(claim.status)}
                  </div>

                  {/* Diagnosis */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {claim.diagnosis}
                    </h4>
                    {claim.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {claim.description}
                      </p>
                    )}
                  </div>

                  {/* Amount Info */}
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Claim Amount</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(parseFloat(claim.claimAmount))}
                      </span>
                    </div>
                    {claim.approvedAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Approved Amount</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(parseFloat(claim.approvedAmount))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Treatment: {formatDate(claim.treatmentDate)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Created: {formatDate(claim.createdAt)}</span>
                    </div>
                  </div>

                  {/* Reports and Documents Count */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>{claim.claimReports.length} Reports</span>
                    <span>{claim.documents.length} Documents</span>
                  </div>

                  {/* View Details Button */}
                  <Link href={`/claims/${claim.id}`} className="block">
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-all duration-300"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
