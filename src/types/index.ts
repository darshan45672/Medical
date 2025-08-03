// Types for the application - mirrors Prisma schema enums
// These are safe to use on both client and server side

export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  INSURANCE = 'INSURANCE',
  BANK = 'BANK'
}

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

export enum DocumentType {
  MEDICAL_REPORT = 'MEDICAL_REPORT',
  PRESCRIPTION = 'PRESCRIPTION',
  SCAN_REPORT = 'SCAN_REPORT'
}

export enum ReportType {
  DIAGNOSIS_REPORT = 'DIAGNOSIS_REPORT',
  TREATMENT_SUMMARY = 'TREATMENT_SUMMARY',
  PRESCRIPTION_REPORT = 'PRESCRIPTION_REPORT',
  LAB_REPORT = 'LAB_REPORT',
  SCAN_REPORT = 'SCAN_REPORT',
  FOLLOW_UP_REPORT = 'FOLLOW_UP_REPORT',
  DISCHARGE_SUMMARY = 'DISCHARGE_SUMMARY'
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  CONSULTED = 'CONSULTED',
  COMPLETED = 'COMPLETED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Type interfaces for common data structures
export interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
}

export interface Claim {
  id: string
  claimNumber: string
  status: ClaimStatus
  claimAmount: string
  patientName: string
  dateSubmitted: string
  description: string
  diagnosis: string
  treatmentDate: string
  createdAt: string
  approvedAmount?: string
  doctor?: {
    id: string
    name: string | null
  }
}

export interface Appointment {
  id: string
  scheduledAt: string
  status: AppointmentStatus
  notes?: string
  patient: {
    id: string
    name: string | null
    email: string
    phone?: string
  }
  doctor: {
    id: string
    name: string | null
    email: string
  }
}
