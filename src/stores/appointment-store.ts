import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AppointmentStatus = 'pending' | 'accepted' | 'rejected'

export interface Appointment {
  id: string
  doctorId: string
  patientId: string
  date: string
  time: string
  status: AppointmentStatus
}

interface AppointmentStore {
  selectedDoctor: string | null
  appointments: Appointment[]
  setSelectedDoctor: (id: string) => void
  addAppointment: (appt: Appointment) => void
  updateStatus: (id: string, status: AppointmentStatus) => void
  clearAppointments: () => void
}

export const useAppointmentStore = create<AppointmentStore>()(
  persist(
    (set) => ({
      selectedDoctor: null,
      appointments: [],
      setSelectedDoctor: (id) => set({ selectedDoctor: id }),
      addAppointment: (appt) =>
        set((state) => ({ appointments: [...state.appointments, appt] })),
      updateStatus: (id, status) =>
        set((state) => ({
          appointments: state.appointments.map((appt) =>
            appt.id === id ? { ...appt, status } : appt
          ),
        })),
      clearAppointments: () => set({ appointments: [] }),
    }),
    { name: 'appointment-store' }
  )
)
