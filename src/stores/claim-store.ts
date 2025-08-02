import { create } from 'zustand'
import { Claim, DocumentType } from '@prisma/client'

interface ClaimFormData {
  diagnosis: string
  treatmentDate: Date | string
  claimAmount: number
  description?: string
  doctorId?: string
}

interface DocumentUpload {
  id: string
  file: File
  type: DocumentType
  preview: string
}

interface ClaimState {
  currentClaim: Partial<Claim> | null
  claimForm: ClaimFormData
  documents: DocumentUpload[]
  isSubmitting: boolean
  
  // Actions
  setCurrentClaim: (claim: Partial<Claim> | null) => void
  updateClaimForm: (data: Partial<ClaimFormData>) => void
  addDocument: (document: DocumentUpload) => void
  removeDocument: (id: string) => void
  clearDocuments: () => void
  setSubmitting: (isSubmitting: boolean) => void
  resetForm: () => void
}

const initialFormData: ClaimFormData = {
  diagnosis: '',
  treatmentDate: '',
  claimAmount: 0,
  description: '',
  doctorId: '',
}

export const useClaimStore = create<ClaimState>((set) => ({
  currentClaim: null,
  claimForm: initialFormData,
  documents: [],
  isSubmitting: false,

  setCurrentClaim: (claim) => set({ currentClaim: claim }),
  
  updateClaimForm: (data) =>
    set((state) => ({
      claimForm: { ...state.claimForm, ...data },
    })),

  addDocument: (document) =>
    set((state) => ({
      documents: [...state.documents, document],
    })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    })),

  clearDocuments: () => set({ documents: [] }),

  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  resetForm: () =>
    set({
      claimForm: initialFormData,
      documents: [],
      currentClaim: null,
      isSubmitting: false,
    }),
}))