import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFile } from "fs/promises"
import { join } from "path"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

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
      
      console.log(`Document preview path: ${filePath}`)
      
      let fileBuffer
      try {
        fileBuffer = await readFile(filePath)
      } catch (readError) {
        console.error(`Error reading file at ${filePath}:`, readError)
        return NextResponse.json({ error: "File not found or inaccessible" }, { status: 404 })
      }
      
      // Determine content type based on file extension
      const extension = document.fileName.split('.').pop()?.toLowerCase()
      let contentType = 'application/octet-stream'
      
      if (extension === 'pdf') {
        contentType = 'application/pdf'
        const pdfDoc = await PDFDocument.load(fileBuffer)
        const pages = pdfDoc.getPages()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const text = `Diakses oleh: ${document.proposal.pegawai.name} (${document.proposal.pegawai.nip}) pada ${new Date().toLocaleString()}`
        
        for (const page of pages) {
          const { width, height } = page.getSize()
          page.drawText(text, {
            x: 5,
            y: height - 15,
            font,
            size: 8,
            color: rgb(0.5, 0.5, 0.5),
          })
        }
        
        fileBuffer = await pdfDoc.save()
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
      
      // Return the file with headers optimized for iframe embedding and browser compatibility
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${document.fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          // Relaxed CSP to allow embedding in iframes from any source
          'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; object-src 'self' blob:; frame-ancestors *",
          'X-Frame-Options': 'ALLOWALL',
          'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
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
