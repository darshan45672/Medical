'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BookAppointmentModal } from '@/components/ui/book-appointment-modal'
import { AppointmentStatusBadge } from '@/components/ui/appointment-status-badge'
import { ClaimDetailsModal } from '@/components/ui/claim-details-modal'
import { NewClaimModal } from '@/components/ui/new-claim-modal'
import { CreatePatientReportModal } from '@/components/ui/create-patient-report-modal'
import { Carousel } from '@/components/ui/carousel'
import { Header } from '@/components/layout/header'
import { useClaims, useClaim } from '@/hooks/use-claims'
import { useAppointments, useUpdateAppointment } from '@/hooks/use-appointments'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { 
  FileText, 
  Plus, 
  Users, 
  DollarSign, 
  Clock,
  CheckCircle,
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Ban
} from 'lucide-react'
import Link from 'next/link'
import { Claim, AppointmentStatus, ClaimStatus, UserRole } from '@/types'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: claimsData, isLoading } = useClaims({ limit: 10 })
  const { data: allClaimsData, isLoading: isLoadingAllClaims } = useClaims()
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useAppointments({ limit: 10 })
  const { data: allAppointmentsData, isLoading: isLoadingAllAppointments } = useAppointments()
  const updateAppointment = useUpdateAppointment()
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false)
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false)
  const [isAppointmentHistoryOpen, setIsAppointmentHistoryOpen] = useState(false)
  const [isClaimHistoryOpen, setIsClaimHistoryOpen] = useState(false)
  const [isAppointmentManagementOpen, setIsAppointmentManagementOpen] = useState(false)
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  const [isClaimDetailsModalOpen, setIsClaimDetailsModalOpen] = useState(false)
  
  const { data: selectedClaimData } = useClaim(selectedClaimId || '')

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
  const appointments = appointmentsData?.appointments || []

  const handleViewClaimDetails = (claimId: string) => {
    setSelectedClaimId(claimId)
    setIsClaimDetailsModalOpen(true)
  }

  const handleCloseClaimDetails = () => {
    setIsClaimDetailsModalOpen(false)
    setSelectedClaimId(null)
  }

  // Calculate stats based on user role
  const getStats = () => {
    const totalClaims = claims.length
    const approvedClaims = claims.filter((c: Claim) => c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.PAID).length
    const pendingClaims = claims.filter((c: Claim) => c.status === ClaimStatus.SUBMITTED || c.status === ClaimStatus.UNDER_REVIEW).length
    const rejectedClaims = claims.filter((c: Claim) => c.status === ClaimStatus.REJECTED).length
    const totalAmount = claims.reduce((sum: number, claim: Claim) => sum + parseFloat(claim.claimAmount), 0)

    return {
      totalClaims,
      approvedClaims,
      pendingClaims,
      rejectedClaims,
      totalAmount,
    }
  }

  const stats = getStats()

  // Handler for updating appointment status to CONSULTED
  const handleMarkAsConsulted = async (appointmentId: string, patientName: string) => {
    try {
      await updateAppointment.mutateAsync({
        id: appointmentId,
        data: { status: AppointmentStatus.CONSULTED }
      })
      toast.success(`Appointment with ${patientName} marked as consulted successfully!`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update appointment status'
      toast.error(errorMessage)
    }
  }

  const getDashboardTitle = () => {
    switch (session.user.role) {
      case UserRole.PATIENT:
        return 'Patient Dashboard'
      case UserRole.DOCTOR:
        return 'Doctor Dashboard'
      case UserRole.INSURANCE:
        return 'Insurance Dashboard'
      case UserRole.BANK:
        return 'Bank Dashboard'
      default:
        return 'Dashboard'
    }
  }

  const getWelcomeMessage = () => {
    switch (session.user.role) {
      case UserRole.PATIENT:
        return 'Manage your insurance claims and track their status'
      case UserRole.DOCTOR:
        return 'Review and process patient claims'
      case UserRole.INSURANCE:
        return 'Review and approve insurance claims'
      case UserRole.BANK:
        return 'Process approved claims for payment'
      default:
        return 'Welcome to the insurance claims portal'
    }
  }

  const handleAppointmentAction = async (appointmentId: string, action: AppointmentStatus) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action }),
      })

      if (response.ok) {
        // Refresh appointments data
        window.location.reload()
      } else {
        console.error('Failed to update appointment status')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
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
            {session.user.role === UserRole.PATIENT && (
              <>
                <Button 
                  onClick={() => setIsNewClaimModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Claim
                </Button>
                
                <Button 
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
                
                <Button 
                  onClick={() => {
                    setIsAppointmentHistoryOpen(!isAppointmentHistoryOpen)
                    if (!isAppointmentHistoryOpen) {
                      setIsClaimHistoryOpen(false)
                      setIsAppointmentManagementOpen(false)
                    }
                  }}
                  variant="outline" 
                  className="w-full sm:w-auto border-green-300 dark:border-green-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  disabled={isLoadingAllAppointments}
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  My Appointments
                  {isLoadingAllAppointments ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 ml-2"></div>
                  ) : isAppointmentHistoryOpen ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </Button>
                
                <Button 
                  onClick={() => {
                    setIsClaimHistoryOpen(!isClaimHistoryOpen)
                    if (!isClaimHistoryOpen) {
                      setIsAppointmentHistoryOpen(false)
                      setIsAppointmentManagementOpen(false)
                    }
                  }}
                  variant="outline" 
                  className="w-full sm:w-auto border-gray-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  disabled={isLoadingAllClaims}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Claims
                  {isLoadingAllClaims ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 ml-2"></div>
                  ) : isClaimHistoryOpen ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </>
            )}

            {(session.user.role === UserRole.INSURANCE || session.user.role === UserRole.BANK) && (
              <Link href="/users">
                <Button variant="outline" className="w-full sm:w-auto border-gray-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            )}

            {session.user.role === UserRole.DOCTOR && (
              <>
                <Link href="/appointments">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    View My Appointments
                  </Button>
                </Link>
                
                <Link href="/patients">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
                    <Users className="h-4 w-4 mr-2" />
                    View My Patients
                  </Button>
                </Link>
                
                <Button 
                  onClick={() => setIsCreateReportModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Reports
                </Button>
                
                <Button 
                  onClick={() => {
                    setIsAppointmentManagementOpen(!isAppointmentManagementOpen)
                    if (!isAppointmentManagementOpen) {
                      setIsAppointmentHistoryOpen(false)
                      setIsClaimHistoryOpen(false)
                    }
                  }}
                  variant="outline" 
                  className="w-full sm:w-auto border-amber-300 dark:border-amber-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  disabled={isLoadingAllAppointments}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Appointments
                  {isLoadingAllAppointments ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 ml-2"></div>
                  ) : isAppointmentManagementOpen ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Today's Appointments - Only for Doctors */}
        {session.user.role === UserRole.DOCTOR && (
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg mb-8 sm:mb-12">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Today&apos;s Appointments</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Your accepted appointments for today that can be marked as consulted
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoadingAppointments ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <LoadingSpinner />
                </div>
              ) : appointments.filter((appointment: any) => {
                const today = new Date().toDateString()
                const appointmentDate = new Date(appointment.scheduledAt).toDateString()
                return appointmentDate === today && appointment.status === AppointmentStatus.ACCEPTED
              }).length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-800 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <CalendarCheck className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No accepted appointments today</h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                    You have no accepted appointments scheduled for today.
                  </p>
                  <Link href="/appointments">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      View All Appointments
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="px-4 sm:px-6">
                  <Carousel>
                    {appointments.filter((appointment: any) => {
                      const today = new Date().toDateString()
                      const appointmentDate = new Date(appointment.scheduledAt).toDateString()
                      return appointmentDate === today && appointment.status === AppointmentStatus.ACCEPTED
                    }).map((appointment: any) => (
                      <Card key={appointment.id} className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full">
                        <CardContent className="p-4 h-full flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                {appointment.patient?.name || 'Unknown Patient'}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-gray-500 dark:text-gray-500 text-xs">
                                {appointment.patient?.email || 'No email'}
                              </p>
                            </div>
                            <AppointmentStatusBadge status={appointment.status} />
                          </div>
                          
                          <div className="space-y-2 flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Patient ID:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm font-mono">
                                {appointment.patient?.id?.slice(-8) || 'N/A'}
                              </span>
                            </div>
                            {appointment.notes && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Notes:</span>
                                <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 line-clamp-2 bg-gray-50 dark:bg-slate-700 rounded p-2">
                                  {appointment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
                            <Link href={`/appointments/${appointment.id}`} className="w-full">
                              <Button variant="ghost" size="sm" className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                View Details
                              </Button>
                            </Link>
                            {appointment.status === AppointmentStatus.ACCEPTED && (
                              <Button 
                                size="sm" 
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:from-gray-400 disabled:to-gray-500 cursor-pointer"
                                onClick={() => handleMarkAsConsulted(appointment.id, appointment.patient?.name || 'Unknown Patient')}
                                disabled={updateAppointment.isPending}
                              >
                                {updateAppointment.isPending ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Mark as Consulted
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </Carousel>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Patients - Only for Doctors */}
        {session.user.role === UserRole.DOCTOR && (
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg mb-8 sm:mb-12">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Patients</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Patients you&apos;ve seen recently who may need follow-up
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoadingAppointments ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <LoadingSpinner />
                </div>
              ) : appointments.filter((appointment: any) => {
                const threeDaysAgo = new Date()
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
                const appointmentDate = new Date(appointment.scheduledAt)
                return appointmentDate >= threeDaysAgo && appointment.status === AppointmentStatus.COMPLETED
              }).length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900 dark:to-emerald-800 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No recent patients</h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                    No patients have completed appointments in the last 3 days.
                  </p>
                  <Link href="/patients">
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
                      <Users className="h-4 w-4 mr-2" />
                      View All Patients
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="px-4 sm:px-6">
                  <Carousel>
                    {appointments.filter((appointment: any) => {
                      const threeDaysAgo = new Date()
                      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
                      const appointmentDate = new Date(appointment.scheduledAt)
                      return appointmentDate >= threeDaysAgo && appointment.status === AppointmentStatus.COMPLETED
                    }).map((appointment: any) => (
                      <Card key={appointment.id} className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full">
                        <CardContent className="p-4 h-full flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                {appointment.patient?.name || 'Unknown Patient'}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                Last visit: {formatDate(appointment.scheduledAt)}
                              </p>
                              <p className="text-gray-500 dark:text-gray-500 text-xs">
                                {appointment.patient?.email || 'No email'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <Badge variant="secondary" className="mb-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Completed
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(appointment.scheduledAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Patient ID:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm font-mono">
                                {appointment.patient?.id?.slice(-8) || 'N/A'}
                              </span>
                            </div>
                            {appointment.notes && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Treatment Notes:</span>
                                <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 line-clamp-2 bg-gray-50 dark:bg-slate-700 rounded p-2">
                                  {appointment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
                            <Link href={`/patients/${appointment.patient?.id}`} className="w-full">
                              <Button variant="ghost" size="sm" className="w-full hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer">
                                View Patient Profile
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white cursor-pointer"
                              onClick={() => setIsCreateReportModalOpen(true)}
                            >
                              Add Follow-up Report
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </Carousel>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Appointment Management - Only for Doctors */}
        {session.user.role === UserRole.DOCTOR && isAppointmentManagementOpen && (
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg mb-8 sm:mb-12">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Appointment Management
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Manage your future appointments - Accept, Reject, or Cancel
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoadingAllAppointments ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <LoadingSpinner />
                </div>
              ) : (() => {
                // Filter future appointments for the doctor
                const futureAppointments = allAppointmentsData?.appointments?.filter((appointment: any) => 
                  appointment.doctorId === session?.user?.id && 
                  new Date(appointment.scheduledAt) > new Date() &&
                  appointment.status === AppointmentStatus.PENDING
                ) || []

                return futureAppointments.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <div className="bg-gradient-to-r from-amber-100 to-orange-200 dark:from-amber-900 dark:to-orange-800 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No pending appointments
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      All your future appointments have been processed or you have no upcoming appointment requests.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-800">
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Patient</TableHead>
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Date & Time</TableHead>
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Contact</TableHead>
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Status</TableHead>
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {futureAppointments.map((appointment: any) => (
                          <TableRow 
                            key={appointment.id}
                            className="hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-orange-50/50 dark:hover:from-amber-950/20 dark:hover:to-orange-950/20 transition-all duration-200 border-gray-200 dark:border-slate-700"
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-800 rounded-full">
                                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {appointment.patient?.name || 'Unknown Patient'}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    ID: {appointment.patient?.id?.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {formatDate(appointment.scheduledAt)}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(appointment.scheduledAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  {appointment.patient?.email || 'No email'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {appointment.patient?.phone || 'No phone'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <AppointmentStatusBadge status={appointment.status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAppointmentAction(appointment.id, AppointmentStatus.ACCEPTED)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-8 text-xs font-medium rounded-md transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleAppointmentAction(appointment.id, AppointmentStatus.REJECTED)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 h-8 text-xs font-medium rounded-md transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAppointmentAction(appointment.id, AppointmentStatus.CANCELLED)}
                                  className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-950/20 px-3 py-1 h-8 text-xs font-medium rounded-md transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer"
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Accepted Appointments - Only for Doctors */}
        {session.user.role === UserRole.DOCTOR && (
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg mb-8 sm:mb-12">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Upcoming Accepted Appointments
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Your confirmed appointments scheduled for the future
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoadingAllAppointments ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <LoadingSpinner />
                </div>
              ) : (() => {
                // Filter upcoming accepted appointments for the doctor
                const upcomingAcceptedAppointments = allAppointmentsData?.appointments?.filter((appointment: any) => 
                  appointment.doctorId === session?.user?.id && 
                  new Date(appointment.scheduledAt) > new Date() &&
                  appointment.status === AppointmentStatus.ACCEPTED
                ) || []

                return upcomingAcceptedAppointments.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <div className="bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900 dark:to-emerald-800 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <CalendarCheck className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No upcoming appointments
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      You don&apos;t have any confirmed appointments scheduled for the future.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Patient</TableHead>
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Date & Time</TableHead>
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Contact</TableHead>
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Time Until</TableHead>
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Status</TableHead>
                          <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingAcceptedAppointments
                          .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                          .map((appointment: any) => {
                            const appointmentDate = new Date(appointment.scheduledAt)
                            const now = new Date()
                            const diffInHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
                            const diffInDays = Math.ceil(diffInHours / 24)
                            
                            const getTimeUntil = () => {
                              if (diffInHours < 1) return 'Very soon'
                              if (diffInHours < 24) return `${Math.ceil(diffInHours)} hours`
                              if (diffInDays === 1) return 'Tomorrow'
                              return `${diffInDays} days`
                            }

                            const getTimeColor = () => {
                              if (diffInHours < 2) return 'text-red-600 dark:text-red-400 font-semibold'
                              if (diffInHours < 24) return 'text-orange-600 dark:text-orange-400 font-medium'
                              return 'text-gray-600 dark:text-gray-400'
                            }

                            return (
                              <TableRow 
                                key={appointment.id}
                                className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-950/20 dark:hover:to-emerald-950/20 transition-all duration-200 border-gray-200 dark:border-slate-700"
                              >
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-200 dark:from-green-900 dark:to-emerald-800 rounded-full">
                                      <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {appointment.patient?.name || 'Unknown Patient'}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        ID: {appointment.patient?.id?.slice(0, 8)}...
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                      {formatDate(appointment.scheduledAt)}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {appointmentDate.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                      {appointment.patient?.email || 'No email'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      {appointment.patient?.phone || 'No phone'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className={`text-sm font-medium ${getTimeColor()}`}>
                                    {getTimeUntil()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Confirmed
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setIsCreateReportModalOpen(true)}
                                      className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-950/20 px-3 py-1 h-8 text-xs font-medium rounded-md transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      Add Report
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAppointmentAction(appointment.id, AppointmentStatus.CANCELLED)}
                                      className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950/20 px-3 py-1 h-8 text-xs font-medium rounded-md transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {session.user.role === UserRole.PATIENT && (
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
                    You haven&apos;t submitted any claims yet. Create your first claim to get started.
                  </p>
                  <Link href="/claims/new">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Claim
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="px-4 sm:px-6">
                  <Carousel>
                    {claims.map((claim: any) => (
                      <Card key={claim.id} className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full">
                        <CardContent className="p-4 h-full flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                {claim.claimNumber}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 line-clamp-2">
                                {claim.diagnosis}
                              </p>
                            </div>
                            <StatusBadge status={claim.status} />
                          </div>
                          
                          <div className="space-y-2 flex-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Amount:</span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {formatCurrency(claim.claimAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Date:</span>
                              <span className="text-gray-600 dark:text-gray-400 text-xs">
                                {formatDate(claim.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                            <Button 
                              onClick={() => handleViewClaimDetails(claim.id)}
                              variant="ghost" 
                              size="sm" 
                              className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </Carousel>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Appointments - Only for Patients */}
        {session.user.role === UserRole.PATIENT && (
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg mt-8 sm:mt-12">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Appointments</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Your upcoming and recent appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoadingAppointments ? (
                <div className="flex justify-center py-8 sm:py-12">
                  <LoadingSpinner />
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No appointments found</h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                    You haven&apos;t booked any appointments yet. Schedule your first appointment with a doctor.
                  </p>
                  <Button 
                    onClick={() => setIsAppointmentModalOpen(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Your First Appointment
                  </Button>
                </div>
              ) : (
                <div className="px-4 sm:px-6">
                  <Carousel>
                    {appointments.map((appointment: any) => (
                      <Card key={appointment.id} className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] h-full">
                        <CardContent className="p-4 h-full flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                {new Date(appointment.scheduledAt).toLocaleDateString()}
                              </p>
                              <p className="text-gray-500 dark:text-gray-500 text-xs">
                                {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <AppointmentStatusBadge status={appointment.status} />
                          </div>
                          
                          <div className="flex-1">
                            {appointment.notes && (
                              <div className="mb-3">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Notes:</span>
                                <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                                  {appointment.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                            <Link href={`/appointments/${appointment.id}`} className="w-full">
                              <Button variant="ghost" size="sm" className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </Carousel>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Appointment History Section */}
        {session.user.role === UserRole.PATIENT && isAppointmentHistoryOpen && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Appointment History
                </CardTitle>
                <Button
                  onClick={() => setIsAppointmentHistoryOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Complete history of all your appointments
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              {isLoadingAllAppointments ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (allAppointmentsData?.appointments || []).length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No appointments found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    You haven&apos;t booked any appointments yet.
                  </p>
                  <Button 
                    onClick={() => setIsAppointmentModalOpen(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 cursor-pointer"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Your First Appointment
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white dark:bg-slate-800 z-10">
                          <TableRow className="border-gray-200 dark:border-slate-700">
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Doctor</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Date & Time</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Status</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Notes</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(allAppointmentsData?.appointments || []).map((appointment: any) => (
                            <TableRow key={appointment.id} className="border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                              <TableCell className="font-medium">
                                <div>
                                  <p className="text-gray-900 dark:text-gray-100">
                                    Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {appointment.doctor?.email || 'No email'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-gray-900 dark:text-gray-100">
                                    {formatDate(appointment.scheduledAt)}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <AppointmentStatusBadge status={appointment.status} />
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <p className="text-gray-700 dark:text-gray-300 text-sm truncate">
                                  {appointment.notes || 'No notes provided'}
                                </p>
                              </TableCell>
                              <TableCell className="text-right">
                                <Link href={`/appointments/${appointment.id}`}>
                                  <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                                    View Details
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden">
                    <div className="divide-y divide-gray-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
                      {(allAppointmentsData?.appointments || []).map((appointment: any) => (
                        <div key={appointment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {appointment.doctor?.email || 'No email'}
                              </p>
                            </div>
                            <AppointmentStatusBadge status={appointment.status} />
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{formatDate(appointment.scheduledAt)}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          {appointment.notes && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes:</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 rounded p-2">
                                {appointment.notes}
                              </p>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <Link href={`/appointments/${appointment.id}`} className="w-full sm:w-auto">
                              <Button variant="ghost" size="sm" className="w-full sm:w-auto hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Claims History Section */}
        {session.user.role === UserRole.PATIENT && isClaimHistoryOpen && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg mt-8">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Claims History
                </CardTitle>
                <Button
                  onClick={() => setIsClaimHistoryOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Complete history of all your insurance claims
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              {isLoadingAllClaims ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (allClaimsData?.claims || []).length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No claims found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    You haven&apos;t submitted any claims yet.
                  </p>
                  <Button 
                    onClick={() => setIsNewClaimModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Claim
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white dark:bg-slate-800 z-10">
                          <TableRow className="border-gray-200 dark:border-slate-700">
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Claim Number</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Diagnosis</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Amount</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Status</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Date</TableHead>
                            <TableHead className="font-semibold text-gray-900 dark:text-gray-100 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(allClaimsData?.claims || []).map((claim: any) => (
                            <TableRow key={claim.id} className="border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                              <TableCell className="font-medium">
                                <div>
                                  <p className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                                    {claim.claimNumber}
                                  </p>
                                  {claim.doctor && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Dr. {claim.doctor.name}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <p className="text-gray-900 dark:text-gray-100 text-sm truncate">
                                  {claim.diagnosis}
                                </p>
                                {claim.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                                    {claim.description}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-gray-900 dark:text-gray-100 font-semibold">
                                    {formatCurrency(claim.claimAmount)}
                                  </p>
                                  {claim.approvedAmount && (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                      Approved: {formatCurrency(claim.approvedAmount)}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={claim.status} />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-gray-900 dark:text-gray-100 text-sm">
                                    {formatDate(claim.createdAt)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(claim.treatmentDate)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  onClick={() => handleViewClaimDetails(claim.id)}
                                  variant="ghost" 
                                  size="sm" 
                                  className="hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden">
                    <div className="divide-y divide-gray-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
                      {(allClaimsData?.claims || []).map((claim: any) => (
                        <div key={claim.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm font-mono">
                                {claim.claimNumber}
                              </h4>
                              {claim.doctor && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Dr. {claim.doctor.name}
                                </p>
                              )}
                            </div>
                            <StatusBadge status={claim.status} />
                          </div>

                          <div className="space-y-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Diagnosis:</p>
                              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                {claim.diagnosis}
                              </p>
                              {claim.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 bg-gray-50 dark:bg-slate-700 rounded p-2">
                                  {claim.description}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Claim Amount:</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {formatCurrency(claim.claimAmount)}
                                </p>
                                {claim.approvedAmount && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Approved: {formatCurrency(claim.approvedAmount)}
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dates:</p>
                                <div className="space-y-1">
                                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                    <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span>Created: {formatDate(claim.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span>Treatment: {formatDate(claim.treatmentDate)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button 
                              onClick={() => handleViewClaimDetails(claim.id)}
                              variant="ghost" 
                              size="sm" 
                              className="w-full sm:w-auto hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Appointment Booking Modal */}
      <BookAppointmentModal 
        open={isAppointmentModalOpen} 
        onOpenChange={setIsAppointmentModalOpen} 
      />

      {/* New Claim Modal */}
      <NewClaimModal
        open={isNewClaimModalOpen}
        onOpenChange={setIsNewClaimModalOpen}
      />

      {/* Create Patient Report Modal */}
      <CreatePatientReportModal
        isOpen={isCreateReportModalOpen}
        onClose={() => setIsCreateReportModalOpen(false)}
      />

      {/* Claim Details Modal */}
      <ClaimDetailsModal
        open={isClaimDetailsModalOpen}
        onOpenChange={handleCloseClaimDetails}
        claim={selectedClaimData}
      />
    </div>
  )
}