import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only operators can approve documents
    if (!["OPERATOR", "OPERATOR_SEKOLAH", "ADMIN"].includes(session.user?.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Accept either body with status or default to VERIFIED
    let status = "VERIFIED"
    try {
      const body = await request.json()
      if (body.status) {
        status = body.status
      }
    } catch (e) {
      // If no body or parsing error, default to VERIFIED
    }

    // Validate status
    if (!["VERIFIED", "DISETUJUI", "DITOLAK", "PERLU_PERBAIKAN"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update the document status
    const document = await prisma.proposalDocument.update({
      where: { id: params.filename },
      data: { 
        status,
        reviewedAt: new Date(),
        reviewedBy: session.user?.id || undefined,
        reviewerRole: session.user?.role || undefined
      },
      include: {
        proposal: {
          select: {
            id: true,
            pegawaiId: true,
            status: true
          }
        }
      }
    })

    // Create notification for pegawai
    await prisma.notification.create({
      data: {
        userId: document.proposal.pegawaiId,
        title: `Dokumen ${status === "DISETUJUI" ? "Disetujui" : status === "DITOLAK" ? "Ditolak" : "Perlu Perbaikan"}`,
        message: `Dokumen "${document.fileName}" telah ${status === "DISETUJUI" ? "disetujui" : status === "DITOLAK" ? "ditolak" : "perlu perbaikan"}`,
        type: status === "DISETUJUI" ? "SUCCESS" : status === "DITOLAK" ? "ERROR" : "WARNING",
        isRead: false,
        metadata: {
          documentId: document.id,
          proposalId: document.proposalId,
          status
        }
      }
    })

    // Check if all documents in the proposal are approved
    if (status === "DISETUJUI" || status === "VERIFIED") {
      const proposalDocuments = await prisma.proposalDocument.findMany({
        where: { proposalId: document.proposalId }
      })

      // Map VERIFIED to DISETUJUI for backward compatibility
      const allApproved = proposalDocuments.length > 0 && 
                          proposalDocuments.every((doc: any) => 
                            doc.status === "DISETUJUI" || doc.status === "VERIFIED")

      // If all documents are approved, update the proposal status
      if (allApproved && ["SUBMITTED", "PENDING", "MENUNGGU_VERIFIKASI_SEKOLAH"].includes(document.proposal.status)) {
        await prisma.promotionProposal.update({
          where: { id: document.proposalId },
          data: { 
            status: "DOKUMEN_LENGKAP",
            documentsComplete: true,
            timeline: {
              create: {
                status: "DOKUMEN_LENGKAP",
                notes: "Semua dokumen telah disetujui",
                actor: session.user?.name || "System",
                actorRole: session.user?.role || "SYSTEM"
              }
            }
          }
        })
      }
    }

    // Map status names for response
    const statusMessage = {
      "DISETUJUI": "disetujui", 
      "VERIFIED": "disetujui",
      "DITOLAK": "ditolak", 
      "PERLU_PERBAIKAN": "dikembalikan"
    }

    return NextResponse.json({ 
      success: true, 
      message: `Dokumen berhasil ${statusMessage[status as keyof typeof statusMessage] || status}`,
      document
    })
  } catch (error) {
    console.error("Error approving document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
