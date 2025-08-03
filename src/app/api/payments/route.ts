import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, PaymentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only bank users can view payments
    if (session.user.role !== UserRole.BANK) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as PaymentStatus | null
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    const whereClause: any = {}
    if (status) {
      whereClause.status = status
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only bank users can create payments
    if (session.user.role !== UserRole.BANK) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { claimId, amount, paymentMethod, notes } = body

    if (!claimId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify claim exists and is approved
    const claim = await prisma.claim.findUnique({
      where: { id: claimId }
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    if (claim.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Can only create payments for approved claims' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        claimId,
        amount: parseFloat(amount),
        status: PaymentStatus.PENDING,
        paymentMethod,
        notes,
        processedBy: session.user.id
      },
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

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
