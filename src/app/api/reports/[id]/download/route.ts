import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: reportId } = await params

    let report

    // Allow both doctors and patients to download reports
    if (session.user.role === UserRole.DOCTOR) {
      // Fetch the report and verify doctor has access
      report = await prisma.patientReport.findFirst({
        where: {
          id: reportId,
          doctorId: session.user.id
        }
      })
    } else if (session.user.role === UserRole.PATIENT) {
      // Fetch the report and verify patient has access through appointments
      report = await prisma.patientReport.findFirst({
        where: {
          id: reportId,
          appointment: {
            patientId: session.user.id
          }
        },
        include: {
          appointment: {
            select: { patientId: true }
          }
        }
      })
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!report) {
      return NextResponse.json({ 
        error: 'Report not found or you do not have access to this report' 
      }, { status: 404 })
    }

    if (!report.documentUrl) {
      return NextResponse.json({ 
        error: 'No document file associated with this report' 
      }, { status: 404 })
    }

    try {
      // For now, we'll create a simple PDF response
      // In a real application, you'd fetch the file from your storage service
      const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
50 750 Td
(Medical Report) Tj
0 -50 Td
/F1 12 Tf
(Title: ${report.title}) Tj
0 -20 Td
(Patient: ${report.patientId}) Tj
0 -20 Td
(Doctor: ${session.user.name}) Tj
0 -20 Td
(Date: ${report.createdAt.toLocaleDateString()}) Tj
0 -30 Td
(Description:) Tj
0 -20 Td
(${report.description}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Roman
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000100 00000 n 
0000000250 00000 n 
0000000500 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
580
%%EOF`

      const buffer = Buffer.from(pdfContent, 'utf-8')

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${report.title}.pdf"`
        }
      })

    } catch (fileError) {
      console.error('Error reading report file:', fileError)
      return NextResponse.json({ 
        error: 'Failed to load report file' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    )
  }
}
