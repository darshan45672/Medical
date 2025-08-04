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
  Users, 
  Search, 
  Eye, 
  UserCheck,
  FileText,
  Calendar,
  Phone,
  Mail,
  User,
  ChevronLeft,
  SlidersHorizontal,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { UserRole } from '@/types'

interface UserClaim {
  id: string
  claimNumber: string
  diagnosis: string
  claimAmount: string
  approvedAmount?: string
  status: string
  createdAt: string
  updatedAt: string
}

interface UserWithClaims {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  role: string
  createdAt: string
  claims: UserClaim[]
  totalClaims: number
  pendingClaims: number
  approvedClaims: number
  rejectedClaims: number
  totalClaimAmount: number
  totalApprovedAmount: number
}

interface UserDetailsModalProps {
  user: UserWithClaims | null
  isOpen: boolean
  onClose: () => void
}

function UserDetailsModal({ user, isOpen, onClose }: UserDetailsModalProps) {
  if (!isOpen || !user) return null

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'UNDER_REVIEW':
        return <AlertCircle className="h-4 w-4" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      case 'PAID':
        return <CreditCard className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {user.name} - Claims Details
          </h2>
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <XCircle className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* User Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              User Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member Since:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(user.createdAt)}</span>
                </div>
              </div>
              {user.address && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{user.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Claims Statistics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Claims Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user.totalClaims}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Claims</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{user.pendingClaims}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{user.approvedClaims}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{user.rejectedClaims}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              Financial Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Claim Amount</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(user.totalClaimAmount)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Approved Amount</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(user.totalApprovedAmount)}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Claims List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              All Claims ({user.claims.length})
            </h3>
            {user.claims.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No claims found for this user.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {user.claims.map((claim) => (
                  <Card key={claim.id} className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              Claim #{claim.claimNumber}
                            </h4>
                            <Badge className={`${getStatusBadgeColor(claim.status)} flex items-center gap-1`}>
                              {getStatusIcon(claim.status)}
                              {claim.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <strong>Diagnosis:</strong> {claim.diagnosis}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              <strong>Claimed:</strong> {formatCurrency(parseFloat(claim.claimAmount))}
                            </span>
                            {claim.approvedAmount && (
                              <span>
                                <strong>Approved:</strong> {formatCurrency(parseFloat(claim.approvedAmount))}
                              </span>
                            )}
                            <span>
                              <strong>Date:</strong> {formatDate(claim.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ManageUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserWithClaims[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithClaims[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('latest')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithClaims | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user?.role !== UserRole.INSURANCE) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users?with_claims=true')
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      
      // Transform the data to include claims statistics
      const usersWithStats: UserWithClaims[] = data.users.map((user: any) => {
        const claims = user.patientClaims || []
        const pendingClaims = claims.filter((c: any) => c.status === 'PENDING' || c.status === 'UNDER_REVIEW').length
        const approvedClaims = claims.filter((c: any) => c.status === 'APPROVED' || c.status === 'PAID').length
        const rejectedClaims = claims.filter((c: any) => c.status === 'REJECTED').length
        const totalClaimAmount = claims.reduce((sum: number, claim: any) => sum + parseFloat(claim.claimAmount || '0'), 0)
        const totalApprovedAmount = claims.reduce((sum: number, claim: any) => {
          if (claim.status === 'APPROVED' || claim.status === 'PAID') {
            return sum + parseFloat(claim.approvedAmount || claim.claimAmount || '0')
          }
          return sum
        }, 0)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          createdAt: user.createdAt,
          claims: claims,
          totalClaims: claims.length,
          pendingClaims,
          approvedClaims,
          rejectedClaims,
          totalClaimAmount,
          totalApprovedAmount
        }
      })
      
      setUsers(usersWithStats)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Filter and sort effect
  useEffect(() => {
    let filtered = [...users]

    // Status filter - filter by users who have claims with specific status
    if (statusFilter !== 'all') {
      if (statusFilter === 'with_claims') {
        filtered = filtered.filter(user => user.totalClaims > 0)
      } else if (statusFilter === 'no_claims') {
        filtered = filtered.filter(user => user.totalClaims === 0)
      } else if (statusFilter === 'pending_claims') {
        filtered = filtered.filter(user => user.pendingClaims > 0)
      } else if (statusFilter === 'approved_claims') {
        filtered = filtered.filter(user => user.approvedClaims > 0)
      }
    }

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      
      filtered = filtered.filter(user => {
        const nameMatch = user.name?.toLowerCase().includes(term) || false
        const emailMatch = user.email?.toLowerCase().includes(term) || false
        const phoneMatch = user.phone?.toLowerCase().includes(term) || false
        
        return nameMatch || emailMatch || phoneMatch
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'email':
          return a.email.localeCompare(b.email)
        case 'claims_count':
          return b.totalClaims - a.totalClaims
        case 'claim_amount':
          return b.totalClaimAmount - a.totalClaimAmount
        case 'approved_amount':
          return b.totalApprovedAmount - a.totalApprovedAmount
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'latest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter, sortBy])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleViewDetails = (user: UserWithClaims) => {
    setSelectedUser(user)
    setShowUserDetails(true)
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
                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                Manage Users
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                View and manage all users who have applied for claims
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
              <Button onClick={fetchUsers} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <Search className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Users</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{users.length}</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Users with Claims</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {users.filter(user => user.totalClaims > 0).length}
                  </p>
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
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Claims</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {users.reduce((sum, user) => sum + user.totalClaims, 0)}
                  </p>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(users.reduce((sum, user) => sum + user.totalClaimAmount, 0))}
                  </p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
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
                      placeholder="Search by name, email, or phone..."
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
                    Filter by Claims
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="with_claims">Users with Claims</SelectItem>
                      <SelectItem value="no_claims">Users without Claims</SelectItem>
                      <SelectItem value="pending_claims">Users with Pending Claims</SelectItem>
                      <SelectItem value="approved_claims">Users with Approved Claims</SelectItem>
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
                      <SelectItem value="email">Email (A-Z)</SelectItem>
                      <SelectItem value="claims_count">Most Claims</SelectItem>
                      <SelectItem value="claim_amount">Highest Claim Amount</SelectItem>
                      <SelectItem value="approved_amount">Highest Approved Amount</SelectItem>
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
                Showing {filteredUsers.length} of {users.length} users
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

            {/* Users Grid */}
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {users.length === 0 
                      ? "There are no users to display at this time."
                      : "Try adjusting your search or filter criteria."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                            <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            {user.name}
                          </CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Member since {formatDate(user.createdAt)}
                          </p>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                          {user.role}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        
                        {/* Claims Summary */}
                        <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{user.totalClaims}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Total Claims</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(user.totalClaimAmount)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Claim Amount</p>
                            </div>
                          </div>
                          
                          {user.totalClaims > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                              <div>
                                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{user.pendingClaims}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">{user.approvedClaims}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Approved</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-red-600 dark:text-red-400">{user.rejectedClaims}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Rejected</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        <div className="pt-4">
                          <Button
                            onClick={() => handleViewDetails(user)}
                            className="w-full flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
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

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showUserDetails}
        onClose={() => {
          setShowUserDetails(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}
