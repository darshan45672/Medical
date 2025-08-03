'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  CalendarCheck,
  XCircle,
  Stethoscope
} from 'lucide-react'
import Link from 'next/link'
import { UserRole, AppointmentStatus } from '@/types'
import { toast } from 'sonner'

interface AppointmentDetail {
  id: string
  scheduledAt: string
  status: string
  notes?: string
  doctor: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
    specialization?: string
  }
  reports: Array<{
    id: string
    reportType: string
    fileName: string
    uploadedAt: string
    fileSize?: number
  }>
}

interface AppointmentPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PatientAppointmentPage({ params }: AppointmentPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'doctor' | 'reports'>('overview')
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setAppointmentId(resolvedParams.id)
    }
    getParams()
  }, [params])

  const fetchAppointmentDetails = useCallback(async () => {
    if (!appointmentId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/appointments/${appointmentId}`)
      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
      } else {
        console.error('Failed to fetch appointment details')
        toast.error('Failed to fetch appointment details')
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error)
      toast.error('Error fetching appointment details')
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    if (appointmentId && session?.user?.role === UserRole.PATIENT) {
      fetchAppointmentDetails()
    }
  }, [appointmentId, session, fetchAppointmentDetails])

  const handleViewReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/view`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
        window.URL.revokeObjectURL(url)
      } else {
        toast.error('Failed to view report')
      }
    } catch (error) {
      console.error('Error viewing report:', error)
      toast.error('Error viewing report')
    }
  }

  const handleDownloadReport = async (reportId: string, fileName: string) => {
    try {
      setDownloadingReport(reportId)
      const response = await fetch(`/api/reports/${reportId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Report downloaded successfully')
      } else {
        toast.error('Failed to download report')
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Error downloading report')
    } finally {
      setDownloadingReport(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:bg-yellow-950/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      case AppointmentStatus.ACCEPTED:
        return <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:bg-blue-950/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      case AppointmentStatus.CONSULTED:
        return <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:bg-purple-950/30">
          <CalendarCheck className="h-3 w-3 mr-1" />
          Consulted
        </Badge>
      case AppointmentStatus.COMPLETED:
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-400 dark:bg-green-950/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      case AppointmentStatus.REJECTED:
        return <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 dark:border-red-600 dark:text-red-400 dark:bg-red-950/30">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

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

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="text-center py-12">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Appointment not found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The appointment you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
              </p>
              <Link href="/patient-appointments">
                <Button variant="outline" className="cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to My Appointments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/patient-appointments">
            <Button variant="ghost" className="mb-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-md group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back to My Appointments</span>
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Appointment Details
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                View your appointment information and medical reports
              </p>
            </div>
            {getStatusBadge(appointment.status)}
          </div>
        </div>

        {/* Quick Info Card */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-white/90 via-white/80 to-white/90 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-800/90 backdrop-blur-xl mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Doctor</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Dr. {appointment.doctor.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(appointment.scheduledAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reports</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {appointment.reports?.length || 0} Available
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg mb-8">
          <CardHeader className="pb-0">
            <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('overview')}
                className={`flex-1 min-w-0 rounded-md transition-all duration-200 ${
                  activeTab === 'overview' 
                    ? 'bg-white dark:bg-slate-600 shadow-sm' 
                    : 'hover:bg-white/50 dark:hover:bg-slate-600/50'
                }`}
              >
                <CalendarCheck className="h-4 w-4 mr-2" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'doctor' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('doctor')}
                className={`flex-1 min-w-0 rounded-md transition-all duration-200 ${
                  activeTab === 'doctor' 
                    ? 'bg-white dark:bg-slate-600 shadow-sm' 
                    : 'hover:bg-white/50 dark:hover:bg-slate-600/50'
                }`}
              >
                <User className="h-4 w-4 mr-2" />
                Doctor Info
              </Button>
              <Button
                variant={activeTab === 'reports' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('reports')}
                className={`flex-1 min-w-0 rounded-md transition-all duration-200 ${
                  activeTab === 'reports' 
                    ? 'bg-white dark:bg-slate-600 shadow-sm' 
                    : 'hover:bg-white/50 dark:hover:bg-slate-600/50'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Reports ({appointment.reports?.length || 0})
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Appointment Information */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Appointment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Appointment ID</label>
                    <p className="text-sm font-mono bg-gray-100 dark:bg-slate-700 p-2 rounded mt-1">
                      {appointment.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(appointment.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(appointment.scheduledAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </p>
                  </div>
                </div>

                {appointment.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Appointment Notes</label>
                    <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{appointment.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Doctor Summary */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Doctor Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {appointment.doctor.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Dr. {appointment.doctor.name}
                    </h3>
                    {appointment.doctor.specialization && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {appointment.doctor.specialization}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {appointment.doctor.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {appointment.doctor.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{appointment.doctor.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">{appointment.doctor.email}</span>
                  </div>
                  {appointment.doctor.address && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{appointment.doctor.address}</span>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/doctors/${appointment.doctor.id}`}>
                    View Doctor Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'doctor' && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Doctor Information
              </CardTitle>
              <CardDescription>
                Complete information about your doctor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Doctor Profile */}
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                      {appointment.doctor.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Dr. {appointment.doctor.name}
                      </h2>
                      {appointment.doctor.specialization && (
                        <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                          {appointment.doctor.specialization}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Board-certified physician with expertise in patient care
                      </p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.doctor.email}</p>
                        </div>
                      </div>
                      
                      {appointment.doctor.phone && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Phone</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.doctor.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      {appointment.doctor.address && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <MapPin className="h-5 w-5 text-red-600 dark:text-red-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Address</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.doctor.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Professional Information */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Professional Information</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Doctor ID</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-mono">{appointment.doctor.id.slice(0, 8)}...</p>
                      </div>
                      
                      {appointment.doctor.specialization && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Specialization</p>
                          <p className="text-sm text-purple-700 dark:text-purple-300">{appointment.doctor.specialization}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href={`/doctors/${appointment.doctor.id}`}>
                          <User className="h-4 w-4 mr-2" />
                          View Full Profile
                        </Link>
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <a href={`mailto:${appointment.doctor.email}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </a>
                      </Button>
                      
                      {appointment.doctor.phone && (
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <a href={`tel:${appointment.doctor.phone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Doctor
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'reports' && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                Medical Reports ({appointment.reports?.length || 0})
              </CardTitle>
              <CardDescription>
                View and download your medical reports from this appointment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!appointment.reports || appointment.reports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No reports available</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    No medical reports have been uploaded for this appointment yet. Reports will appear here once your doctor uploads them.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {appointment.reports.map((report) => (
                    <Card key={report.id} className="border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {report.reportType}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {report.fileName}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Uploaded:</span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {new Date(report.uploadedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {report.fileSize && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Size:</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {formatFileSize(report.fileSize)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewReport(report.id)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownloadReport(report.id, report.fileName)}
                            disabled={downloadingReport === report.id}
                            className="flex-1"
                          >
                            {downloadingReport === report.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
