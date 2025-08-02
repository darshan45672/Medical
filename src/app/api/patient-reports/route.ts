import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReportType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const doctorId = searchParams.get('doctorId')
    const appointmentId = searchParams.get('appointmentId')
    const reportType = searchParams.get('reportType') as ReportType | null
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const whereClause: Record<string, unknown> = {}

    // Role-based access control
    if (session.user.role === 'PATIENT') {
      whereClause.patientId = session.user.id
    } else if (session.user.role === 'DOCTOR') {
      whereClause.doctorId = session.user.id
    }
    // INSURANCE and BANK can see all reports

    // Apply filters
    if (patientId) whereClause.patientId = patientId
    if (doctorId) whereClause.doctorId = doctorId
    if (appointmentId) whereClause.appointmentId = appointmentId
    if (reportType) whereClause.reportType = reportType
    if (isActive !== null) whereClause.isActive = isActive === 'true'

    const reports = await prisma.patientReport.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        },
        doctor: {
          select: { id: true, name: true, email: true }
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            patient: {
              select: { id: true, name: true, email: true }
            },
            doctor: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        claimReports: {
          include: {
            claim: {
              select: { id: true, claimNumber: true, status: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await prisma.patientReport.count({ where: whereClause })

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching patient reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Only doctors can create patient reports' }, { status: 403 })
    }

    const body = await request.json()
    const {
      patientId,
      appointmentId,
      reportType,
      title,
      description,
      diagnosis,
      treatment,
      medications,
      recommendations,
      followUpDate,
      documentUrl
    } = body

    if (!patientId || !reportType || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify that the appointment belongs to the doctor (if appointmentId is provided)
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      })

      if (!appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }

      if (appointment.doctorId !== session.user.id) {
        return NextResponse.json({ error: 'You can only create reports for your own appointments' }, { status: 403 })
      }

      if (appointment.patientId !== patientId) {
        return NextResponse.json({ error: 'Patient ID does not match appointment' }, { status: 400 })
      }
    }

    const report = await prisma.patientReport.create({
      data: {
        patientId,
        doctorId: session.user.id,
        appointmentId,
        reportType,
        title,
        description,
        diagnosis,
        treatment,
        medications,
        recommendations,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        documentUrl,
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        },
        doctor: {
          select: { id: true, name: true, email: true }
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            patient: {
              select: { id: true, name: true, email: true }
            },
            doctor: {
              select: { id: true, name: true, email: true }
            }
          }
        },
      },
    })

    // Update appointment status to COMPLETED when a report is created
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      })
      
      console.log(`✅ Appointment ${appointmentId} marked as COMPLETED after report creation`)
    }

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating patient report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
