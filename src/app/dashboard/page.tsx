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
  User,
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
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
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

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
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

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
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

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
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
                  onClick={() => router.push('/patient-appointments')}
                  variant="outline" 
                  className="w-full sm:w-auto border-green-300 dark:border-green-600 bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  My Appointments
                </Button>
                
                <Button 
                  onClick={() => router.push('/claims')}
                  variant="outline" 
                  className="w-full sm:w-auto border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Claims
                </Button>
              </>
            )}

            {(session.user.role === UserRole.INSURANCE || session.user.role === UserRole.BANK) && (
              <Link href="/users">
                <Button variant="outline" className="w-full sm:w-auto border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            )}

            {session.user.role === UserRole.DOCTOR && (
              <>
                <Link href="/appointments">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Appointments
                  </Button>
                </Link>
                
                <Link href="/patients">
                  <Button variant="outline" className="w-full sm:w-auto border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                    <Users className="h-4 w-4 mr-2" />
                    View Patients
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
                    if (!isAppointmentManagementOpen) {
                      setIsAppointmentManagementOpen(true)
                    } else {
                      setIsAppointmentManagementOpen(false)
                    }
                  }}
                  variant="outline" 
                  className="w-full sm:w-auto border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
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

        {/* Doctor Dashboard Sections */}
        {session.user.role === UserRole.DOCTOR && (
          <>
            {/* Today's Appointments */}
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 mb-8 sm:mb-12">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Today's Appointments</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Your scheduled appointments for today
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoadingAppointments ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <LoadingSpinner />
                  </div>
                ) : (() => {
                  const today = new Date()
                  const todaysAppointments = appointments.filter((appointment: any) => {
                    const appointmentDate = new Date(appointment.scheduledAt)
                    return appointmentDate.toDateString() === today.toDateString()
                  })
                  
                  return todaysAppointments.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <div className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-700 dark:to-blue-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-300" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No appointments today</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                        You don't have any scheduled appointments for today. Check back tomorrow or view all appointments.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 px-4 sm:px-6">
                      {todaysAppointments.map((appointment: any) => (
                        <Card key={appointment.id} className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {appointment.patient?.name || 'Unknown Patient'}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {appointment.notes && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {appointment.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <AppointmentStatusBadge status={appointment.status} />
                                {appointment.status === AppointmentStatus.ACCEPTED && (
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm"
                                      onClick={() => handleAppointmentAction(appointment.id, AppointmentStatus.COMPLETED)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Complete
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Today's Patients */}
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 mb-8 sm:mb-12">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Today's Patients</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Patients you'll see today with their appointment details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoadingAppointments ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <LoadingSpinner />
                  </div>
                ) : (() => {
                  const today = new Date()
                  const todaysPatients = appointments
                    .filter((appointment: any) => {
                      const appointmentDate = new Date(appointment.scheduledAt)
                      return appointmentDate.toDateString() === today.toDateString()
                    })
                    .reduce((unique: any[], appointment: any) => {
                      const existingPatient = unique.find(p => p.patient?.id === appointment.patient?.id)
                      if (!existingPatient) {
                        unique.push(appointment)
                      }
                      return unique
                    }, [])
                  
                  return todaysPatients.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <div className="bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-700 dark:to-purple-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <Users className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-300" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No patients today</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                        You don't have any patients scheduled for today.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-6">
                      {todaysPatients.map((appointment: any) => (
                        <Card key={appointment.patient?.id} className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3 mb-3">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {appointment.patient?.name || 'Unknown Patient'}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {appointment.patient?.email}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <AppointmentStatusBadge status={appointment.status} />
                              </div>
                              {appointment.notes && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 rounded p-2">
                                  {appointment.notes}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Appointment Requests Management */}
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 mb-8 sm:mb-12">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Appointment Requests</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Pending appointment requests that need your approval
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoadingAppointments ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <LoadingSpinner />
                  </div>
                ) : (() => {
                  const pendingRequests = appointments.filter((appointment: any) => 
                    appointment.status === AppointmentStatus.PENDING
                  )
                  
                  return pendingRequests.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <div className="bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-700 dark:to-amber-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <CalendarCheck className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600 dark:text-amber-300" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No pending requests</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                        You don't have any pending appointment requests at the moment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 px-4 sm:px-6">
                      {pendingRequests.map((appointment: any) => (
                        <Card key={appointment.id} className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {appointment.patient?.name || 'Unknown Patient'}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatDate(appointment.scheduledAt)} at {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {appointment.patient?.email}
                                  </p>
                                  {appointment.notes && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 bg-white dark:bg-slate-800 rounded px-2 py-1">
                                      {appointment.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-300">
                                  Pending
                                </Badge>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => handleAppointmentAction(appointment.id, AppointmentStatus.ACCEPTED)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAppointmentAction(appointment.id, AppointmentStatus.CANCELLED)}
                                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950/20"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </>
        )}

        {/* Patient Recent Claims and Appointments */}
        {session.user.role === UserRole.PATIENT && (
          <>
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 mb-8 sm:mb-12">
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
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm font-mono">
                                {claim.claimNumber}
                              </h4>
                              <StatusBadge status={claim.status} />
                            </div>
                            
                            <div className="space-y-2 flex-1">
                              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                {claim.diagnosis}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Amount: {formatCurrency(parseFloat(claim.claimAmount))}
                              </p>
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

            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800">
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
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  Dr. {appointment.doctor?.name || 'Unknown'}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {formatDate(appointment.scheduledAt)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <AppointmentStatusBadge status={appointment.status} />
                            </div>
                            
                            <div className="flex-1">
                              {appointment.notes && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-slate-700 rounded p-2">
                                  {appointment.notes}
                                </p>
                              )}
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
                              <Link href={`/patient-appointments/${appointment.id}`} className="w-full">
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
          </>
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
