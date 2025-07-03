import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the document
    const document = await prisma.proposalDocument.findFirst({
      where: { id: params.id },
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
      
      switch (extension) {
        case 'pdf':
          contentType = 'application/pdf'
          break
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg'
          break
        case 'png':
          contentType = 'image/png'
          break
        case 'doc':
          contentType = 'application/msword'
          break
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          break
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': 'inline'
        }
      })
    } catch (fileError) {
      console.error("Error reading file:", fileError)
      return NextResponse.json({ error: "File not found on server" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error previewing document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
