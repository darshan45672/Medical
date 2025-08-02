import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, AppointmentStatus } from '@/types'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== UserRole.DOCTOR) {
      return NextResponse.json({ error: 'Access denied. Only doctors can view patients.' }, { status: 403 })
    }

    // Fetch all patients who have completed or consulted appointments with this doctor
    const patients = await prisma.user.findMany({
      where: {
        role: UserRole.PATIENT,
        appointmentsAsPatient: {
          some: {
            doctorId: session.user.id,
            status: {
              in: [AppointmentStatus.COMPLETED, AppointmentStatus.CONSULTED]
            }
          }
        }
      },
      include: {
        appointmentsAsPatient: {
          where: {
            doctorId: session.user.id
          },
          orderBy: {
            scheduledAt: 'desc'
          }
        },
        patientReports: {
          where: {
            doctorId: session.user.id
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Transform the data to match our interface
    const transformedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.name || 'Unknown',
      email: patient.email,
      phone: patient.phone,
      // Note: dateOfBirth and gender are not in the current schema
      // We'll add them later if needed
      appointments: patient.appointmentsAsPatient.map(apt => ({
        id: apt.id,
        scheduledAt: apt.scheduledAt.toISOString(),
        status: apt.status,
        // Note: diagnosis is not in Appointment schema, it's in PatientReport
        notes: apt.notes
      })),
      reports: patient.patientReports.map(report => ({
        id: report.id,
        title: report.title,
        createdAt: report.createdAt.toISOString(),
        type: report.reportType
      }))
    }))

    return NextResponse.json({ 
      patients: transformedPatients,
      total: transformedPatients.length 
    })

  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    )
  }
}
