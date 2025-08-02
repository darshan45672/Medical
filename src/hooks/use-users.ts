import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserRole } from '@/types'

interface UserFilters {
  role?: UserRole
  search?: string
}

interface CreateUserData {
  email: string
  password: string
  name?: string
  role: UserRole
  phone?: string
  address?: string
}

const API_BASE = '/api'

export function useUsers(filters: UserFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.role) params.append('role', filters.role)
  if (filters.search) params.append('search', filters.search)

  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/users?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}