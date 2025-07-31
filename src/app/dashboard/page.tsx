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
  AlertCircle
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
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{getDashboardTitle()}</h1>
          <p className="mt-2 text-gray-600">{getWelcomeMessage()}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClaims}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedClaims}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingClaims}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {session.user.role === 'PATIENT' && (
              <Link href="/claims/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Claim
                </Button>
              </Link>
            )}
            
            <Link href="/claims">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View All Claims
              </Button>
            </Link>

            {(session.user.role === 'INSURANCE' || session.user.role === 'BANK') && (
              <Link href="/users">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Claims */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Claims</CardTitle>
            <CardDescription>
              Your latest claims and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No claims found</h3>
                <p className="text-gray-500 mb-4">
                  {session.user.role === 'PATIENT' 
                    ? "You haven't submitted any claims yet." 
                    : "No claims to review at the moment."
                  }
                </p>
                {session.user.role === 'PATIENT' && (
                  <Link href="/claims/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Claim
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim Number</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    {session.user.role !== 'PATIENT' && <TableHead>Patient</TableHead>}
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim: any) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">
                        {claim.claimNumber}
                      </TableCell>
                      <TableCell>{claim.diagnosis}</TableCell>
                      {session.user.role !== 'PATIENT' && (
                        <TableCell>{claim.patient.name || claim.patient.email}</TableCell>
                      )}
                      <TableCell>{formatCurrency(claim.claimAmount)}</TableCell>
                      <TableCell>
                        <StatusBadge status={claim.status} />
                      </TableCell>
                      <TableCell>{formatDate(claim.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/claims/${claim.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}