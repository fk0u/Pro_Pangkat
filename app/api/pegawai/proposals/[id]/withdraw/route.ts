import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const withdrawSchema = z.object({
  reason: z.string().min(1, "Alasan penarikan harus diisi")
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
    const parsed = withdrawSchema.safeParse(body)

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
      }
    })

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    // Check if proposal can be withdrawn
    const withdrawableStatuses = [
      "MENUNGGU_VERIFIKASI_DINAS",
      "MENUNGGU_VERIFIKASI_SEKOLAH",
      "DIAJUKAN"
    ]

    if (!withdrawableStatuses.includes(proposal.status)) {
      return NextResponse.json(
        { error: "Proposal cannot be withdrawn in current status" },
        { status: 400 }
      )
    }

    // Update proposal status
    const updatedProposal = await prisma.promotionProposal.update({
      where: { id: params.id },
      data: {
        status: "DITARIK",
        notes: `Ditarik oleh pegawai. Alasan: ${parsed.data.reason}`,
        updatedAt: new Date()
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "WITHDRAW_PROPOSAL",
        details: {
          proposalId: params.id,
          reason: parsed.data.reason,
          previousStatus: proposal.status
        },
        userId: session.user.id
      }
    })

    return NextResponse.json({
      message: "Proposal withdrawn successfully",
      proposal: updatedProposal
    })
  } catch (error) {
    console.error("Error withdrawing proposal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
