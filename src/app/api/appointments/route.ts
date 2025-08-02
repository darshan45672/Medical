import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppointmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as AppointmentStatus | null
    const doctorId = searchParams.get('doctorId')
    const patientId = searchParams.get('patientId')
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

    // Override with explicit filters if provided and user has permission
    if (doctorId && (session.user.role === 'DOCTOR' && session.user.id === doctorId || session.user.role === 'INSURANCE' || session.user.role === 'BANK')) {
      whereClause.doctorId = doctorId
    }
    if (patientId && (session.user.role === 'PATIENT' && session.user.id === patientId || session.user.role === 'INSURANCE' || session.user.role === 'BANK')) {
      whereClause.patientId = patientId
    }

    if (status) {
      whereClause.status = status
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
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
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { scheduledAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await prisma.appointment.count({ where: whereClause })

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Only patients can create appointments' }, { status: 403 })
    }

    const body = await request.json()
    const { doctorId, scheduledAt, notes } = body

    if (!doctorId || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the doctor exists and has the correct role
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId, role: 'DOCTOR' }
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Invalid doctor selected' }, { status: 400 })
    }

    // Check if the scheduled time is in the future
    const appointmentDate = new Date(scheduledAt)
    if (appointmentDate <= new Date()) {
      return NextResponse.json({ error: 'Appointment must be scheduled for a future date and time' }, { status: 400 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: session.user.id,
        doctorId,
        scheduledAt: appointmentDate,
        notes,
        status: 'PENDING',
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true }
        },
        doctor: {
          select: { id: true, name: true, email: true, phone: true }
        },
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
