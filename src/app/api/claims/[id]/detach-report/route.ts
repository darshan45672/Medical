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

    // Check authorization - only patient who owns the claim can detach reports
    if (session.user.role !== 'PATIENT' || claim.patientId !== session.user.id) {
      return NextResponse.json({ error: 'Only the claim owner can detach reports' }, { status: 403 })
    }

    // Verify attachment exists
    const claimReport = await prisma.claimReport.findUnique({
      where: {
        claimId_reportId: {
          claimId,
          reportId,
        }
      }
    })

    if (!claimReport) {
      return NextResponse.json({ error: 'Report is not attached to this claim' }, { status: 404 })
    }

    // Delete the attachment
    await prisma.claimReport.delete({
      where: {
        claimId_reportId: {
          claimId,
          reportId,
        }
      }
    })

    return NextResponse.json({ message: 'Report detached from claim successfully' })
  } catch (error) {
    console.error('Error detaching report from claim:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
