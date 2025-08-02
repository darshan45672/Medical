import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClaimStatus } from '@/types'

interface ClaimFilters {
  status?: ClaimStatus
  page?: number
  limit?: number
}

interface CreateClaimData {
  diagnosis: string
  treatmentDate: string
  claimAmount: number
  description?: string
  doctorId?: string
}

interface UpdateClaimData {
  status?: ClaimStatus
  approvedAmount?: number
  rejectionReason?: string
  notes?: string
}

const API_BASE = '/api'

export function useClaims(filters: ClaimFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.status) params.append('status', filters.status)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  return useQuery({
    queryKey: ['claims', filters],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/claims?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch claims')
      }
      return response.json()
    },
  })
}

export function useClaim(id: string) {
  return useQuery({
    queryKey: ['claim', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/claims/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch claim')
      }
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateClaimData) => {
      const response = await fetch(`${API_BASE}/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create claim')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] })
    },
  })
}

export function useUpdateClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClaimData }) => {
      const response = await fetch(`${API_BASE}/claims/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update claim')
      }

      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] })
      queryClient.invalidateQueries({ queryKey: ['claim', id] })
    },
  })
}

export function useDeleteClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/claims/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete claim')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] })
    },
  })
}