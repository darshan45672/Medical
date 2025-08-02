'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Search, 
  User, 
  Users,
  CalendarCheck,
  Clock,
  SortAsc,
  SortDesc,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { UserRole, AppointmentStatus } from '@/types'

interface Patient {
  id: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  appointments: Array<{
    id: string
    scheduledAt: string
    status: string
    diagnosis?: string
    notes?: string
  }>
  reports: Array<{
    id: string
    title: string
    createdAt: string
    type: string
  }>
}

export default function PatientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'lastAppointment' | 'totalAppointments'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'frequent'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.role === UserRole.DOCTOR) {
      fetchPatients()
    }
  }, [session])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      } else {
        console.error('Failed to fetch patients')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
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

  // Filter patients based on search term and filter criteria
  const filteredPatients = patients
    .filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesSearch) return false

      switch (filterBy) {
        case 'recent':
          const hasRecentAppointment = patient.appointments.some(apt => {
            const appointmentDate = new Date(apt.scheduledAt)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            return appointmentDate >= thirtyDaysAgo && 
                   (apt.status === AppointmentStatus.COMPLETED || apt.status === AppointmentStatus.CONSULTED)
          })
          return hasRecentAppointment
        case 'frequent':
          const completedAppointments = patient.appointments.filter(apt => 
            apt.status === AppointmentStatus.COMPLETED || apt.status === AppointmentStatus.CONSULTED
          )
          return completedAppointments.length >= 3
        default:
          return patient.appointments.some(apt => 
            apt.status === AppointmentStatus.COMPLETED || apt.status === AppointmentStatus.CONSULTED
          )
      }
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'lastAppointment':
          const aLastAppointment = Math.max(...a.appointments.map(apt => new Date(apt.scheduledAt).getTime()))
          const bLastAppointment = Math.max(...b.appointments.map(apt => new Date(apt.scheduledAt).getTime()))
          comparison = aLastAppointment - bLastAppointment
          break
        case 'totalAppointments':
          const aTotal = a.appointments.filter(apt => 
            apt.status === AppointmentStatus.COMPLETED || apt.status === AppointmentStatus.CONSULTED
          ).length
          const bTotal = b.appointments.filter(apt => 
            apt.status === AppointmentStatus.COMPLETED || apt.status === AppointmentStatus.CONSULTED
          ).length
          comparison = aTotal - bTotal
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getPatientStats = (patient: Patient) => {
    const completedAppointments = patient.appointments.filter(apt => 
      apt.status === AppointmentStatus.COMPLETED || apt.status === AppointmentStatus.CONSULTED
    )
    const lastAppointment = completedAppointments
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())[0]
    
    return {
      totalAppointments: completedAppointments.length,
      totalReports: patient.reports.length,
      lastAppointmentDate: lastAppointment ? new Date(lastAppointment.scheduledAt) : null,
      lastDiagnosis: lastAppointment?.diagnosis
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-3 sm:mb-4">
              My Patients
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              Manage and view detailed information about your patients who have completed consultations
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Search & Filter Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterBy === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterBy('all')}
                  className="cursor-pointer"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Patients
                </Button>
                <Button
                  variant={filterBy === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterBy('recent')}
                  className="cursor-pointer"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Recent (30 days)
                </Button>
                <Button
                  variant={filterBy === 'frequent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterBy('frequent')}
                  className="cursor-pointer"
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Frequent (3+ visits)
                </Button>
              </div>

              {/* Sort Options */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('name')}
                  className="cursor-pointer"
                >
                  Name
                  {sortBy === 'name' && (
                    sortOrder === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('lastAppointment')}
                  className="cursor-pointer"
                >
                  Last Visit
                  {sortBy === 'lastAppointment' && (
                    sortOrder === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSort('totalAppointments')}
                  className="cursor-pointer"
                >
                  Total Visits
                  {sortBy === 'totalAppointments' && (
                    sortOrder === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="text-center py-12">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm || filterBy !== 'all' ? 'No patients found' : 'No patients yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Patients will appear here once you complete consultations with them.'
                }
              </p>
              {(searchTerm || filterBy !== 'all') && (
                <Button 
                  onClick={() => {
                    setSearchTerm('')
                    setFilterBy('all')
                  }}
                  variant="outline"
                  className="cursor-pointer"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => {
              const stats = getPatientStats(patient)
              
              return (
                <Card key={patient.id} className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {patient.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {patient.email}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {stats.totalAppointments} visit{stats.totalAppointments !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Patient Info */}
                    <div className="space-y-3">
                      {patient.phone && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium w-16">Phone:</span>
                          <span>{patient.phone}</span>
                        </div>
                      )}
                      {patient.dateOfBirth && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium w-16">Age:</span>
                          <span>{new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years</span>
                        </div>
                      )}
                      {patient.gender && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium w-16">Gender:</span>
                          <span className="capitalize">{patient.gender}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {stats.totalReports}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Reports</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {stats.lastAppointmentDate ? (
                            stats.lastAppointmentDate.toLocaleDateString()
                          ) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Last Visit</div>
                      </div>
                    </div>

                    {/* Last Diagnosis */}
                    {stats.lastDiagnosis && (
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Diagnosis:</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-700 rounded p-2 truncate">
                          {stats.lastDiagnosis}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-4">
                      <Link href={`/patients/${patient.id}`} className="w-full">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          View Patient Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredPatients.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredPatients.length} of {patients.length} patients
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
