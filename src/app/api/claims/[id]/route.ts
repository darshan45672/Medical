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

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true }
        },
        doctor: {
          select: { id: true, name: true, email: true, phone: true }
        },
        documents: true,
        payments: true,
        claimReports: {
          include: {
            report: {
              include: {
                doctor: {
                  select: { id: true, name: true, email: true }
                },
                appointment: {
                  select: { id: true, scheduledAt: true }
                }
              }
            }
          }
        }
      },
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Check authorization
    const canView = 
      session.user.role === 'INSURANCE' ||
      session.user.role === 'BANK' ||
      claim.patientId === session.user.id ||
      claim.doctorId === session.user.id

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(claim)
  } catch (error) {
    console.error('Error fetching claim:', error)
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
    const { status, approvedAmount, rejectionReason } = body

    const existingClaim = await prisma.claim.findUnique({
      where: { id },
    })

    if (!existingClaim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Check authorization for updates
    const canUpdate = 
      (session.user.role === 'PATIENT' && existingClaim.patientId === session.user.id && existingClaim.status === 'DRAFT') ||
      (session.user.role === 'DOCTOR' && existingClaim.doctorId === session.user.id) ||
      (session.user.role === 'INSURANCE') ||
      (session.user.role === 'BANK')

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = { ...body }

    // Handle status-specific updates
    if (status && status !== existingClaim.status) {
      updateData.status = status
      
      if (status === 'SUBMITTED') {
        updateData.submittedAt = new Date()
      } else if (status === 'APPROVED') {
        updateData.approvedAt = new Date()
        if (approvedAmount) {
          updateData.approvedAmount = approvedAmount
        }
      } else if (status === 'REJECTED') {
        updateData.rejectedAt = new Date()
        if (rejectionReason) {
          updateData.rejectionReason = rejectionReason
        }
      } else if (status === 'PAID') {
        updateData.paidAt = new Date()
      }
    }

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        },
        doctor: {
          select: { id: true, name: true, email: true }
        },
        documents: true,
        payments: true,
        claimReports: {
          include: {
            report: {
              include: {
                doctor: {
                  select: { id: true, name: true, email: true }
                },
                appointment: {
                  select: { id: true, scheduledAt: true }
                }
              }
            }
          }
        }
      },
    })

    return NextResponse.json(updatedClaim)
  } catch (error) {
    console.error('Error updating claim:', error)
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

    const claim = await prisma.claim.findUnique({
      where: { id },
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    // Only patients can delete their own draft claims
    if (session.user.role !== 'PATIENT' || claim.patientId !== session.user.id || claim.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.claim.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Claim deleted successfully' })
  } catch (error) {
    console.error('Error deleting claim:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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
    const { status } = body

    // Role-based authorization for status updates
    if (session.user.role === 'INSURANCE') {
      // Insurance users can update to standard review statuses
      const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']
      if (!status || !validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      // Check if claim exists for insurance users
      const existingClaim = await prisma.claim.findUnique({
        where: { id },
        select: { id: true }
      })
      
      if (!existingClaim) {
        return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
      }
    } else if (session.user.role === 'BANK') {
      // Bank users can only update approved claims to paid status
      if (status !== 'PAID') {
        return NextResponse.json({ error: 'Bank users can only update claims to PAID status' }, { status: 403 })
      }
      
      // Check if claim is approved before allowing payment
      const existingClaim = await prisma.claim.findUnique({
        where: { id },
        select: { status: true }
      })
      
      if (!existingClaim) {
        return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
      }
      
      if (existingClaim.status !== 'APPROVED') {
        return NextResponse.json({ error: 'Only approved claims can be marked as paid' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to update claim status' }, { status: 403 })
    }

    // Update claim status
    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Claim status updated successfully',
      claim: updatedClaim
    })
  } catch (error) {
    console.error('Error updating claim status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}