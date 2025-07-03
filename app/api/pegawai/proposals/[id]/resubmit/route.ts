import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const resubmitSchema = z.object({
  notes: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = resubmitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.errors },
        { status: 400 }
      )
    }

    // Check if proposal exists and belongs to user
    const proposal = await prisma.promotionProposal.findFirst({
      where: {
        id: params.id,
        pegawaiId: session.user.id
      },
      include: {
        documents: true
      }
    })

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    // Check if proposal can be resubmitted
    const resubmittableStatuses = [
      "PERLU_PERBAIKAN_DARI_DINAS",
      "PERLU_PERBAIKAN_DARI_SEKOLAH",
      "DITOLAK"
    ]

    if (!resubmittableStatuses.includes(proposal.status)) {
      return NextResponse.json(
        { error: "Proposal cannot be resubmitted in current status" },
        { status: 400 }
      )
    }

    // Check if all required documents are uploaded and approved
    const requiredDocuments = await prisma.documentRequirement.findMany({
      where: { isRequired: true }
    })

    const uploadedDocuments = proposal.documents.filter(doc => 
      doc.status === "DISETUJUI" || doc.status === "MENUNGGU_VERIFIKASI"
    )

    const hasAllRequiredDocs = requiredDocuments.every(reqDoc =>
      uploadedDocuments.some(uploadedDoc => 
        uploadedDoc.documentRequirementId === reqDoc.id
      )
    )

    if (!hasAllRequiredDocs) {
      return NextResponse.json(
        { error: "Please upload all required documents before resubmitting" },
        { status: 400 }
      )
    }

    // Determine new status based on previous status
    let newStatus = "DIAJUKAN"
    if (proposal.status === "PERLU_PERBAIKAN_DARI_SEKOLAH") {
      newStatus = "MENUNGGU_VERIFIKASI_SEKOLAH"
    } else if (proposal.status === "PERLU_PERBAIKAN_DARI_DINAS") {
      newStatus = "MENUNGGU_VERIFIKASI_DINAS"
    }

    // Update proposal status
    const updatedProposal = await prisma.promotionProposal.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        notes: parsed.data.notes || "Diajukan ulang oleh pegawai",
        updatedAt: new Date()
      }
    })

    // Reset document statuses that need review
    await prisma.proposalDocument.updateMany({
      where: {
        proposalId: params.id,
        status: "PERLU_PERBAIKAN"
      },
      data: {
        status: "MENUNGGU_VERIFIKASI"
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "RESUBMIT_PROPOSAL",
        details: {
          proposalId: params.id,
          notes: parsed.data.notes,
          previousStatus: proposal.status,
          newStatus: newStatus
        },
        userId: session.user.id
      }
    })

    return NextResponse.json({
      message: "Proposal resubmitted successfully",
      proposal: updatedProposal
    })
  } catch (error) {
    console.error("Error resubmitting proposal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
