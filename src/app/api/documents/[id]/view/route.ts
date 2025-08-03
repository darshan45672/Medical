import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find the document and verify user access
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        claim: {
          select: {
            id: true,
            patientId: true,
            doctorId: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check if user has access to this document
    if (!document.claim) {
      return NextResponse.json({ error: 'Document not associated with a claim' }, { status: 403 })
    }

    const hasAccess = document.claim.patientId === session.user.id ||
      document.claim.doctorId === session.user.id

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    try {
      // Get the file path (assuming documents are stored in uploads/documents/)
      const uploadsDir = path.join(process.cwd(), 'uploads', 'documents')
      const filePath = path.join(uploadsDir, document.filename)
      
      // Read the file
      const fileBuffer = await readFile(filePath)
      
      // Determine content type based on file extension
      const ext = path.extname(document.filename).toLowerCase()
      let contentType = 'application/octet-stream'
      
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf'
          break
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg'
          break
        case '.png':
          contentType = 'image/png'
          break
        case '.gif':
          contentType = 'image/gif'
          break
        case '.txt':
          contentType = 'text/plain'
          break
        case '.doc':
          contentType = 'application/msword'
          break
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          break
      }

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length.toString(),
          'Content-Disposition': `attachment; filename="${document.originalName}"`,
          'Cache-Control': 'private, max-age=3600'
        }
      })

    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
