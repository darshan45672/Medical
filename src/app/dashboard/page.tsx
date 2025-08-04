'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { EnhancedLoadingSpinner } from '@/components/ui/enhanced-loading-spinner'
import { BookAppointmentModal } from '@/components/ui/book-appointment-modal'
import { AppointmentStatusBadge } from '@/components/ui/appointment-status-badge'
import { PaymentStatusBadge } from '@/components/ui/payment-status-badge'
import { PaymentManagementModal } from '@/components/ui/payment-management-modal'
import { EnhancedActionButton } from '@/components/ui/enhanced-action-button'
import { GradientButton } from '@/components/ui/gradient-button'
import { ClaimDetailsModal } from '@/components/ui/claim-details-modal'
import { NewClaimModal } from '@/components/ui/new-claim-modal'
import { CreatePatientReportModal } from '@/components/ui/create-patient-report-modal'
import { Carousel } from '@/components/ui/carousel'
import { Header } from '@/components/layout/header'
import { PWAInstall } from '@/components/ui/pwa-install'
import { useClaims, useClaim } from '@/hooks/use-claims'
import { usePayments } from '@/hooks/use-payments'
import { useAppointments } from '@/hooks/use-appointments'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { 
  FileText, 
  Plus, 
  Users, 
  User,
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Settings,
  Eye,
  CreditCard,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { Claim, AppointmentStatus, ClaimStatus, UserRole } from '@/types'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: claimsData, isLoading } = useClaims({ limit: 10 })
  // const { data: allClaimsData, isLoading: isLoadingAllClaims } = useClaims()
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useAppointments({ limit: 10 })
  // const { data: allAppointmentsData, isLoading: isLoadingAllAppointments } = useAppointments()
  // const updateAppointment = useUpdateAppointment()
  const { payments: paymentsData, isLoading: isLoadingPayments, refetch: refetchPayments } = usePayments()
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false)
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false)
  const [isAppointmentManagementOpen, setIsAppointmentManagementOpen] = useState(false)
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  const [isClaimDetailsModalOpen, setIsClaimDetailsModalOpen] = useState(false)
  const [updatingClaimId, setUpdatingClaimId] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  
  // Get selected payment data
  const selectedPayment = selectedPaymentId 
    ? paymentsData?.find((payment: any) => payment.id === selectedPaymentId) || null
    : null
  
  const { data: selectedClaimData } = useClaim(selectedClaimId || '')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Function to scroll to appointment requests section
  const scrollToAppointmentRequests = () => {
    const appointmentRequestsSection = document.getElementById('appointment-requests-section')
    if (appointmentRequestsSection) {
      // Add a brief highlight effect
      appointmentRequestsSection.classList.add('ring-2', 'ring-amber-400', 'ring-opacity-75')
      
      appointmentRequestsSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
      
      // Remove the highlight effect after 2 seconds
      setTimeout(() => {
        appointmentRequestsSection.classList.remove('ring-2', 'ring-amber-400', 'ring-opacity-75')
      }, 2000)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <Header />
        <div className="flex items-center justify-center h-96">
          <EnhancedLoadingSpinner variant="gradient" size="xl" text="Loading dashboard..." />
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

  const handleStatusChange = async (claimId: string, newStatus: string) => {
    setUpdatingClaimId(claimId)
    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update claim status')
      }

      // Invalidate and refetch claims data
      queryClient.invalidateQueries({ queryKey: ['claims'] })
      
      toast.success(`Claim status updated to ${newStatus.replace('_', ' ').toLowerCase()}`)
    } catch (error) {
      console.error('Error updating claim status:', error)
      toast.error('Failed to update claim status')
    } finally {
      setUpdatingClaimId(null)
    }
  }

  // Calculate stats based on user role
  const getStats = () => {
    if (session.user.role === UserRole.DOCTOR) {
      // Doctor-specific stats
      const totalAppointments = appointments.length
      const today = new Date()
      const todaysAppointments = appointments.filter((appointment: any) => {
        const appointmentDate = new Date(appointment.scheduledAt)
        return appointmentDate.toDateString() === today.toDateString()
      }).length
      
      const pendingRequests = appointments.filter((appointment: any) => 
        appointment.status === AppointmentStatus.PENDING
      ).length
      
      const completedAppointments = appointments.filter((appointment: any) => 
        appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CONSULTED
      ).length
      
      // Get unique patients count
      const uniquePatients = appointments.reduce((unique: any[], appointment: any) => {
        const existingPatient = unique.find(p => p.patient?.id === appointment.patient?.id)
        if (!existingPatient && appointment.patient?.id) {
          unique.push(appointment)
        }
        return unique
      }, []).length

      return {
        totalAppointments,
        todaysAppointments,
        pendingRequests,
        completedAppointments,
        uniquePatients,
      }
    } else if (session.user.role === UserRole.PATIENT) {
      // Patient-specific stats - exclude draft claims from statistics
      const submittedClaims = claims.filter((c: Claim) => c.status !== ClaimStatus.DRAFT)
      const totalClaims = submittedClaims.length
      const approvedClaims = submittedClaims.filter((c: Claim) => c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.PAID).length
      const pendingClaims = submittedClaims.filter((c: Claim) => c.status === ClaimStatus.SUBMITTED || c.status === ClaimStatus.UNDER_REVIEW).length
      const totalAppointments = appointments.length
      
      // Calculate upcoming appointments (future appointments)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const upcomingAppointments = appointments.filter((appointment: any) => {
        const appointmentDate = new Date(appointment.scheduledAt)
        return appointmentDate >= today && 
               (appointment.status === AppointmentStatus.PENDING || 
                appointment.status === AppointmentStatus.ACCEPTED)
      }).length
      
      // Calculate total amount claimed and approved - only for submitted claims
      const totalAmountClaimed = submittedClaims.reduce((sum: number, claim: Claim) => sum + parseFloat(claim.claimAmount), 0)
      const totalAmountApproved = submittedClaims
        .filter((c: Claim) => c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.PAID)
        .reduce((sum: number, claim: Claim) => sum + (parseFloat(claim.approvedAmount || '0') || parseFloat(claim.claimAmount)), 0)

      return {
        totalClaims,
        approvedClaims,
        pendingClaims,
        totalAppointments,
        upcomingAppointments,
        totalAmountClaimed,
        totalAmountApproved,
      }
    } else {
      // Insurance/Bank stats - exclude draft claims
      const submittedClaims = claims.filter((c: Claim) => c.status !== ClaimStatus.DRAFT)
      const totalClaims = submittedClaims.length
      const approvedClaims = submittedClaims.filter((c: Claim) => c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.PAID).length
      const pendingClaims = submittedClaims.filter((c: Claim) => c.status === ClaimStatus.SUBMITTED || c.status === ClaimStatus.UNDER_REVIEW).length
      const rejectedClaims = submittedClaims.filter((c: Claim) => c.status === ClaimStatus.REJECTED).length
      const totalAmount = submittedClaims.reduce((sum: number, claim: Claim) => sum + parseFloat(claim.claimAmount), 0)
      
      // Calculate approved amount
      const approvedAmount = submittedClaims
        .filter((c: Claim) => c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.PAID)
        .reduce((sum: number, claim: Claim) => sum + (parseFloat(claim.approvedAmount || '0') || parseFloat(claim.claimAmount)), 0)
      
      // Calculate today's claims
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const todaysClaims = submittedClaims.filter((claim: Claim) => {
        const claimDate = new Date(claim.createdAt)
        return claimDate >= today && claimDate < tomorrow
      }).length

      return {
        totalClaims,
        approvedClaims,
        pendingClaims,
        rejectedClaims,
        totalAmount,
        approvedAmount,
        todaysClaims,
      }
    }
  }

  const stats = getStats()

  // Handler for updating appointment status to CONSULTED
  // const handleMarkAsConsulted = async (appointmentId: string, patientName: string) => {
  //   try {
  //     await updateAppointment.mutateAsync({
  //       id: appointmentId,
  //       data: { status: AppointmentStatus.CONSULTED }
  //     })
  //     toast.success(`Appointment with ${patientName} marked as consulted successfully!`)
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to update appointment status'
  //     toast.error(errorMessage)
  //   }
  // }

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
        return 'Review, approve, and manage insurance claims from patients'
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

        {/* PWA Install Prompt */}
        <div className="mb-6">
          <PWAInstall variant="banner" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {session.user.role === UserRole.DOCTOR ? (
            <>
              {/* Doctor Stats */}
              <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Appointments</CardTitle>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalAppointments}</div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">All time appointments</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Today&apos;s Schedule</CardTitle>
                  <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <CalendarCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.todaysAppointments}</div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Appointments today</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Requests</CardTitle>
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                    <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingRequests}</div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Patients</CardTitle>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.uniquePatients}</div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Unique patients</p>
                </CardContent>
              </Card>
            </>
          ) : session.user.role === UserRole.PATIENT ? (
            <>
              {/* Patient Stats */}
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
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Approved Claims</CardTitle>
                  <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.approvedClaims}</div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Successfully approved</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Upcoming Appointments</CardTitle>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.upcomingAppointments}</div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Scheduled visits</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Approved</CardTitle>
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                    <DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalAmountApproved)}</div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Total reimbursed</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Insurance/Bank Stats */}
              {session.user.role === UserRole.INSURANCE ? (
                <>
                  {/* Insurance Specific Stats */}
                  <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Claims</CardTitle>
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalClaims}</div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">All submitted claims</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    onClick={() => router.push('/insurance/approved-claims')}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Approved</CardTitle>
                      <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.approvedClaims}</div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Click to view approved claims</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    onClick={() => router.push('/insurance/pending-claims')}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Review</CardTitle>
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingClaims}</div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Click to review claims</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Rejected</CardTitle>
                      <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{stats.rejectedClaims}</div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Claims denied</p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  {/* Bank Specific Stats */}
                  <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Approved Claims</CardTitle>
                      <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.approvedClaims}</div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Ready for payment</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Paid Claims</CardTitle>
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                        <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {claims.filter((c: Claim) => c.status === ClaimStatus.PAID).length}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Successfully processed</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Payment</CardTitle>
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {claims.filter((c: Claim) => c.status === ClaimStatus.APPROVED).length}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Awaiting disbursement</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Clients</CardTitle>
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {new Set(claims.map((c: Claim) => c.patientName).filter(Boolean)).size}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Active beneficiaries</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>

        {/* Additional Insurance/Bank Stats Row */}
        {(session.user.role === UserRole.INSURANCE || session.user.role === UserRole.BANK) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {session.user.role === UserRole.INSURANCE ? (
              <>
                <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Claim Value</CardTitle>
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalAmount)}</div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Total claimed amount</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Approved Amount</CardTitle>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.approvedAmount)}</div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Amount approved</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Today&apos;s Claims</CardTitle>
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.todaysClaims}</div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Submitted today</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Bank Specific Stats */}
                <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount to Disburse</CardTitle>
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <DollarSign className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {formatCurrency(claims
                        .filter((c: Claim) => c.status === ClaimStatus.APPROVED)
                        .reduce((sum: number, claim: Claim) => sum + (parseFloat(claim.approvedAmount || '0') || parseFloat(claim.claimAmount)), 0)
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Pending payments</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Disbursed</CardTitle>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                      <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(claims
                        .filter((c: Claim) => c.status === ClaimStatus.PAID)
                        .reduce((sum: number, claim: Claim) => sum + (parseFloat(claim.approvedAmount || '0') || parseFloat(claim.claimAmount)), 0)
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Total paid out</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing Rate</CardTitle>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {(() => {
                        const totalApproved = claims.filter((c: Claim) => c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.PAID).length
                        const paid = claims.filter((c: Claim) => c.status === ClaimStatus.PAID).length
                        return totalApproved > 0 ? Math.round((paid / totalApproved) * 100) : 0
                      })()}%
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Claims processed</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Stats Summary for Insurance/Bank */}
        {(session.user.role === UserRole.INSURANCE || session.user.role === UserRole.BANK) && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 mb-8 sm:mb-12">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {session.user.role === UserRole.INSURANCE ? 'Processing Summary' : 'Payment Processing Summary'}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                {session.user.role === UserRole.INSURANCE 
                  ? 'Overview of claim processing efficiency and financial impact'
                  : 'Overview of payment processing and disbursement analytics'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {session.user.role === UserRole.INSURANCE ? (
                  <>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.totalClaims > 0 ? Math.round((stats.approvedClaims / stats.totalClaims) * 100) : 0}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Approval Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {stats.totalClaims > 0 ? Math.round((stats.pendingClaims / stats.totalClaims) * 100) : 0}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.totalAmount > 0 ? Math.round((stats.approvedAmount / stats.totalAmount) * 100) : 0}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Payout Ratio</p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Bank Analytics */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {(() => {
                          const totalApproved = claims.filter((c: Claim) => c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.PAID).length
                          const paid = claims.filter((c: Claim) => c.status === ClaimStatus.PAID).length
                          return totalApproved > 0 ? Math.round((paid / totalApproved) * 100) : 0
                        })()}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Payment Success Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {claims.filter((c: Claim) => c.status === ClaimStatus.APPROVED).length}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending Disbursements</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {(() => {
                          const totalPaidAmount = claims
                            .filter((c: Claim) => c.status === ClaimStatus.PAID)
                            .reduce((sum: number, claim: Claim) => sum + (parseFloat(claim.approvedAmount || '0') || parseFloat(claim.claimAmount)), 0)
                          const totalApprovedAmount = claims
                            .filter((c: Claim) => c.status === ClaimStatus.APPROVED || c.status === ClaimStatus.PAID)
                            .reduce((sum: number, claim: Claim) => sum + (parseFloat(claim.approvedAmount || '0') || parseFloat(claim.claimAmount)), 0)
                          return totalApprovedAmount > 0 ? Math.round((totalPaidAmount / totalApprovedAmount) * 100) : 0
                        })()}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Amount Disbursed</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Analytics - Bank Only */}
        {session.user.role === UserRole.BANK && (
          <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 mb-8 sm:mb-12">
            <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Payment Analytics</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Comprehensive analysis of payment processing and disbursement patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Average Processing Time</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2.3 days</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Approval to payment</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Daily Payment Volume</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(claims
                      .filter((c: Claim) => {
                        const today = new Date()
                        const claimDate = new Date(c.createdAt)
                        return c.status === ClaimStatus.PAID && claimDate.toDateString() === today.toDateString()
                      })
                      .reduce((sum: number, claim: Claim) => sum + (parseFloat(claim.approvedAmount || '0') || parseFloat(claim.claimAmount)), 0)
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Processed today</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Success Rate</h4>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">99.8%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Payment success</p>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Queue Status</h4>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {claims.filter((c: Claim) => c.status === ClaimStatus.APPROVED).length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">In payment queue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            {session.user.role === UserRole.PATIENT && (
              <>
                <GradientButton 
                  gradient="blue"
                  onClick={() => setIsNewClaimModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Claim
                </GradientButton>
                
                <GradientButton 
                  gradient="green"
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </GradientButton>
                
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
              <>
                <Button 
                  onClick={() => router.push('/insurance/manage-users')}
                  variant="outline" 
                  className="w-full sm:w-auto border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                
                {session.user.role === UserRole.INSURANCE ? (
                  <>
                    <GradientButton 
                      gradient="blue"
                      onClick={() => router.push('/insurance/claims')}
                      className="w-full sm:w-auto"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      See Claims
                    </GradientButton>
                    
                    <GradientButton 
                      gradient="amber"
                      onClick={() => router.push('/insurance/claim-requests')}
                      className="w-full sm:w-auto"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Users Requested for Claim
                    </GradientButton>
                    
                    <GradientButton 
                      gradient="amber"
                      onClick={() => router.push('/insurance/pending-claims')}
                      className="w-full sm:w-auto"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Review Pending Claims
                    </GradientButton>
                    
                    <GradientButton 
                      gradient="green"
                      onClick={() => router.push('/insurance/approved-claims')}
                      className="w-full sm:w-auto"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approved Claims
                    </GradientButton>
                  </>
                ) : (
                  <>
                    {/* Bank Specific Actions */}
                    <GradientButton 
                      gradient="green"
                      onClick={() => router.push('/bank/payment-queue')}
                      className="w-full sm:w-auto"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payment Queue
                    </GradientButton>
                    
                    <GradientButton 
                      gradient="blue"
                      onClick={() => router.push('/bank/payment-history')}
                      className="w-full sm:w-auto"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Payment History
                    </GradientButton>
                    
                    <GradientButton 
                      gradient="purple"
                      onClick={() => router.push('/bank/transaction-reports')}
                      className="w-full sm:w-auto"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Transaction Reports
                    </GradientButton>
                    
                    <Button 
                      onClick={() => router.push('/bank/bulk-payment')}
                      variant="outline"
                      className="w-full sm:w-auto border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Bulk Payment Processing
                    </Button>
                  </>
                )}
              </>
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
                    // Always scroll to appointment requests section
                    scrollToAppointmentRequests()
                    // Toggle the management state for visual feedback
                    setIsAppointmentManagementOpen(!isAppointmentManagementOpen)
                  }}
                  variant="outline" 
                  className="w-full sm:w-auto border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  disabled={isLoadingAppointments}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Appointments
                  {isLoadingAppointments ? (
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

        {/* Insurance Dashboard Sections */}
        {session.user.role === UserRole.INSURANCE && (
          <>
            {/* Today's Claims */}
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 mb-8 sm:mb-12">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Today&apos;s Claims</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Claims submitted by patients today that need your attention
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading today's claims..." />
                  </div>
                ) : (() => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const tomorrow = new Date(today)
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  
                  const todaysClaims = claims.filter((claim: any) => {
                    const claimDate = new Date(claim.createdAt)
                    return claimDate >= today && claimDate < tomorrow && claim.status !== 'DRAFT'
                  })
                  
                  return todaysClaims.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <div className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-700 dark:to-blue-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 dark:text-blue-300" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No claims today</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                        No new claims were submitted today. Check back later or review pending claims.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 px-4 sm:px-6">
                      {todaysClaims.map((claim: any) => (
                        <Card key={claim.id} className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 font-mono text-sm">
                                    {claim.claimNumber}
                                  </h4>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                    {claim.diagnosis}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Patient: {claim.patient?.name || 'Unknown Patient'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Amount: {formatCurrency(parseFloat(claim.claimAmount))}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <StatusBadge status={claim.status} />
                                <Button 
                                  size="sm"
                                  onClick={() => handleViewClaimDetails(claim.id)}
                                  variant="outline"
                                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-950/20"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
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

            {/* Claim Status Management */}
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 mb-8 sm:mb-12">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Claim Status Management</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Review and update claim statuses for submitted claims
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading claim status..." />
                  </div>
                ) : (() => {
                  const submittedClaims = claims.filter((claim: any) => 
                    claim.status === 'SUBMITTED' || claim.status === 'UNDER_REVIEW'
                  )
                  
                  return submittedClaims.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <div className="bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-700 dark:to-amber-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <Settings className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600 dark:text-amber-300" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No claims pending review</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                        All submitted claims have been processed. New claims will appear here for status management.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 px-4 sm:px-6">
                      {submittedClaims.map((claim: any) => (
                        <Card key={claim.id} className="border border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Claim Information */}
                              <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-3">
                                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 font-mono text-lg">
                                          {claim.claimNumber}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          Submitted {formatDate(claim.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Status:</span>
                                      <StatusBadge status={claim.status} />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Patient:</span>
                                      <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                        {claim.patient?.name || 'Unknown'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</span>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {claim.patient?.email || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                                      <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">
                                        {formatCurrency(parseFloat(claim.claimAmount))}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Diagnosis:</span>
                                      <span className="text-sm text-gray-600 dark:text-gray-400 max-w-40 truncate">
                                        {claim.diagnosis}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {claim.notes && (
                                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes:</span>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{claim.notes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Status Management */}
                              <div className="space-y-4">
                                <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-center">Update Status</h5>
                                
                                <div className="space-y-3">
                                  <Button 
                                    onClick={() => handleStatusChange(claim.id, 'UNDER_REVIEW')}
                                    disabled={updatingClaimId === claim.id || claim.status === 'UNDER_REVIEW'}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {updatingClaimId === claim.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                      <Clock className="h-4 w-4 mr-2" />
                                    )}
                                    Under Review
                                  </Button>

                                  <Button 
                                    onClick={() => handleStatusChange(claim.id, 'APPROVED')}
                                    disabled={updatingClaimId === claim.id || claim.status === 'APPROVED'}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {updatingClaimId === claim.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Approve
                                  </Button>

                                  <Button 
                                    onClick={() => handleStatusChange(claim.id, 'REJECTED')}
                                    disabled={updatingClaimId === claim.id || claim.status === 'REJECTED'}
                                    variant="outline"
                                    className="w-full border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-400 dark:hover:border-red-500 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {updatingClaimId === claim.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                    ) : (
                                      <X className="h-4 w-4 mr-2" />
                                    )}
                                    Reject
                                  </Button>
                                </div>

                                <div className="pt-3 border-t border-gray-200 dark:border-slate-600">
                                  <Button 
                                    onClick={() => handleViewClaimDetails(claim.id)}
                                    variant="ghost"
                                    className="w-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Full Details
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

            {/* All Submitted Claims */}
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 mb-8 sm:mb-12">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">All Submitted Claims</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Complete list of claims submitted by patients for review and processing
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading all claims..." />
                  </div>
                ) : claims.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No claims found</h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                      No claims have been submitted yet. Claims will appear here as patients submit them.
                    </p>
                  </div>
                ) : (() => {
                  const submittedClaims = claims.filter((claim: any) => claim.status !== 'DRAFT')
                  
                  return submittedClaims.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No submitted claims found</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                        No claims have been submitted yet. Only submitted claims (not drafts) will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Claim Number</TableHead>
                              <TableHead>Patient</TableHead>
                              <TableHead>Diagnosis</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Submitted</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {submittedClaims.map((claim: any) => (
                            <TableRow key={claim.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                              <TableCell className="font-mono text-sm">{claim.claimNumber}</TableCell>
                              <TableCell className="font-medium">{claim.patient?.name || 'Unknown'}</TableCell>
                              <TableCell className="max-w-xs truncate">{claim.diagnosis}</TableCell>
                              <TableCell>{formatCurrency(parseFloat(claim.claimAmount))}</TableCell>
                              <TableCell>
                                <StatusBadge status={claim.status} />
                              </TableCell>
                              <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(claim.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm"
                                  onClick={() => handleViewClaimDetails(claim.id)}
                                  variant="ghost"
                                  className="hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400"
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
                  )
                })()}
              </CardContent>
            </Card>
          </>
        )}

        {/* Bank Dashboard Sections */}
        {session.user.role === UserRole.BANK && (
          <>
            {/* Approved Claims Ready for Payment */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-slate-50 to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-green-950 mb-8 sm:mb-12 overflow-hidden">
              <CardHeader className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white p-8">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl font-bold text-white mb-2">
                          Approved Claims
                        </CardTitle>
                        <CardDescription className="text-green-100 text-lg">
                          Claims approved by insurance, ready for payment processing
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-white">
                        {claims.filter((claim: any) => claim.status === 'APPROVED').length}
                      </div>
                      <p className="text-green-100">Ready</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading approved claims..." />
                  </div>
                ) : (() => {
                  const approvedClaims = claims.filter((claim: any) => claim.status === 'APPROVED')
                  
                  return approvedClaims.length === 0 ? (
                    <div className="text-center py-12 px-6">
                      <div className="relative mx-auto w-32 h-32 mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full shadow-lg"></div>
                        <div className="absolute inset-4 bg-gradient-to-br from-green-200 to-emerald-200 dark:from-green-800/50 dark:to-emerald-800/50 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Approved Claims</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-lg">
                        No claims have been approved for payment yet. Approved claims will appear here automatically.
                      </p>
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-300 font-semibold">Waiting for approvals</span>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <Table>
                        <TableHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                          <TableRow className="border-gray-200 dark:border-slate-600">
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Claim #</TableHead>
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Patient</TableHead>
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Diagnosis</TableHead>
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Amount</TableHead>
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Approved</TableHead>
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Status</TableHead>
                            <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedClaims.map((claim: any, index: number) => (
                            <TableRow 
                              key={claim.id} 
                              className={`border-gray-200 dark:border-slate-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/20 dark:hover:to-emerald-950/20 transition-all duration-200 ${
                                index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-800/50'
                              }`}
                            >
                              <TableCell className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100 py-4 px-4 sm:px-6">
                                {claim.claimNumber}
                              </TableCell>
                              <TableCell className="text-gray-700 dark:text-gray-200 py-4 px-4 sm:px-6 font-medium">
                                {claim.patient?.name || claim.patientName || 'N/A'}
                              </TableCell>
                              <TableCell className="text-gray-700 dark:text-gray-200 py-4 px-4 sm:px-6">
                                <span className="line-clamp-2">{claim.diagnosis}</span>
                              </TableCell>
                              <TableCell className="text-gray-700 dark:text-gray-200 py-4 px-4 sm:px-6 font-semibold">
                                {formatCurrency(parseFloat(claim.claimAmount))}
                              </TableCell>
                              <TableCell className="text-green-600 dark:text-green-400 py-4 px-4 sm:px-6 font-semibold">
                                {formatCurrency(parseFloat(claim.approvedAmount || claim.claimAmount))}
                              </TableCell>
                              <TableCell className="py-4 px-4 sm:px-6">
                                <StatusBadge status={claim.status} />
                              </TableCell>
                              <TableCell className="text-right py-4 px-4 sm:px-6">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    onClick={() => handleViewClaimDetails(claim.id)}
                                    variant="outline"
                                    className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        // Show processing state
                                        toast.info('Processing payment...')
                                        
                                        // First create payment record with PROCESSING status
                                        const paymentResponse = await fetch('/api/payments', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            claimId: claim.id,
                                            amount: parseFloat(claim.approvedAmount || claim.claimAmount),
                                            paymentMethod: 'BANK_TRANSFER',
                                            notes: `Payment processed for claim ${claim.claimNumber}`
                                          }),
                                        })

                                        if (!paymentResponse.ok) {
                                          const errorData = await paymentResponse.json()
                                          throw new Error(errorData.error || 'Failed to create payment record')
                                        }

                                        const paymentData = await paymentResponse.json()
                                        console.log('Payment created:', paymentData)

                                        // Then update claim status to PAID
                                        const statusResponse = await fetch(`/api/claims/${claim.id}`, {
                                          method: 'PATCH',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({ status: 'PAID' }),
                                        })

                                        if (!statusResponse.ok) {
                                          throw new Error('Failed to update claim status')
                                        }

                                        toast.success('Payment is now processing!')
                                        // Refresh both claims and payments data
                                        queryClient.invalidateQueries({ queryKey: ['claims'] })
                                        refetchPayments()
                                      } catch (error) {
                                        console.error('Error processing payment:', error)
                                        toast.error(`Failed to process payment: ${(error as Error)?.message || 'Unknown error'}`)
                                      }
                                    }}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                  >
                                    <CreditCard className="h-4 w-4 mr-1" />
                                    Process Payment
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

            {/* Payment Queue - Pending Payments */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 mb-8 sm:mb-12 overflow-hidden">
              <CardHeader className="relative bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white p-8">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                        <Clock className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl font-bold text-white mb-2">
                          Payment Queue
                        </CardTitle>
                        <CardDescription className="text-amber-100 text-lg">
                          Payments currently being processed
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-white">
                        {paymentsData?.filter((payment: any) => payment.status === 'PROCESSING').length || 0}
                      </div>
                      <p className="text-amber-100">Processing</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoadingPayments ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading payment queue..." />
                  </div>
                ) : (() => {
                  const processingPayments = paymentsData?.filter((payment: any) => payment.status === 'PROCESSING') || []
                  
                  return processingPayments.length === 0 ? (
                    <div className="text-center py-12 px-6">
                      <div className="relative mx-auto w-32 h-32 mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full shadow-lg"></div>
                        <div className="absolute inset-4 bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-800/50 dark:to-orange-800/50 rounded-full flex items-center justify-center">
                          <Clock className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Processing Payments</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-lg">
                        No payments are currently being processed. Payments will appear here when processing starts.
                      </p>
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-700 dark:text-amber-300 font-semibold">Queue is clear!</span>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <Table>
                        <TableHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                          <TableRow className="border-gray-200 dark:border-slate-600">
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Claim ID</TableHead>
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Patient</TableHead>
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Amount</TableHead>
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Status</TableHead>
                            <TableHead className="text-left text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Started</TableHead>
                            <TableHead className="text-right text-gray-700 dark:text-gray-300 font-semibold py-4 px-4 sm:px-6">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processingPayments.map((payment: any, index: number) => (
                            <TableRow 
                              key={payment.id} 
                              className={`border-gray-200 dark:border-slate-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 dark:hover:from-amber-950/20 dark:hover:to-yellow-950/20 transition-all duration-200 ${
                                index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-800/50'
                              }`}
                            >
                              <TableCell className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100 py-4 px-4 sm:px-6">
                                {payment.claimId.substring(0, 8)}...
                              </TableCell>
                              <TableCell className="text-gray-700 dark:text-gray-200 py-4 px-4 sm:px-6 font-medium">
                                {payment.claim?.patient?.name || 'N/A'}
                              </TableCell>
                              <TableCell className="text-gray-700 dark:text-gray-200 py-4 px-4 sm:px-6 font-semibold">
                                {formatCurrency(payment.amount)}
                              </TableCell>
                              <TableCell className="py-4 px-4 sm:px-6">
                                <PaymentStatusBadge status={payment.status} size="sm" />
                              </TableCell>
                              <TableCell className="text-gray-700 dark:text-gray-200 py-4 px-4 sm:px-6 text-sm">
                                {formatDate(payment.processedAt || payment.createdAt)}
                              </TableCell>
                              <TableCell className="text-right py-4 px-4 sm:px-6">
                                <EnhancedActionButton
                                  action="manage"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPaymentId(payment.id)
                                    setIsPaymentModalOpen(true)
                                  }}
                                />
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

            {/* Processing Payments - Remove this section since Payment Queue now handles it */}
            {/* This section is removed - Payment Queue now shows PROCESSING payments */}

            {/* Recent Payment Transactions */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-slate-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950 mb-8 sm:mb-12 overflow-hidden">
              <CardHeader className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white p-8">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl font-bold text-white mb-2">
                          Transaction History
                        </CardTitle>
                        <CardDescription className="text-emerald-100 text-lg">
                          Recently completed payment transactions and disbursements
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-white">
                        {paymentsData?.filter((payment: any) => ['COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(payment.status)).length || 0}
                      </div>
                      <p className="text-emerald-100">Completed</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoadingPayments ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading..." />
                  </div>
                ) : (() => {
                  const completedPayments = paymentsData
                    ?.filter((payment: any) => ['COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(payment.status))
                    ?.sort((a: any, b: any) => new Date(b.processedAt || b.updatedAt).getTime() - new Date(a.processedAt || a.updatedAt).getTime()) || []
                  
                  return completedPayments.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <div className="bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-700 dark:to-emerald-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600 dark:text-emerald-300" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">No transactions yet</h3>
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                        No payments have been processed yet. Completed transactions will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 px-4 sm:px-6">
                      {completedPayments.slice(0, 6).map((payment: any) => (
                        <Card key={payment.id} className={`border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 ${
                          payment.status === 'COMPLETED' 
                            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
                            : payment.status === 'FAILED'
                            ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20'
                            : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-lg ${
                                  payment.status === 'COMPLETED' 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                    : payment.status === 'FAILED'
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : 'bg-gray-100 dark:bg-gray-900/30'
                                }`}>
                                  {payment.status === 'COMPLETED' ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                  ) : payment.status === 'FAILED' ? (
                                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                  ) : (
                                    <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 font-mono text-sm">
                                    {payment.claimId.substring(0, 8)}...
                                  </h4>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                    {payment.claim?.patient?.name || 'Unknown Patient'}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {payment.claim?.diagnosis || 'Payment transaction'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Processed: {formatDate(payment.processedAt || payment.updatedAt)}
                                  </p>
                                  {payment.transactionId && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                      TXN: {payment.transactionId}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <PaymentStatusBadge status={payment.status} />
                                <p className={`text-lg font-bold mt-2 ${
                                  payment.status === 'COMPLETED' 
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : payment.status === 'FAILED'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {formatCurrency(payment.amount)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {completedPayments.length > 6 && (
                        <div className="text-center pt-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing 6 of {completedPayments.length} completed transactions
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </>
        )}

        {/* Doctor Dashboard Sections */}
        {session.user.role === UserRole.DOCTOR && (
          <>
            {/* Today's Appointments */}
            <Card className="border-0 shadow-2xl bg-white dark:bg-slate-800 mb-8 sm:mb-12">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Today&apos;s Appointments</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Your scheduled appointments for today
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoadingAppointments ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading..." />
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
                        You don&apos;t have any scheduled appointments for today. Check back tomorrow or view all appointments.
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
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Today&apos;s Patients</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Patients you&apos;ll see today with their appointment details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoadingAppointments ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading..." />
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
                        You don&apos;t have any patients scheduled for today.
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
            <Card id="appointment-requests-section" className="border-0 shadow-2xl bg-white dark:bg-slate-800 mb-8 sm:mb-12 transition-all duration-500 rounded-lg">
              <CardHeader className="border-b border-gray-200 dark:border-slate-700 pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Appointment Requests</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Pending appointment requests that need your approval
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoadingAppointments ? (
                  <div className="flex justify-center py-8 sm:py-12">
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading..." />
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
                        You don&apos;t have any pending appointment requests at the moment.
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
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading..." />
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
                    <EnhancedLoadingSpinner variant="gradient" size="lg" text="Loading..." />
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
        session={session}
      />

      {/* Payment Management Modal */}
      <PaymentManagementModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        payment={selectedPayment}
        onPaymentUpdate={() => {
          // Refresh payments data after update
          refetchPayments()
        }}
      />
    </div>
  )
}
