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

    const report = await prisma.patientReport.findUnique({
      where: { id },
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
    })

    if (!report) {
      return NextResponse.json({ error: 'Patient report not found' }, { status: 404 })
    }

    // Check authorization
    const canView = 
      session.user.role === 'INSURANCE' ||
      session.user.role === 'BANK' ||
      report.patientId === session.user.id ||
      report.doctorId === session.user.id

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error fetching patient report:', error)
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
    const {
      title,
      description,
      diagnosis,
      treatment,
      medications,
      recommendations,
      followUpDate,
      documentUrl,
      isActive
    } = body

    const existingReport = await prisma.patientReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return NextResponse.json({ error: 'Patient report not found' }, { status: 404 })
    }

    // Only the doctor who created the report can update it
    if (session.user.role !== 'DOCTOR' || existingReport.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Only the reporting doctor can update this report' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis
    if (treatment !== undefined) updateData.treatment = treatment
    if (medications !== undefined) updateData.medications = medications
    if (recommendations !== undefined) updateData.recommendations = recommendations
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate) : null
    if (documentUrl !== undefined) updateData.documentUrl = documentUrl
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedReport = await prisma.patientReport.update({
      where: { id },
      data: updateData,
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
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('Error updating patient report:', error)
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

    const report = await prisma.patientReport.findUnique({
      where: { id },
      include: {
        claimReports: true
      }
    })

    if (!report) {
      return NextResponse.json({ error: 'Patient report not found' }, { status: 404 })
    }

    // Only the doctor who created the report can delete it
    if (session.user.role !== 'DOCTOR' || report.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Only the reporting doctor can delete this report' }, { status: 403 })
    }

    // Check if the report is attached to any claims
    if (report.claimReports.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete report that is attached to claims. Detach from claims first.' 
      }, { status: 400 })
    }

    await prisma.patientReport.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Patient report deleted successfully' })
  } catch (error) {
    console.error('Error deleting patient report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
