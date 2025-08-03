import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, PaymentStatus, ClaimStatus } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only bank users can update payment status
    if (session.user.role !== UserRole.BANK) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, transactionId, failureReason, notes } = body
    const { id: paymentId } = await params

    if (!status || !Object.values(PaymentStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      )
    }

    // Get current payment
    const currentPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { claim: true }
    })

    if (!currentPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      status,
      processedBy: session.user.id,
      processedAt: new Date(),
      updatedAt: new Date()
    }

    if (transactionId) updateData.transactionId = transactionId
    if (failureReason) updateData.failureReason = failureReason
    if (notes) updateData.notes = notes

    // Set payment date for completed payments
    if (status === PaymentStatus.COMPLETED) {
      updateData.paymentDate = new Date()
    }

    // Update payment status
    const updatedPayment = await prisma.$transaction(async (tx) => {
      // Update payment
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: updateData,
        include: {
          claim: {
            include: {
              patient: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      // Update claim status to PAID if payment is completed
      if (status === PaymentStatus.COMPLETED) {
        await tx.claim.update({
          where: { id: currentPayment.claimId },
          data: {
            status: ClaimStatus.PAID,
            paidAt: new Date()
          }
        })
      }

      return payment
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only bank users can view payment details
    if (session.user.role !== UserRole.BANK) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: paymentId } = await params

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        claim: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
