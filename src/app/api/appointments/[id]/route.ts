import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            phone: true,
            address: true
          }
        },
        doctor: {
          select: { id: true, name: true, email: true, phone: true }
        }
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Check authorization
    const canView = 
      session.user.role === 'INSURANCE' ||
      session.user.role === 'BANK' ||
      appointment.patientId === session.user.id ||
      appointment.doctorId === session.user.id

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch patient reports related to this patient
    const reports = await prisma.patientReport.findMany({
      where: {
        patientId: appointment.patientId,
        ...(session.user.role === 'DOCTOR' ? { doctorId: session.user.id } : {}),
        ...(session.user.role === 'PATIENT' ? { patientId: session.user.id } : {}),
        // Insurance and Bank users can see all reports for this patient
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        reportType: true,
        documentUrl: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transform reports to match the expected interface
    const transformedReports = reports.map(report => ({
      id: report.id,
      title: report.title,
      description: report.description,
      createdAt: report.createdAt,
      type: report.reportType,
      fileName: report.documentUrl ? report.documentUrl.split('/').pop() : undefined,
      fileUrl: report.documentUrl
    }))

    const appointmentWithReports = {
      ...appointment,
      reports: transformedReports
    }

    return NextResponse.json({ appointment: appointmentWithReports })
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes, scheduledAt } = body

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Check authorization for updates
    const canUpdate = 
      (session.user.role === 'PATIENT' && existingAppointment.patientId === session.user.id) ||
      (session.user.role === 'DOCTOR' && existingAppointment.doctorId === session.user.id) ||
      (session.user.role === 'INSURANCE') ||
      (session.user.role === 'BANK')

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}

    // Handle status updates
    if (status && status !== existingAppointment.status) {
      updateData.status = status
    }

    // Handle notes updates
    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Handle rescheduling (only for patients and doctors)
    if (scheduledAt && (session.user.role === 'PATIENT' || session.user.role === 'DOCTOR')) {
      const newDate = new Date(scheduledAt)
      if (newDate <= new Date()) {
        return NextResponse.json({ error: 'Appointment must be scheduled for a future date and time' }, { status: 400 })
      }
      updateData.scheduledAt = newDate
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true }
        },
        doctor: {
          select: { id: true, name: true, email: true, phone: true }
        },
        documents: true,
      },
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Only patients can delete their own pending appointments
    if (session.user.role !== 'PATIENT' || appointment.patientId !== session.user.id || appointment.status !== 'PENDING') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.appointment.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
