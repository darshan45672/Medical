'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Header } from '@/components/layout/header'
import { useClaims } from '@/hooks/use-claims'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  FileText, 
  Plus, 
  Users, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  CalendarCheck
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: claimsData, isLoading } = useClaims({ limit: 10 })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <Header />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const claims = claimsData?.claims || []

  // Calculate stats based on user role
  const getStats = () => {
    const totalClaims = claims.length
    const approvedClaims = claims.filter((c: any) => c.status === 'APPROVED' || c.status === 'PAID').length
    const pendingClaims = claims.filter((c: any) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW').length
    const rejectedClaims = claims.filter((c: any) => c.status === 'REJECTED').length
    const totalAmount = claims.reduce((sum: number, claim: any) => sum + parseFloat(claim.claimAmount), 0)

    return {
      totalClaims,
      approvedClaims,
      pendingClaims,
      rejectedClaims,
      totalAmount,
    }
  }

  const stats = getStats()

  const getDashboardTitle = () => {
    switch (session.user.role) {
      case 'PATIENT':
        return 'Patient Dashboard'
      case 'DOCTOR':
        return 'Doctor Dashboard'
      case 'INSURANCE':
        return 'Insurance Dashboard'
      case 'BANK':
        return 'Bank Dashboard'
      default:
        return 'Dashboard'
    }
  }

  const getWelcomeMessage = () => {
    switch (session.user.role) {
      case 'PATIENT':
        return 'Manage your insurance claims and track their status'
      case 'DOCTOR':
        return 'Review and process patient claims'
      case 'INSURANCE':
        return 'Review and approve insurance claims'
      case 'BANK':
        return 'Process approved claims for payment'
      default:
        return 'Welcome to the insurance claims portal'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-3 sm:mb-4">
              {getDashboardTitle()}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              {getWelcomeMessage()}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Claims</CardTitle>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalClaims}</div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">All time claims</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Approved</CardTitle>
              <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.approvedClaims}</div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Successfully processed</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending</CardTitle>
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingClaims}</div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Under review</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</CardTitle>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Total claim value</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            {session.user.role === 'PATIENT' && (
              <>
                <Link href="/claims/new">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    New Claim
                  </Button>
                </Link>
                
                <Link href="/appointments/new">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                </Link>
                
                <Link href="/appointments">
                  <Button variant="outline" className="w-full sm:w-auto border-green-300 dark:border-green-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 hover:scale-[1.02]">
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    My Appointments
                  </Button>
                </Link>
                
                <Link href="/claims">
                  <Button variant="outline" className="w-full sm:w-auto border-gray-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.02]">
                    <FileText className="h-4 w-4 mr-2" />
                    View All Claims
                  </Button>
                </Link>
              </>
            )}

            {(session.user.role === 'INSURANCE' || session.user.role === 'BANK') && (
              <Link href="/users">
                <Button variant="outline" className="w-full sm:w-auto border-gray-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.02]">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            )}

            {session.user.role === 'DOCTOR' && (
              <Link href="/appointments">
                <Button variant="outline" className="w-full sm:w-auto border-blue-300 dark:border-blue-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:scale-[1.02]">
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  View Appointments
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Claims - Only for Patients */}
        {session.user.role === 'PATIENT' && (
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Claims</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Your latest claims and their current status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoading ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <LoadingSpinner />
                </div>
              ) : claims.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No claims found</h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                    You haven't submitted any claims yet. Create your first claim to get started.
                  </p>
                  <Link href="/claims/new">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Claim
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200 dark:border-slate-700">
                        <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Claim Number</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Diagnosis</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Amount</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Status</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Date</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((claim: any) => (
                        <TableRow key={claim.id} className="border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            {claim.claimNumber}
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">{claim.diagnosis}</TableCell>
                          <TableCell className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(claim.claimAmount)}</TableCell>
                          <TableCell>
                            <StatusBadge status={claim.status} />
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">{formatDate(claim.createdAt)}</TableCell>
                          <TableCell>
                            <Link href={`/claims/${claim.id}`}>
                              <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}