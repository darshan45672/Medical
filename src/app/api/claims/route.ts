import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateClaimNumber } from '@/lib/utils'
import { ClaimStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ClaimStatus | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const whereClause: any = {}

    if (session.user.role === 'PATIENT') {
      whereClause.patientId = session.user.id
    } else if (session.user.role === 'DOCTOR') {
      whereClause.doctorId = session.user.id
    }

    if (status) {
      whereClause.status = status
    }

    const claims = await prisma.claim.findMany({
      where: whereClause,
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
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await prisma.claim.count({ where: whereClause })

    return NextResponse.json({
      claims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching claims:', error)
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
      return NextResponse.json({ error: 'Only patients can create claims' }, { status: 403 })
    }

    const body = await request.json()
    const { diagnosis, treatmentDate, claimAmount, description, doctorId } = body

    if (!diagnosis || !treatmentDate || !claimAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const claim = await prisma.claim.create({
      data: {
        claimNumber: generateClaimNumber(),
        patientId: session.user.id,
        doctorId,
        diagnosis,
        treatmentDate: new Date(treatmentDate),
        claimAmount,
        description,
        status: 'DRAFT',
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true }
        },
        doctor: {
          select: { id: true, name: true, email: true }
        },
      },
    })

    return NextResponse.json(claim, { status: 201 })
  } catch (error) {
    console.error('Error creating claim:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}