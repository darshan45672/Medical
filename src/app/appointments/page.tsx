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
  Calendar, 
  Clock,
  User,
  SortAsc,
  SortDesc,
  ArrowLeft,
  CalendarCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import { UserRole, AppointmentStatus } from '@/types'
import { toast } from 'sonner'

interface Appointment {
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
}

export default function AppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'patient' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<'all' | 'pending' | 'accepted' | 'consulted' | 'completed'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.role === UserRole.DOCTOR) {
      fetchAppointments()
    }
  }, [session])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appointments')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      } else {
        console.error('Failed to fetch appointments')
        toast.error('Failed to fetch appointments')
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Error fetching appointments')
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

  // Filter appointments based on search term and filter criteria
  const filteredAppointments = appointments
    .filter(appointment => {
      const matchesSearch = appointment.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          appointment.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (appointment.notes && appointment.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      
      if (!matchesSearch) return false

      switch (filterBy) {
        case 'pending':
          return appointment.status === AppointmentStatus.PENDING
        case 'accepted':
          return appointment.status === AppointmentStatus.ACCEPTED
        case 'consulted':
          return appointment.status === AppointmentStatus.CONSULTED
        case 'completed':
          return appointment.status === AppointmentStatus.COMPLETED
        default:
          return true
      }
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          break
        case 'patient':
          comparison = a.patient.name.localeCompare(b.patient.name)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
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

  const getAppointmentStats = () => {
    const total = appointments.length
    const pending = appointments.filter(apt => apt.status === AppointmentStatus.PENDING).length
    const accepted = appointments.filter(apt => apt.status === AppointmentStatus.ACCEPTED).length
    const consulted = appointments.filter(apt => apt.status === AppointmentStatus.CONSULTED).length
    const completed = appointments.filter(apt => apt.status === AppointmentStatus.COMPLETED).length

    return { total, pending, accepted, consulted, completed }
  }

  const stats = getAppointmentStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-md group">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">Back to Dashboard</span>
            </Button>
          </Link>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent mb-3 sm:mb-4">
              All My Appointments
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              Manage and view all patient appointments across all statuses
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.accepted}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Accepted</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.consulted}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Consulted</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-white/90 via-white/80 to-white/90 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-800/90 backdrop-blur-xl mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20"></div>
          <div className="relative">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Search & Filter Appointments
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Find and organize your appointments with advanced search and filtering options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Bar */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Appointments</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 h-5 w-5 transition-colors duration-200" />
                  <Input
                    placeholder="Search by patient name, email, or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 text-base bg-white/70 dark:bg-slate-700/70 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-inner backdrop-blur-sm"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 group"
                    >
                      <XCircle className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors duration-200" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status</label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={filterBy === 'all' ? 'default' : 'outline'}
                    size="default"
                    onClick={() => setFilterBy('all')}
                    className={`cursor-pointer rounded-full px-6 py-3 font-semibold transition-all duration-300 transform relative overflow-hidden group ${
                      filterBy === 'all' 
                        ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 shadow-lg hover:shadow-2xl hover:scale-110 text-white border-0' 
                        : 'border-2 border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-950/30 hover:scale-105 hover:shadow-lg bg-white/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      All Appointments
                      <Badge variant="secondary" className={`ml-2 text-xs font-bold ${
                        filterBy === 'all' 
                          ? 'bg-white/30 text-white border-white/20' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      }`}>
                        {stats.total}
                      </Badge>
                    </span>
                    {filterBy !== 'all' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </Button>
                  
                  <Button
                    variant={filterBy === 'pending' ? 'default' : 'outline'}
                    size="default"
                    onClick={() => setFilterBy('pending')}
                    className={`cursor-pointer rounded-full px-6 py-3 font-semibold transition-all duration-300 transform relative overflow-hidden group ${
                      filterBy === 'pending' 
                        ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 shadow-lg hover:shadow-2xl hover:scale-110 text-white border-0' 
                        : 'border-2 border-yellow-300 text-yellow-700 hover:border-yellow-400 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-950/30 hover:scale-105 hover:shadow-lg bg-white/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Pending
                      <Badge variant="secondary" className={`ml-2 text-xs font-bold ${
                        filterBy === 'pending' 
                          ? 'bg-white/30 text-white border-white/20' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                      }`}>
                        {stats.pending}
                      </Badge>
                    </span>
                    {filterBy !== 'pending' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </Button>
                  
                  <Button
                    variant={filterBy === 'accepted' ? 'default' : 'outline'}
                    size="default"
                    onClick={() => setFilterBy('accepted')}
                    className={`cursor-pointer rounded-full px-6 py-3 font-semibold transition-all duration-300 transform relative overflow-hidden group ${
                      filterBy === 'accepted' 
                        ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 shadow-lg hover:shadow-2xl hover:scale-110 text-white border-0' 
                        : 'border-2 border-blue-300 text-blue-700 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-950/30 hover:scale-105 hover:shadow-lg bg-white/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accepted
                      <Badge variant="secondary" className={`ml-2 text-xs font-bold ${
                        filterBy === 'accepted' 
                          ? 'bg-white/30 text-white border-white/20' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      }`}>
                        {stats.accepted}
                      </Badge>
                    </span>
                    {filterBy !== 'accepted' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </Button>
                  
                  <Button
                    variant={filterBy === 'consulted' ? 'default' : 'outline'}
                    size="default"
                    onClick={() => setFilterBy('consulted')}
                    className={`cursor-pointer rounded-full px-6 py-3 font-semibold transition-all duration-300 transform relative overflow-hidden group ${
                      filterBy === 'consulted' 
                        ? 'bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 hover:from-purple-600 hover:via-violet-600 hover:to-pink-600 shadow-lg hover:shadow-2xl hover:scale-110 text-white border-0' 
                        : 'border-2 border-purple-300 text-purple-700 hover:border-purple-400 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-950/30 hover:scale-105 hover:shadow-lg bg-white/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      Consulted
                      <Badge variant="secondary" className={`ml-2 text-xs font-bold ${
                        filterBy === 'consulted' 
                          ? 'bg-white/30 text-white border-white/20' 
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                      }`}>
                        {stats.consulted}
                      </Badge>
                    </span>
                    {filterBy !== 'consulted' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </Button>
                  
                  <Button
                    variant={filterBy === 'completed' ? 'default' : 'outline'}
                    size="default"
                    onClick={() => setFilterBy('completed')}
                    className={`cursor-pointer rounded-full px-6 py-3 font-semibold transition-all duration-300 transform relative overflow-hidden group ${
                      filterBy === 'completed' 
                        ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-2xl hover:scale-110 text-white border-0' 
                        : 'border-2 border-green-300 text-green-700 hover:border-green-400 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-950/30 hover:scale-105 hover:shadow-lg bg-white/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Completed
                      <Badge variant="secondary" className={`ml-2 text-xs font-bold ${
                        filterBy === 'completed' 
                          ? 'bg-white/30 text-white border-white/20' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      }`}>
                        {stats.completed}
                      </Badge>
                    </span>
                    {filterBy !== 'completed' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </Button>
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort Options</label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={sortBy === 'date' ? 'default' : 'outline'}
                    size="default"
                    onClick={() => toggleSort('date')}
                    className={`cursor-pointer rounded-2xl px-8 py-3 font-semibold transition-all duration-300 transform relative overflow-hidden group ${
                      sortBy === 'date'
                        ? 'bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 shadow-xl hover:shadow-2xl hover:scale-110 text-white border-0'
                        : 'border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50 hover:scale-105 hover:shadow-lg bg-white/70 dark:bg-slate-800/70'
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      <Calendar className="h-5 w-5 mr-3" />
                      <span className="text-base">Date</span>
                      {sortBy === 'date' && (
                        <span className="ml-3 p-1 bg-white/20 rounded-full">
                          {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        </span>
                      )}
                    </span>
                    {sortBy !== 'date' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-slate-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </Button>
                  
                  <Button
                    variant={sortBy === 'patient' ? 'default' : 'outline'}
                    size="default"
                    onClick={() => toggleSort('patient')}
                    className={`cursor-pointer rounded-2xl px-8 py-3 font-semibold transition-all duration-300 transform relative overflow-hidden group ${
                      sortBy === 'patient'
                        ? 'bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 shadow-xl hover:shadow-2xl hover:scale-110 text-white border-0'
                        : 'border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50 hover:scale-105 hover:shadow-lg bg-white/70 dark:bg-slate-800/70'
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      <User className="h-5 w-5 mr-3" />
                      <span className="text-base">Patient</span>
                      {sortBy === 'patient' && (
                        <span className="ml-3 p-1 bg-white/20 rounded-full">
                          {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        </span>
                      )}
                    </span>
                    {sortBy !== 'patient' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-slate-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </Button>
                  
                  <Button
                    variant={sortBy === 'status' ? 'default' : 'outline'}
                    size="default"
                    onClick={() => toggleSort('status')}
                    className={`cursor-pointer rounded-2xl px-8 py-3 font-semibold transition-all duration-300 transform relative overflow-hidden group ${
                      sortBy === 'status'
                        ? 'bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 shadow-xl hover:shadow-2xl hover:scale-110 text-white border-0'
                        : 'border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50 hover:scale-105 hover:shadow-lg bg-white/70 dark:bg-slate-800/70'
                    }`}
                  >
                    <span className="relative z-10 flex items-center">
                      <Tag className="h-5 w-5 mr-3" />
                      <span className="text-base">Status</span>
                      {sortBy === 'status' && (
                        <span className="ml-3 p-1 bg-white/20 rounded-full">
                          {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        </span>
                      )}
                    </span>
                    {sortBy !== 'status' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-slate-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </Button>
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchTerm || filterBy !== 'all') && (
                <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-medium">Active filters:</span>
                    {searchTerm && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Search: &quot;{searchTerm}&quot;
                      </Badge>
                    )}
                    {filterBy !== 'all' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Status: {filterBy}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setFilterBy('all')
                    }}
                    className="text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 dark:text-blue-400 dark:hover:text-white rounded-xl px-4 py-2 font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg">
            <CardContent className="text-center py-12">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm || filterBy !== 'all' ? 'No appointments found' : 'No appointments yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Appointments will appear here once patients book with you.'
                }
              </p>
              {(searchTerm || filterBy !== 'all') && (
                <Button 
                  onClick={() => {
                    setSearchTerm('')
                    setFilterBy('all')
                  }}
                  variant="outline"
                  className="cursor-pointer border-2 border-blue-300 text-blue-700 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:border-transparent dark:border-blue-600 dark:text-blue-400 dark:hover:text-white rounded-xl px-6 py-2 font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {appointment.patient.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {appointment.patient.email}
                      </CardDescription>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Appointment Info */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{new Date(appointment.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {appointment.patient.phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium w-16">Phone:</span>
                        <span>{appointment.patient.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Appointment Notes */}
                  {appointment.notes && (
                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes:</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-700 rounded p-2 truncate">
                        {appointment.notes}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4">
                    <Link href={`/appointments/${appointment.id}`} className="w-full">
                      <Button className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-pointer rounded-xl py-3 font-semibold text-white border-0 relative overflow-hidden group">
                        <span className="relative z-10 flex items-center justify-center">
                          <User className="h-5 w-5 mr-2" />
                          View Appointment Details
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:translate-x-full"></div>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredAppointments.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAppointments.length} of {appointments.length} appointments
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
