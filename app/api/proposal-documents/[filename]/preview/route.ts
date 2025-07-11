import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"

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
              select: { id: true }
            }
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

    // For preview, we'll return the file content
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
      
      // Log the document access
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user?.id },
          select: { name: true }
        })
        
        console.log(`Document previewed: ${document.fileName} by ${user?.name || 'Unknown'}`)
      } catch (logError) {
        console.error('Error logging document preview:', logError)
      }
      
      // Return the file with inline display header
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${document.fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        }
      })
    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
  } catch (error) {
    console.error('Error previewing document:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
