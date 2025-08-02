import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, AppointmentStatus } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== UserRole.DOCTOR) {
      return NextResponse.json({ error: 'Access denied. Only doctors can view patient details.' }, { status: 403 })
    }

    const { id: patientId } = await params

    // Fetch patient details with all related data
    const patient = await prisma.user.findFirst({
      where: {
        id: patientId,
        role: UserRole.PATIENT,
        // Ensure this doctor has had appointments with this patient
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

    if (!patient) {
      return NextResponse.json({ 
        error: 'Patient not found or you do not have access to this patient' 
      }, { status: 404 })
    }

    // Transform the data to match our interface
    const transformedPatient = {
      id: patient.id,
      name: patient.name || 'Unknown',
      email: patient.email,
      phone: patient.phone,
      address: patient.address,
      // Note: dateOfBirth, gender, emergencyContact are not in current schema
      // We'll add them later if needed
      appointments: patient.appointmentsAsPatient.map(apt => ({
        id: apt.id,
        scheduledAt: apt.scheduledAt.toISOString(),
        status: apt.status,
        notes: apt.notes,
        // For diagnosis, we'll need to get it from related PatientReports
      })),
      reports: patient.patientReports.map(report => ({
        id: report.id,
        title: report.title,
        description: report.description,
        createdAt: report.createdAt.toISOString(),
        type: report.reportType,
        fileName: report.documentUrl ? `${report.title}.pdf` : undefined,
        fileUrl: report.documentUrl
      }))
    }

    // Enhance appointments with diagnosis from related reports
    const enhancedAppointments = await Promise.all(
      transformedPatient.appointments.map(async (apt) => {
        const relatedReport = await prisma.patientReport.findFirst({
          where: {
            appointmentId: apt.id,
            doctorId: session.user.id
          }
        })
        
        return {
          ...apt,
          diagnosis: relatedReport?.diagnosis,
          prescription: relatedReport?.medications,
          followUpDate: relatedReport?.followUpDate?.toISOString()
        }
      })
    )

    return NextResponse.json({ 
      patient: {
        ...transformedPatient,
        appointments: enhancedAppointments
      }
    })

  } catch (error) {
    console.error('Error fetching patient details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient details' },
      { status: 500 }
    )
  }
}
