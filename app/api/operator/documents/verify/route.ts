import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusDokumen } from "@prisma/client"

// Endpoint to verify a single document
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Only operators and admins can verify documents
    if (user.role !== "OPERATOR" && user.role !== "ADMIN") {
      return createErrorResponse("Access denied", 403)
    }

    const body = await req.json()
    const { documentId, proposalId, action, catatan } = body

    if (!documentId || !proposalId || !action) {
      return createErrorResponse("Missing required fields", 400)
    }

    // Get the document
    const document = await prisma.proposalDocument.findUnique({
      where: { id: documentId },
      include: {
        proposal: {
          select: {
            pegawai: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!document) {
      return createErrorResponse("Document not found", 404)
    }

    // Check if document belongs to the specified proposal
    if (document.proposalId !== proposalId) {
      return createErrorResponse("Document does not belong to the specified proposal", 400)
    }

    // Set new status based on action
    const newStatus = action === "approve" ? StatusDokumen.DISETUJUI : StatusDokumen.DITOLAK
    
    // Update document status
    const updatedDocument = await prisma.proposalDocument.update({
      where: { id: documentId },
      data: {
        status: newStatus,
        notes: catatan || null,
        verifiedAt: new Date() // Add verified timestamp
      }
    })

    try {
      // Log activity - wrapped in try/catch to prevent failures here from affecting the main operation
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: `${action.toUpperCase()}_DOCUMENT`,
          details: {
            text: `${action === "approve" ? "Menyetujui" : "Menolak"} dokumen ${document.fileName} dari usulan ${document.proposal.pegawai.name}`,
            documentId,
            proposalId,
            action,
            catatan: catatan || null
          }
        }
      })
    } catch (logError) {
      // Log the error but don't fail the operation
      console.error("Error creating activity log, but document was updated:", logError)
      // We'll still return success since the document was updated
    }

    // Return the response
    return createSuccessResponse({
      message: `Dokumen berhasil ${action === "approve" ? "disetujui" : "ditolak"}`,
      document: {
        ...updatedDocument,
        originalName: updatedDocument.fileName, // Ensure compatibility with client
        catatan: updatedDocument.notes // Ensure compatibility with client
      }
    })
  } catch (error: unknown) {
    console.error("Error verifying document:", error)
    const message = error instanceof Error ? error.message : "Failed to verify document"
    return createErrorResponse(message)
  }
})
