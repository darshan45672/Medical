'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  Download,
  Phone,
  Mail,
  MapPin,
  Eye,
  CalendarCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { UserRole, AppointmentStatus } from '@/types'
import { toast } from 'sonner'

interface AppointmentDetail {
  id: string
  scheduledAt: string
  status: string
  notes?: string
  patient: {
    id: string
    name: string
    email: string
    phone?: string
    address?: string
  }
  doctor: {
    id: string
    name: string
    email: string
  }
  reports: Array<{
    id: string
    title: string
    description?: string
    createdAt: string
    type: string
    fileUrl?: string
    fileName?: string
  }>
}

interface AppointmentPageProps {
  params: Promise<{
    id: string
  }>
}

export default function AppointmentPage({ params }: AppointmentPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'patient' | 'reports'>('overview')
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const getAppointmentId = async () => {
      const resolvedParams = await params
      setAppointmentId(resolvedParams.id)
    }
    getAppointmentId()
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
    if (session?.user?.role === UserRole.DOCTOR && appointmentId) {
      fetchAppointmentDetails()
    }
  }, [session, appointmentId, fetchAppointmentDetails])

  const handleDownloadReport = async (reportId: string, fileName: string) => {
    try {
      setDownloadingReport(reportId)
      const response = await fetch(`/api/reports/${reportId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        link.remove()
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

  const handleViewReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/view`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
      } else {
        toast.error('Failed to view report')
      }
    } catch (error) {
      console.error('Error viewing report:', error)
      toast.error('Error viewing report')
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== UserRole.DOCTOR) {
    router.push('/dashboard')
    return null
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Appointment not found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The appointment you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to view it.
              </p>
              <Link href="/appointments">
                <Button className="cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Appointments
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
          <Link href="/appointments">
            <Button variant="ghost" className="mb-4 cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Appointments
            </Button>
          </Link>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-3 sm:mb-4">
              Appointment with {appointment.patient.name}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300">
              Complete appointment details and patient information
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-gray-200 dark:border-slate-700">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('overview')}
              className="cursor-pointer"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Appointment Overview
            </Button>
            <Button
              variant={activeTab === 'patient' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('patient')}
              className="cursor-pointer"
            >
              <User className="h-4 w-4 mr-2" />
              Patient Information
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('reports')}
              className="cursor-pointer"
            >
              <FileText className="h-4 w-4 mr-2" />
              Reports ({appointment.reports.length})
            </Button>
          </div>
        </div>

        {/* Appointment Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Appointment Details */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                  Appointment Details
                  {getStatusBadge(appointment.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(appointment.scheduledAt).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clinical Notes */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Clinical Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointment.notes ? (
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {appointment.notes}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No clinical notes
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      No clinical notes have been added for this appointment yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Patient Information Tab */}
        {activeTab === 'patient' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{appointment.patient.email}</p>
                    </div>
                  </div>
                  
                  {appointment.patient.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{appointment.patient.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {appointment.patient.address && (
                  <div className="flex items-start space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{appointment.patient.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href={`/patients/${appointment.patient.id}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    View Complete Patient Profile
                  </Button>
                </Link>
                
                <Button 
                  variant="outline"
                  className="w-full border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 cursor-pointer"
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Schedule Follow-up
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 cursor-pointer"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Medical Report
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Medical Reports
              </CardTitle>
              <CardDescription>
                All medical reports and documents for this patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointment.reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No reports available
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Medical reports and documents will appear here once they are uploaded.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Report Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date Created</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointment.reports
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((report) => (
                            <TableRow key={report.id}>
                              <TableCell>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {report.title}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {report.type.replace('_', ' ').toLowerCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {new Date(report.createdAt).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  {report.description ? (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{report.description}</p>
                                  ) : (
                                    <span className="text-sm text-gray-400">No description</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewReport(report.id)}
                                    className="cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  {report.fileName && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadReport(report.id, report.fileName!)}
                                      disabled={downloadingReport === report.id}
                                      className="cursor-pointer"
                                    >
                                      {downloadingReport === report.id ? (
                                        <LoadingSpinner size="sm" />
                                      ) : (
                                        <Download className="h-4 w-4 mr-1" />
                                      )}
                                      Download
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {appointment.reports
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((report) => (
                        <Card key={report.id} className="border border-gray-200 dark:border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {report.title}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(report.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant="outline" className="ml-2 capitalize">
                                {report.type.replace('_', ' ').toLowerCase()}
                              </Badge>
                            </div>

                            {report.description && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 rounded p-2">
                                  {report.description}
                                </p>
                              </div>
                            )}

                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewReport(report.id)}
                                className="flex-1 cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {report.fileName && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadReport(report.id, report.fileName!)}
                                  disabled={downloadingReport === report.id}
                                  className="flex-1 cursor-pointer"
                                >
                                  {downloadingReport === report.id ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-1" />
                                  )}
                                  Download
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    }
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
