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
  CalendarCheck
} from 'lucide-react'
import Link from 'next/link'
import { UserRole, AppointmentStatus } from '@/types'
import { toast } from 'sonner'

interface PatientDetail {
  id: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  emergencyContact?: string
  appointments: Array<{
    id: string
    scheduledAt: string
    status: string
    diagnosis?: string
    notes?: string
    prescription?: string
    followUpDate?: string
  }>
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

interface PatientPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PatientPage({ params }: PatientPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'reports'>('overview')
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    const getPatientId = async () => {
      const resolvedParams = await params
      setPatientId(resolvedParams.id)
    }
    getPatientId()
  }, [params])

  const fetchPatientDetails = useCallback(async () => {
    if (!patientId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data.patient)
      } else {
        console.error('Failed to fetch patient details')
        toast.error('Failed to fetch patient details')
      }
    } catch (error) {
      console.error('Error fetching patient details:', error)
      toast.error('Error fetching patient details')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    if (session?.user?.role === UserRole.DOCTOR && patientId) {
      fetchPatientDetails()
    }
  }, [session, patientId, fetchPatientDetails])

  const handleDownloadReport = async (report: any) => {
    try {
      setDownloadingReport(report.id)
      
      // Check if we have a direct S3 URL
      if (report.fileUrl && report.fileUrl.includes('amazonaws.com')) {
        // Use direct S3 URL
        const link = document.createElement('a')
        link.href = report.fileUrl
        link.download = report.fileName || `report_${report.id}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        link.remove()
        toast.success('Report download started')
        return
      }
      
      // Fallback to API endpoint
      const response = await fetch(`/api/reports/${report.id}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = report.fileName || `report_${report.id}.pdf`
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

  const handleViewReport = async (report: any) => {
    try {
      // Check if we have a direct S3 URL
      if (report.fileUrl && report.fileUrl.includes('amazonaws.com')) {
        // Open S3 URL directly in new tab
        window.open(report.fileUrl, '_blank')
        return
      }
      
      // Fallback to API endpoint for blob generation
      const response = await fetch(`/api/reports/${report.id}/view`)
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

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Patient not found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The patient you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to view their details.
              </p>
              <Link href="/patients">
                <Button className="cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Patients
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const completedAppointments = patient.appointments.filter(apt => 
    apt.status === AppointmentStatus.COMPLETED || apt.status === AppointmentStatus.CONSULTED
  )

  const getAge = () => {
    if (!patient.dateOfBirth) return null
    return new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/patients">
            <Button variant="ghost" className="mb-4 cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Button>
          </Link>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-3 sm:mb-4">
              {patient.name}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300">
              Complete patient medical records and consultation history
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
              <User className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'appointments' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('appointments')}
              className="cursor-pointer"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Appointments ({completedAppointments.length})
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('reports')}
              className="cursor-pointer"
            >
              <FileText className="h-4 w-4 mr-2" />
              Reports ({patient.reports.length})
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
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
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.email}</p>
                    </div>
                  </div>
                  
                  {patient.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.phone}</p>
                      </div>
                    </div>
                  )}

                  {patient.dateOfBirth && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getAge()} years (DOB: {new Date(patient.dateOfBirth).toLocaleDateString()})
                        </p>
                      </div>
                    </div>
                  )}

                  {patient.gender && (
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{patient.gender}</p>
                      </div>
                    </div>
                  )}
                </div>

                {patient.address && (
                  <div className="flex items-start space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.address}</p>
                    </div>
                  </div>
                )}

                {patient.emergencyContact && (
                  <div className="flex items-start space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Emergency Contact</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient.emergencyContact}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medical Summary */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Medical Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {completedAppointments.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Consultations</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {patient.reports.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Medical Reports</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    {completedAppointments
                      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                      .slice(0, 3)
                      .map((appointment) => (
                        <div key={appointment.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <CalendarCheck className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {appointment.diagnosis || 'Consultation'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(appointment.scheduledAt).toLocaleDateString()} at{' '}
                              {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    }
                    
                    {completedAppointments.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No consultations completed yet
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Consultation History
              </CardTitle>
              <CardDescription>
                Complete history of all consultations with {patient.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No consultations yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Consultation history will appear here once you complete appointments with this patient.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Diagnosis</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Follow-up</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedAppointments
                          .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                          .map((appointment) => (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {new Date(appointment.scheduledAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {appointment.diagnosis || 'General Consultation'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={appointment.status === AppointmentStatus.COMPLETED ? 'default' : 'secondary'}>
                                  {appointment.status === AppointmentStatus.COMPLETED ? 'Completed' : 'Consulted'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  {appointment.notes ? (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{appointment.notes}</p>
                                  ) : (
                                    <span className="text-sm text-gray-400">No notes</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {appointment.followUpDate ? (
                                  <div className="text-sm">
                                    {new Date(appointment.followUpDate).toLocaleDateString()}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">None</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {completedAppointments
                      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                      .map((appointment) => (
                        <Card key={appointment.id} className="border border-gray-200 dark:border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {appointment.diagnosis || 'General Consultation'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(appointment.scheduledAt).toLocaleDateString()} at{' '}
                                  {new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <Badge variant={appointment.status === AppointmentStatus.COMPLETED ? 'default' : 'secondary'}>
                                {appointment.status === AppointmentStatus.COMPLETED ? 'Completed' : 'Consulted'}
                              </Badge>
                            </div>

                            {appointment.notes && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes:</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700 rounded p-2">
                                  {appointment.notes}
                                </p>
                              </div>
                            )}

                            {appointment.followUpDate && (
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Follow-up:</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {new Date(appointment.followUpDate).toLocaleDateString()}
                                </p>
                              </div>
                            )}
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

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Medical Reports
              </CardTitle>
              <CardDescription>
                All medical reports and documents for {patient.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patient.reports.length === 0 ? (
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
                        {patient.reports
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
                                    onClick={() => handleViewReport(report)}
                                    className="cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  {report.fileName && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadReport(report)}
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
                    {patient.reports
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
                                onClick={() => handleViewReport(report)}
                                className="flex-1 cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {report.fileName && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadReport(report)}
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
