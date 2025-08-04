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
import { Header } from '@/components/layout/header'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { 
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
  SlidersHorizontal,
  AlertTriangle,
  DollarSign
} from 'lucide-react'
import { UserRole } from '@/types'

interface PendingClaim {
  id: string
  claimNumber: string
  diagnosis: string
  claimAmount: string
  status: string
  createdAt: string
  updatedAt: string
  patient: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
  }
}

export default function PendingClaimsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([])
  const [filteredClaims, setFilteredClaims] = useState<PendingClaim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<string>('latest')
  const [showFilters, setShowFilters] = useState(false)
  const [processingClaims, setProcessingClaims] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user?.role !== UserRole.INSURANCE) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchPendingClaims = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/claims?status=SUBMITTED')
      if (!response.ok) {
        throw new Error('Failed to fetch pending claims')
      }
      
      const data = await response.json()
      
      // Transform the data to include patient information
      const claims: PendingClaim[] = data.claims.map((claim: any) => ({
        id: claim.id,
        claimNumber: claim.claimNumber,
        diagnosis: claim.diagnosis,
        claimAmount: claim.claimAmount,
        status: claim.status,
        createdAt: claim.createdAt,
        updatedAt: claim.updatedAt,
        patient: {
          id: claim.patient?.id || '',
          name: claim.patient?.name || 'Unknown Patient',
          email: claim.patient?.email || '',
          phone: claim.patient?.phone || '',
          address: claim.patient?.address || '',
        }
      }))
      
      setPendingClaims(claims)
    } catch (error) {
      console.error('Error fetching pending claims:', error)
      toast.error('Failed to fetch pending claims')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Filter and sort effect
  useEffect(() => {
    let filtered = [...pendingClaims]

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      
      filtered = filtered.filter(claim => {
        // Check patient information
        const nameMatch = claim.patient.name?.toLowerCase().includes(term) || false
        const emailMatch = claim.patient.email?.toLowerCase().includes(term) || false
        const phoneMatch = claim.patient.phone?.toLowerCase().includes(term) || false
        
        // Check claim information
        const claimNumberMatch = claim.claimNumber?.toLowerCase().includes(term) || false
        const diagnosisMatch = claim.diagnosis?.toLowerCase().includes(term) || false
        
        return nameMatch || emailMatch || phoneMatch || claimNumberMatch || diagnosisMatch
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'patient_name':
          return a.patient.name.localeCompare(b.patient.name)
        case 'amount_high':
          return parseFloat(b.claimAmount) - parseFloat(a.claimAmount)
        case 'amount_low':
          return parseFloat(a.claimAmount) - parseFloat(b.claimAmount)
        case 'claim_number':
          return a.claimNumber.localeCompare(b.claimNumber)
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'latest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    setFilteredClaims(filtered)
  }, [pendingClaims, searchTerm, sortBy])

  useEffect(() => {
    fetchPendingClaims()
  }, [fetchPendingClaims])

  const handleClaimAction = async (claimId: string, action: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED') => {
    try {
      setProcessingClaims(prev => new Set([...prev, claimId]))
      
      const response = await fetch(`/api/claims/${claimId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action }),
      })

      if (!response.ok) {
        throw new Error('Failed to update claim status')
      }

      toast.success(`Claim ${action.toLowerCase().replace('_', ' ')} successfully`)
      
      // Remove the claim from the list if it's no longer pending
      if (action !== 'UNDER_REVIEW') {
        setPendingClaims(prev => prev.filter(claim => claim.id !== claimId))
      } else {
        // Update the status in the local state
        setPendingClaims(prev => prev.map(claim => 
          claim.id === claimId ? { ...claim, status: action } : claim
        ))
      }
    } catch (error) {
      console.error('Error updating claim status:', error)
      toast.error('Failed to update claim status')
    } finally {
      setProcessingClaims(prev => {
        const newSet = new Set(prev)
        newSet.delete(claimId)
        return newSet
      })
    }
  }

  const getActionButtonConfig = (action: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED') => {
    switch (action) {
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          icon: <Eye className="h-4 w-4" />,
          className: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
        }
      case 'APPROVED':
        return {
          label: 'Approve',
          icon: <CheckCircle className="h-4 w-4" />,
          className: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
        }
      case 'REJECTED':
        return {
          label: 'Reject',
          icon: <XCircle className="h-4 w-4" />,
          className: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
        }
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
                <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                Pending Claims Review
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Review and process pending insurance claims
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
              <Button onClick={fetchPendingClaims} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <Search className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingClaims.length}</p>
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
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(pendingClaims.reduce((sum, claim) => sum + parseFloat(claim.claimAmount), 0))}
                  </p>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtered Results</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredClaims.length}</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <Card className="mb-6 border-0 shadow-lg bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      placeholder="Search by patient, claim number, or diagnosis..."
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
                    Sort By
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="patient_name">Patient Name (A-Z)</SelectItem>
                      <SelectItem value="amount_high">Amount (High-Low)</SelectItem>
                      <SelectItem value="amount_low">Amount (Low-High)</SelectItem>
                      <SelectItem value="claim_number">Claim Number</SelectItem>
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
                Showing {filteredClaims.length} of {pendingClaims.length} pending claims
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
            {filteredClaims.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No pending claims found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {pendingClaims.length === 0 
                      ? "There are no pending claims to review at this time."
                      : "Try adjusting your search criteria."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClaims.map((claim) => (
                  <Card key={claim.id} className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            {claim.patient.name}
                          </CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Claim #{claim.claimNumber}
                          </p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="truncate">{claim.patient.email}</span>
                        </div>
                        
                        {claim.patient.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span>{claim.patient.phone}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span>Submitted: {formatDate(claim.createdAt)}</span>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnosis</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{claim.diagnosis}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Claim Amount</span>
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(parseFloat(claim.claimAmount))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2 pt-4">
                          {(['UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const).map((action) => {
                            const config = getActionButtonConfig(action)
                            const isProcessing = processingClaims.has(claim.id)
                            
                            return (
                              <Button
                                key={action}
                                size="sm"
                                onClick={() => handleClaimAction(claim.id, action)}
                                disabled={isProcessing}
                                className={`flex items-center gap-1 text-xs ${config.className} shadow-sm hover:shadow-md transition-all duration-200`}
                              >
                                {isProcessing ? (
                                  <LoadingSpinner />
                                ) : (
                                  config.icon
                                )}
                                {config.label}
                              </Button>
                            )
                          })}
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
    </div>
  )
}
