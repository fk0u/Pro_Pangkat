import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusDokumen, StatusProposal } from "@prisma/client"
import { hasVerifiedAtField } from "@/lib/database-utils"

// Endpoint to verify all documents in a proposal at once
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Only operators and admins can verify documents
    if (user.role !== "OPERATOR" && user.role !== "ADMIN") {
      return createErrorResponse("Access denied", 403)
    }

    const body = await req.json()
    const { proposalId } = body

    if (!proposalId) {
      return createErrorResponse("Missing required field: proposalId", 400)
    }

    // Get the proposal with pending documents
    const proposal = await prisma.promotionProposal.findUnique({
      where: { id: proposalId },
      include: {
        documents: {
          where: {
            status: StatusDokumen.MENUNGGU_VERIFIKASI
          }
        },
        pegawai: {
          select: {
            name: true
          }
        }
      }
    })

    if (!proposal) {
      return createErrorResponse("Proposal not found", 404)
    }

    // If no pending documents, return success
    if (proposal.documents.length === 0) {
      return createSuccessResponse({
        message: "No pending documents to verify",
        verified: 0
      })
    }

    console.log("Verifying all documents for proposal:", proposalId);
    // Update all pending documents to approved
    const now = new Date()
    
    // Check if verifiedAt field exists in the database
    const hasVerifiedAt = await hasVerifiedAtField();
    
    // Prepare update data
    const updateData: any = {
      status: StatusDokumen.DISETUJUI
    };
    
    // Only add verifiedAt if it exists in the database
    if (hasVerifiedAt) {
      updateData.verifiedAt = now;
      console.log("Adding verifiedAt field to bulk update");
    } else {
      console.log("verifiedAt field not found in database");
    }
    
    const updatedDocuments = await prisma.proposalDocument.updateMany({
      where: {
        proposalId: proposalId,
        status: StatusDokumen.MENUNGGU_VERIFIKASI
      },
      data: updateData
    });
    
    console.log("Updated documents:", updatedDocuments);

    // Update proposal status to DISETUJUI_OPERATOR if not already
    if (proposal.status !== StatusProposal.DISETUJUI_OPERATOR) {
      await prisma.promotionProposal.update({
        where: { id: proposalId },
        data: {
          status: StatusProposal.DISETUJUI_OPERATOR,
          updatedAt: now
        }
      });
    }

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "APPROVE_ALL_DOCUMENTS",
          details: {
            text: `Menyetujui semua dokumen (${proposal.documents.length}) dari usulan ${proposal.pegawai.name}`,
            proposalId,
            documentCount: proposal.documents.length
          }
        }
      })
    } catch (logError) {
      // Log the error but don't fail the operation
      console.error("Error creating activity log, but documents were updated:", logError)
      // We'll still return success since the documents were updated
    }

    return createSuccessResponse({
      message: `${proposal.documents.length} dokumen berhasil disetujui`,
      verified: proposal.documents.length
    })
  } catch (error: unknown) {
    console.error("Error verifying all documents:", error)
    const message = error instanceof Error ? error.message : "Failed to verify all documents"
    return createErrorResponse(message)
  }
})
