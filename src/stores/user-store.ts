import { create } from 'zustand'
import { UserRole } from '@prisma/client'

interface UserProfile {
  id: string
  email: string
  name?: string | null
  role: UserRole
  phone?: string | null
  address?: string | null
}

interface UserState {
  profile: UserProfile | null
  isLoading: boolean
  
  // Actions
  setProfile: (profile: UserProfile | null) => void
  updateProfile: (data: Partial<UserProfile>) => void
  setLoading: (isLoading: boolean) => void
  clearProfile: () => void
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isLoading: false,

  setProfile: (profile) => set({ profile }),

  updateProfile: (data) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...data } : null,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  clearProfile: () => set({ profile: null }),
}))