import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AWS from 'aws-sdk'

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

const s3 = new AWS.S3()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileName, fileType, claimId } = await request.json()

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const key = `claims/${claimId || 'temp'}/${Date.now()}-${fileName}`

    const signedUrlParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Expires: 60 * 5, // 5 minutes
      ContentType: fileType,
    }

    const uploadUrl = s3.getSignedUrl('putObject', signedUrlParams)
    const downloadUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    return NextResponse.json({
      uploadUrl,
      downloadUrl,
      key,
    })
  } catch (error) {
    console.error('Error generating upload URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { claimId, documents } = body

    if (!claimId || !documents || !Array.isArray(documents)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Import prisma here to avoid circular dependency issues
    const { prisma } = await import('@/lib/prisma')

    // Verify claim exists and user has access
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    const canUpload = 
      claim.patientId === session.user.id ||
      claim.doctorId === session.user.id

    if (!canUpload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create document records
    const createdDocuments = await Promise.all(
      documents.map((doc: any) =>
        prisma.document.create({
          data: {
            claimId,
            type: doc.type,
            filename: doc.key,
            originalName: doc.originalName,
            url: doc.url,
            size: doc.size,
            mimeType: doc.mimeType,
          },
        })
      )
    )

    return NextResponse.json(createdDocuments)
  } catch (error) {
    console.error('Error saving documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}