import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import prisma from "@/lib/prisma"
import { type StatusDokumen, StatusProposal } from "@prisma/client"

// PATCH: Update document status
export const PATCH = withAuth(
  async (req: NextRequest, user: any, { params }: { params: { id: string; documentId: string } }) => {
    try {
      const { id, documentId } = params
      const data = await req.json()

      // Check if user is operator or admin
      if (user.role !== "OPERATOR" && user.role !== "ADMIN") {
        return createErrorResponse("Unauthorized", 403)
      }

      // Fetch document
      const document = await prisma.proposalDocument.findUnique({
        where: { id: documentId },
        include: {
          proposal: {
            include: {
              pegawai: {
                select: {
                  wilayah: true,
                },
              },
            },
          },
        },
      })

      if (!document) {
        return createErrorResponse("Document not found", 404)
      }

      // Check if document belongs to the specified proposal
      if (document.proposalId !== id) {
        return createErrorResponse("Document does not belong to this proposal", 400)
      }

      // For operators, check if they have access to this proposal
      if (user.role === "OPERATOR" && user.wilayah && document.proposal.pegawai.wilayah !== user.wilayah) {
        return createErrorResponse("Unauthorized", 403)
      }

      // Check if proposal is in a status that allows document verification
      const allowedStatuses = [StatusProposal.DIPROSES, StatusProposal.MENUNGGU_VERIFIKASI, StatusProposal.DIVERIFIKASI]

      if (!allowedStatuses.includes(document.proposal.status)) {
        return createErrorResponse("Proposal status does not allow document verification", 400)
      }

      // Update document status
      const updatedDocument = await prisma.proposalDocument.update({
        where: { id: documentId },
        data: {
          status: data.status as StatusDokumen,
        },
      })

      return createSuccessResponse(updatedDocument)
    } catch (error) {
      console.error("Error updating document status:", error)
      return createErrorResponse("Internal Server Error", 500)
    }
  },
)
