import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppointmentStatus } from '@/types'

interface AppointmentFilters {
  status?: AppointmentStatus
  doctorId?: string
  patientId?: string
  page?: number
  limit?: number
}

interface CreateAppointmentData {
  doctorId: string
  scheduledAt: string
  notes?: string
}

interface UpdateAppointmentData {
  status?: AppointmentStatus
  notes?: string
  scheduledAt?: string
}

const API_BASE = '/api'

export function useAppointments(filters: AppointmentFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.status) params.append('status', filters.status)
  if (filters.doctorId) params.append('doctorId', filters.doctorId)
  if (filters.patientId) params.append('patientId', filters.patientId)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/appointments?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }
      return response.json()
    },
  })
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/appointments/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch appointment')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      const response = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create appointment')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAppointmentData }) => {
      const response = await fetch(`${API_BASE}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update appointment')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment', id] })
    },
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/appointments/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete appointment')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}
