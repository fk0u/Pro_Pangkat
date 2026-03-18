import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal } from "@prisma/client"

// GET: Fetch a specific proposal
export const GET = withAuth(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params

      // Check if user is operator or admin
      if (user.role !== "OPERATOR" && user.role !== "ADMIN") {
        return createErrorResponse("Unauthorized", 403)
      }

      // Fetch proposal
      const proposal = await prisma.promotionProposal.findUnique({
        where: { id },
        include: {
          pegawai: {
            select: {
              id: true,
              nip: true,
              name: true,
              unitKerja: true,
              golongan: true,
              jabatan: true,
              jenisJabatan: true,
              wilayah: true,
            },
          },
          documents: {
            include: {
              documentRequirement: true,
            },
          },
        },
      })

      if (!proposal) {
        return createErrorResponse("Proposal not found", 404)
      }

      // For operators, check if they have access to this proposal
      if (user.role === "OPERATOR" && user.wilayah && proposal.pegawai.wilayah !== user.wilayah) {
        return createErrorResponse("Unauthorized", 403)
      }

      return createSuccessResponse(proposal)
    } catch (error: any) {
      console.error("Error fetching proposal:", error)
      return createErrorResponse(error.message || "Failed to fetch proposal")
    }
  },
  ["OPERATOR", "ADMIN"],
)

// PATCH: Update proposal status
export const PATCH = withAuth(
  async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
    try {
      const { id } = params
      const data = await req.json()

      // Check if user is operator or admin
      if (user.role !== "OPERATOR" && user.role !== "ADMIN") {
        return createErrorResponse("Unauthorized", 403)
      }

      // Fetch proposal
      const proposal = await prisma.promotionProposal.findUnique({
        where: { id },
        include: {
          pegawai: {
            select: {
              id: true,
              wilayah: true,
              golongan: true,
            },
          },
        },
      })

      if (!proposal) {
        return createErrorResponse("Proposal not found", 404)
      }

      // For operators, check if they have access to this proposal
      if (user.role === "OPERATOR" && user.wilayah && proposal.pegawai.wilayah !== user.wilayah) {
        return createErrorResponse("Unauthorized", 403)
      }

      // Validate status transition
      const newStatus = data.status
      const validTransitions: Record<StatusProposal, StatusProposal[]> = {
        [StatusProposal.DRAFT]: [],
        [StatusProposal.DIAJUKAN]: [StatusProposal.DIPROSES_OPERATOR, StatusProposal.DIKEMBALIKAN_OPERATOR],
        [StatusProposal.DIPROSES_OPERATOR]: [StatusProposal.DISETUJUI_OPERATOR, StatusProposal.DIKEMBALIKAN_OPERATOR],
        [StatusProposal.DIKEMBALIKAN_OPERATOR]: [],
        [StatusProposal.DISETUJUI_OPERATOR]: [StatusProposal.DIPROSES_ADMIN],
        [StatusProposal.DIPROSES_ADMIN]: [
          StatusProposal.SELESAI,
          StatusProposal.DIKEMBALIKAN_ADMIN,
          StatusProposal.DITOLAK,
        ],
        [StatusProposal.DIKEMBALIKAN_ADMIN]: [StatusProposal.DIPROSES_OPERATOR],
        [StatusProposal.SELESAI]: [],
        [StatusProposal.DITOLAK]: [],
      }

      if (!validTransitions[proposal.status].includes(newStatus)) {
        return createErrorResponse(`Invalid status transition from ${proposal.status} to ${newStatus}`)
      }

      // Update proposal status
      const updatedProposal = await prisma.promotionProposal.update({
        where: { id },
        data: {
          status: newStatus,
          notes: data.notes,
          operatorId: user.id,
        },
      })

      // If status is SELESAI, update user's golongan
      if (newStatus === StatusProposal.SELESAI && data.newGolongan) {
        await prisma.user.update({
          where: { id: proposal.pegawai.id },
          data: {
            golongan: data.newGolongan,
            tmtGolongan: new Date(),
          },
        })
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: `PROPOSAL_STATUS_CHANGED_TO_${newStatus}`,
          details: {
            proposalId: id,
            previousStatus: proposal.status,
            newStatus,
            notes: data.notes,
          },
          userId: user.id,
        },
      })

      return createSuccessResponse(updatedProposal, "Proposal status updated successfully")
    } catch (error: any) {
      console.error("Error updating proposal status:", error)
      return createErrorResponse(error.message || "Failed to update proposal status")
    }
  },
  ["OPERATOR", "ADMIN"],
)
