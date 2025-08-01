import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Document {
  id: string
  appointmentId: string | null
  type: 'MEDICAL_REPORT' | 'PRESCRIPTION' | 'SCAN_REPORT'
  filename: string
  originalName: string
  url: string
  size: number
  mimeType: string
  uploadedAt: string
  uploadedById: string | null
  uploadedBy?: {
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
  }
}

interface DocumentsResponse {
  documents: Document[]
}

interface UseDocumentsOptions {
  appointmentId?: string
  patientId?: string
  enabled?: boolean
}

export function useDocuments(options: UseDocumentsOptions = {}) {
  const { appointmentId, patientId, enabled = true } = options

  return useQuery<DocumentsResponse>({
    queryKey: ['documents', appointmentId, patientId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (appointmentId) params.append('appointmentId', appointmentId)
      if (patientId) params.append('patientId', patientId)

      const response = await fetch(`/api/documents?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      return response.json()
    },
    enabled,
  })
}

export function useUploadDocuments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch documents queries
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
