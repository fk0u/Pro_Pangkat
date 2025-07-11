import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"
import { logDocumentActivity } from "@/lib/activity-logger"

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the document
    const document = await prisma.proposalDocument.findFirst({
      where: { id: params.filename },
      include: {
        proposal: {
          include: {
            pegawai: {
              select: { id: true, name: true, nip: true }
            }
          }
        },
        documentRequirement: {
          select: { 
            id: true, 
            name: true, 
            code: true 
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check authorization - pegawai can only access their own documents
    if (session.user?.role === "PEGAWAI" && document.proposal.pegawai.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // For download, we'll return the file with download headers
    try {
      const uploadsDir = join(process.cwd(), 'uploads')
      const filePath = join(uploadsDir, document.fileUrl.replace('/uploads/', ''))
      const fileBuffer = await readFile(filePath)
      
      // Determine content type based on file extension
      const extension = document.fileName.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'
      
      if (extension === 'pdf') {
        contentType = 'application/pdf'
      } else if (['jpg', 'jpeg'].includes(extension || '')) {
        contentType = 'image/jpeg'
      } else if (extension === 'png') {
        contentType = 'image/png'
      }
      
      // Log the document download
      try {
        await logDocumentActivity(
          session.user?.id || '',
          'DOCUMENT_DOWNLOAD',
          {
            documentId: document.id,
            documentName: document.fileName,
            requirementCode: document.documentRequirement.code,
            requirementName: document.documentRequirement.name,
            proposalId: document.proposal.id,
            pegawaiName: document.proposal.pegawai.name,
            pegawaiNip: document.proposal.pegawai.nip,
          }
        )
      } catch (logError) {
        console.error('Error logging document download:', logError)
      }
      
      // Return the file with download headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${document.fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        }
      })
    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
