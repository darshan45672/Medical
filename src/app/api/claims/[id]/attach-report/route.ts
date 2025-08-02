import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await context.params
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId } = body

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    // Verify claim exists and user has access
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Check authorization - only patient who owns the claim can attach reports
    if (session.user.role !== 'PATIENT' || claim.patientId !== session.user.id) {
      return NextResponse.json({ error: 'Only the claim owner can attach reports' }, { status: 403 })
    }

    // Verify report exists and belongs to the same patient
    const report = await prisma.patientReport.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json({ error: 'Patient report not found' }, { status: 404 })
    }

    if (report.patientId !== session.user.id) {
      return NextResponse.json({ error: 'You can only attach your own reports' }, { status: 403 })
    }

    // Check if already attached
    const existingAttachment = await prisma.claimReport.findUnique({
      where: {
        claimId_reportId: {
          claimId,
          reportId,
        }
      }
    })

    if (existingAttachment) {
      return NextResponse.json({ error: 'Report is already attached to this claim' }, { status: 400 })
    }

    // Create the attachment
    const claimReport = await prisma.claimReport.create({
      data: {
        claimId,
        reportId,
        attachedBy: session.user.id,
      },
      include: {
        report: {
          include: {
            doctor: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    return NextResponse.json(claimReport, { status: 201 })
  } catch (error) {
    console.error('Error attaching report to claim:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
