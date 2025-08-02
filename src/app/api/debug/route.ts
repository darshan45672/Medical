import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('=== Debug Test API ===')
    console.log('User:', session.user)

    if (session.user.role === 'DOCTOR') {
      // Get all appointments for this doctor
      const appointments = await prisma.appointment.findMany({
        where: {
          doctorId: session.user.id
        },
        include: {
          patient: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      console.log('Doctor appointments:', appointments.length)

      // Get accepted appointments
      const acceptedAppointments = appointments.filter(apt => apt.status === 'ACCEPTED')
      console.log('Accepted appointments:', acceptedAppointments.length)

      return NextResponse.json({
        user: session.user,
        totalAppointments: appointments.length,
        acceptedAppointments: acceptedAppointments.length,
        appointments: appointments,
        acceptedAppointmentDetails: acceptedAppointments
      })
    }

    return NextResponse.json({
      user: session.user,
      message: 'User is not a doctor'
    })

  } catch (error) {
    console.error('Debug test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
