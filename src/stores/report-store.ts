import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ReportStatus = 'pending' | 'finalized'

export interface Report {
  id: string
  appointmentId: string
  doctorId: string
  patientId: string
  url: string
  createdAt: string
  status: ReportStatus
}

interface ReportStore {
  reports: Report[]
  addReport: (report: Report) => void
  updateReportStatus: (id: string, status: ReportStatus) => void
  clearReports: () => void
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set) => ({
      reports: [],
      addReport: (report) =>
        set((state) => ({ reports: [...state.reports, report] })),
      updateReportStatus: (id, status) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        })),
      clearReports: () => set({ reports: [] }),
    }),
    { name: 'report-store' }
  )
)
