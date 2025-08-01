import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { DocumentType } from '@prisma/client'
import crypto from 'crypto'

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only doctors can upload medical reports
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Only doctors can upload medical reports' }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const appointmentId = formData.get('appointmentId') as string
    const patientId = formData.get('patientId') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!appointmentId || !patientId) {
      return NextResponse.json({ error: 'Appointment ID and Patient ID are required' }, { status: 400 })
    }

    // Verify the appointment exists and belongs to the doctor
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: session.user.id,
        patientId: patientId,
        status: 'ACCEPTED'
      }
    })

    if (!appointment) {
      return NextResponse.json({ 
        error: 'Appointment not found or you do not have permission to upload documents for this appointment' 
      }, { status: 404 })
    }

    const uploadedDocuments = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const documentType = formData.get(`type_${i}`) as DocumentType

      if (!documentType || !Object.values(DocumentType).includes(documentType)) {
        return NextResponse.json({ 
          error: `Invalid document type for file ${file.name}` 
        }, { status: 400 })
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ 
          error: `File ${file.name} exceeds 10MB limit` 
        }, { status: 400 })
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: `File type ${file.type} is not allowed for file ${file.name}` 
        }, { status: 400 })
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop()
      const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`
      const s3Key = `medical-reports/${appointmentId}/${uniqueFilename}`

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          'original-name': file.name,
          'uploaded-by': session.user.id,
          'appointment-id': appointmentId,
          'document-type': documentType,
        },
      })

      await s3Client.send(uploadCommand)

      // Generate S3 URL
      const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`

      // Save document record to database
      const document = await prisma.document.create({
        data: {
          appointmentId,
          type: documentType,
          filename: uniqueFilename,
          originalName: file.name,
          url: fileUrl,
          size: file.size,
          mimeType: file.type,
          uploadedById: session.user.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          },
          appointment: {
            select: { 
              id: true, 
              scheduledAt: true,
              patient: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      })

      uploadedDocuments.push(document)
    }

    return NextResponse.json({
      message: `Successfully uploaded ${uploadedDocuments.length} document(s)`,
      documents: uploadedDocuments
    })

  } catch (error) {
    console.error('Error uploading documents:', error)
    return NextResponse.json({ 
      error: 'Internal server error during file upload' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointmentId')
    const patientId = searchParams.get('patientId')

    let whereClause: any = {}

    if (session.user.role === 'DOCTOR') {
      // Doctors can see documents for their appointments
      if (appointmentId) {
        const appointment = await prisma.appointment.findFirst({
          where: {
            id: appointmentId,
            doctorId: session.user.id
          }
        })
        
        if (!appointment) {
          return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
        }
        
        whereClause.appointmentId = appointmentId
      } else {
        // Get all documents for doctor's appointments
        const doctorAppointments = await prisma.appointment.findMany({
          where: { doctorId: session.user.id },
          select: { id: true }
        })
        
        whereClause.appointmentId = {
          in: doctorAppointments.map(app => app.id)
        }
      }
    } else if (session.user.role === 'PATIENT') {
      // Patients can see documents for their appointments
      if (appointmentId) {
        const appointment = await prisma.appointment.findFirst({
          where: {
            id: appointmentId,
            patientId: session.user.id
          }
        })
        
        if (!appointment) {
          return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
        }
        
        whereClause.appointmentId = appointmentId
      } else {
        // Get all documents for patient's appointments
        const patientAppointments = await prisma.appointment.findMany({
          where: { patientId: session.user.id },
          select: { id: true }
        })
        
        whereClause.appointmentId = {
          in: patientAppointments.map(app => app.id)
        }
      }
    } else {
      // Insurance and Bank can see all documents
      if (appointmentId) {
        whereClause.appointmentId = appointmentId
      }
      if (patientId && !appointmentId) {
        const patientAppointments = await prisma.appointment.findMany({
          where: { patientId },
          select: { id: true }
        })
        
        whereClause.appointmentId = {
          in: patientAppointments.map(app => app.id)
        }
      }
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
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
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json({ documents })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
