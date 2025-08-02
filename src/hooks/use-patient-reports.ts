import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ReportType } from '@/types'

interface PatientReport {
  id: string
  patientId: string
  doctorId: string
  appointmentId: string | null
  reportType: ReportType
  title: string
  description: string
  diagnosis: string | null
  treatment: string | null
  medications: string | null
  recommendations: string | null
  followUpDate: string | null
  documentUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  patient: {
    id: string
    name: string | null
    email: string
  }
  doctor: {
    id: string
    name: string | null
    email: string
  }
  appointment?: {
    id: string
    scheduledAt: string
    patient: {
      id: string
      name: string | null
      email: string
    }
    doctor?: {
      id: string
      name: string | null
      email: string
    }
  } | null
}

interface PatientReportsResponse {
  reports: PatientReport[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface PatientReportFilters {
  patientId?: string
  doctorId?: string
  appointmentId?: string
  reportType?: ReportType
  isActive?: boolean
  page?: number
  limit?: number
}

interface CreatePatientReportData {
  patientId: string
  appointmentId?: string
  reportType: ReportType
  title: string
  description: string
  diagnosis?: string
  treatment?: string
  medications?: string
  recommendations?: string
  followUpDate?: string
  documentUrl?: string
}

interface UpdatePatientReportData {
  title?: string
  description?: string
  diagnosis?: string
  treatment?: string
  medications?: string
  recommendations?: string
  followUpDate?: string
  documentUrl?: string
  isActive?: boolean
}

interface AttachReportToClaimData {
  claimId: string
  reportId: string
}

const API_BASE = '/api'

export function usePatientReports(filters: PatientReportFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.patientId) params.append('patientId', filters.patientId)
  if (filters.doctorId) params.append('doctorId', filters.doctorId)
  if (filters.appointmentId) params.append('appointmentId', filters.appointmentId)
  if (filters.reportType) params.append('reportType', filters.reportType)
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  return useQuery<PatientReportsResponse>({
    queryKey: ['patient-reports', filters],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/patient-reports?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch patient reports')
      }
      return response.json()
    },
  })
}

export function usePatientReport(id: string) {
  return useQuery<PatientReport>({
    queryKey: ['patient-report', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/patient-reports/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch patient report')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreatePatientReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePatientReportData) => {
      const response = await fetch(`${API_BASE}/patient-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create patient report')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-reports'] })
    },
  })
}

export function useUpdatePatientReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePatientReportData }) => {
      const response = await fetch(`${API_BASE}/patient-reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update patient report')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['patient-reports'] })
      queryClient.invalidateQueries({ queryKey: ['patient-report', id] })
    },
  })
}

export function useDeletePatientReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/patient-reports/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete patient report')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-reports'] })
    },
  })
}

export function useAttachReportToClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AttachReportToClaimData) => {
      const response = await fetch(`${API_BASE}/claims/${data.claimId}/attach-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId: data.reportId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to attach report to claim')
      }

      return response.json()
    },
    onSuccess: (_, { claimId }) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] })
      queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
      queryClient.invalidateQueries({ queryKey: ['patient-reports'] })
    },
  })
}

export function useDetachReportFromClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ claimId, reportId }: { claimId: string; reportId: string }) => {
      const response = await fetch(`${API_BASE}/claims/${claimId}/detach-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to detach report from claim')
      }

      return response.json()
    },
    onSuccess: (_, { claimId }) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] })
      queryClient.invalidateQueries({ queryKey: ['claim', claimId] })
      queryClient.invalidateQueries({ queryKey: ['patient-reports'] })
    },
  })
}
