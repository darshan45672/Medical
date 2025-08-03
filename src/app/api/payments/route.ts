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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as PaymentStatus | null
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    const whereClause: any = {}
    if (status) {
      whereClause.status = status
    }

    // Restrict payments based on user role
    if (session.user.role === UserRole.PATIENT) {
      // Patients can only see their own payments
      whereClause.claim = {
        patientId: session.user.id
      }
    } else if (session.user.role === UserRole.INSURANCE) {
      // Insurance can see all payments for their processed claims
      // Add any specific filtering if needed
    } else if (session.user.role !== UserRole.BANK) {
      // Other roles not allowed
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    console.log('Payment creation request:', { claimId, amount, paymentMethod, notes })

    if (!claimId || !amount) {
      console.log('Missing required fields:', { claimId: !!claimId, amount: !!amount })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify claim exists and is approved or paid
    const claim = await prisma.claim.findUnique({
      where: { id: claimId }
    })

    console.log('Found claim:', { id: claim?.id, status: claim?.status })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    if (!['APPROVED', 'PAID'].includes(claim.status)) {
      console.log('Invalid claim status:', claim.status)
      return NextResponse.json(
        { error: 'Can only create payments for approved or paid claims' },
        { status: 400 }
      )
    }

    // Check if payment already exists for this claim
    const existingPayment = await prisma.payment.findFirst({
      where: { 
        claimId,
        status: {
          in: ['PENDING', 'PROCESSING', 'COMPLETED']
        }
      }
    })

    console.log('Existing payment check:', { exists: !!existingPayment, paymentId: existingPayment?.id })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already exists for this claim' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        claimId,
        amount: parseFloat(amount),
        status: PaymentStatus.PROCESSING, // Set to PROCESSING when bank initiates payment
        paymentMethod,
        notes,
        processedBy: session.user.id,
        processedAt: new Date() // Record when processing started
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
