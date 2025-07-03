import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const updateProposalSchema = z.object({
  periode: z.string().min(1, "Periode harus diisi").optional(),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "DIAJUKAN"]).optional(),
  action: z.enum(["submit", "withdraw", "update"]).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const proposal = await prisma.promotionProposal.findFirst({
      where: {
        id: params.id,
        pegawaiId: session.user.id,
      },
      include: {
        pegawai: {
          select: {
            name: true,
            nip: true,
            golongan: true,
            jabatan: true,
            unitKerja: true
          }
        },
        documents: {
          include: {
            documentRequirement: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
                isRequired: true,
              },
            },
          },
          orderBy: {
            uploadedAt: 'asc'
          }
        },
        operator: {
          select: {
            name: true,
            nip: true,
          },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json({ message: "Proposal not found" }, { status: 404 })
    }

    // Get document requirements untuk melihat dokumen yang belum diupload
    const documentRequirements = await prisma.documentRequirement.findMany({
      orderBy: { name: 'asc' }
    })

    // Transform data untuk response
    const uploadedDocCodes = proposal.documents.map(doc => doc.documentRequirement.code)
    const missingDocuments = documentRequirements.filter(req => !uploadedDocCodes.includes(req.code))

    const transformedProposal = {
      id: proposal.id,
      periode: proposal.periode,
      status: proposal.status,
      notes: proposal.notes,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      pegawai: proposal.pegawai,
      operator: proposal.operator,
      documents: proposal.documents.map((doc) => ({
        id: doc.id,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        status: doc.status,
        notes: doc.notes,
        uploadedAt: doc.uploadedAt,
        fileUrl: doc.fileUrl,
        documentRequirement: doc.documentRequirement,
      })),
      missingDocuments: missingDocuments.map(req => ({
        id: req.id,
        code: req.code,
        name: req.name,
        description: req.description,
        isRequired: req.isRequired
      })),
      documentStats: {
        total: proposal.documents.length,
        approved: proposal.documents.filter((d) => d.status === "DISETUJUI").length,
        pending: proposal.documents.filter((d) => d.status === "MENUNGGU_VERIFIKASI").length,
        needsRevision: proposal.documents.filter((d) => d.status === "PERLU_PERBAIKAN").length,
        rejected: proposal.documents.filter((d) => d.status === "DITOLAK").length,
        required: documentRequirements.filter(req => req.isRequired).length,
        missing: missingDocuments.filter(req => req.isRequired).length
      },
      canUploadDocuments: ['DRAFT', 'PERLU_PERBAIKAN_DARI_DINAS', 'PERLU_PERBAIKAN_DARI_SEKOLAH', 'DIKEMBALIKAN_OPERATOR', 'DIKEMBALIKAN_ADMIN'].includes(proposal.status),
      canSubmit: proposal.documents.length > 0 && missingDocuments.filter(req => req.isRequired).length === 0,
      needsAttention: (missingDocuments.filter(req => req.isRequired).length > 0) && 
                     ['DRAFT', 'PERLU_PERBAIKAN_DARI_SEKOLAH', 'PERLU_PERBAIKAN_DARI_DINAS'].includes(proposal.status)
    }

    return NextResponse.json(transformedProposal)
  } catch (error) {
    console.error("Error fetching proposal:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = updateProposalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.errors }, { status: 400 })
    }

    // Check if proposal exists and belongs to user
    const existingProposal = await prisma.promotionProposal.findFirst({
      where: {
        id: params.id,
        pegawaiId: session.user.id,
      },
    })

    if (!existingProposal) {
      return NextResponse.json({ message: "Proposal not found" }, { status: 404 })
    }

    const { action, notes, ...updateData } = parsed.data

    if (action === 'submit') {
      // WORKFLOW: Submit usulan dari pegawai ke operator sekolah
      if (!['DRAFT', 'PERLU_PERBAIKAN_DARI_SEKOLAH', 'DIKEMBALIKAN_OPERATOR', 'DIKEMBALIKAN_ADMIN'].includes(existingProposal.status)) {
        return NextResponse.json({ 
          message: 'Usulan tidak dapat disubmit dalam status ini' 
        }, { status: 400 })
      }

      // Check if all required documents are uploaded
      const documentRequirements = await prisma.documentRequirement.findMany({
        where: { isRequired: true }
      })

      const uploadedDocs = await prisma.proposalDocument.findMany({
        where: { proposalId: params.id },
        include: {
          documentRequirement: true
        }
      })

      const requiredDocCodes = documentRequirements.map(req => req.code)
      const uploadedDocCodes = uploadedDocs.map(doc => doc.documentRequirement.code)
      const missingRequiredDocs = requiredDocCodes.filter(code => !uploadedDocCodes.includes(code))

      if (missingRequiredDocs.length > 0) {
        return NextResponse.json({ 
          message: 'Belum semua dokumen wajib diupload',
          missingDocuments: missingRequiredDocs
        }, { status: 400 })
      }

      // Update status to next level in workflow
      const newStatus = 'MENUNGGU_VERIFIKASI_SEKOLAH'
      const newNotes = (existingProposal.notes || '') + 
        `\n[${new Date().toISOString()}] Disubmit oleh pegawai untuk verifikasi operator sekolah` +
        (notes ? `: ${notes}` : '')

      const updatedProposal = await prisma.promotionProposal.update({
        where: { id: params.id },
        data: {
          status: newStatus,
          notes: newNotes.trim(),
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: "SUBMIT_PROPOSAL",
          details: { 
            proposalId: updatedProposal.id, 
            fromStatus: existingProposal.status,
            toStatus: newStatus,
            submittedBy: 'pegawai',
            notes: notes
          },
          userId: session.user.id,
        },
      })

      return NextResponse.json({ 
        message: 'Usulan berhasil disubmit ke operator sekolah',
        proposal: updatedProposal 
      })

    } else if (action === 'withdraw') {
      // Withdraw usulan
      if (!['MENUNGGU_VERIFIKASI_SEKOLAH', 'MENUNGGU_VERIFIKASI_DINAS', 'DIPROSES_OPERATOR', 'DIPROSES_ADMIN'].includes(existingProposal.status)) {
        return NextResponse.json({ 
          message: 'Usulan tidak dapat ditarik dalam status ini' 
        }, { status: 400 })
      }

      const newNotes = (existingProposal.notes || '') + 
        `\n[${new Date().toISOString()}] Ditarik oleh pegawai` +
        (notes ? `: ${notes}` : '')

      const updatedProposal = await prisma.promotionProposal.update({
        where: { id: params.id },
        data: {
          status: 'DITARIK',
          notes: newNotes.trim(),
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: "WITHDRAW_PROPOSAL",
          details: { 
            proposalId: updatedProposal.id,
            withdrawnBy: 'pegawai',
            notes: notes
          },
          userId: session.user.id,
        },
      })

      return NextResponse.json({ 
        message: 'Usulan berhasil ditarik',
        proposal: updatedProposal 
      })

    } else {
      // Regular update
      if (existingProposal.status !== "DRAFT" && existingProposal.status !== "DIKEMBALIKAN_OPERATOR") {
        return NextResponse.json({ message: "Proposal cannot be updated in current status" }, { status: 400 })
      }

      const updatedProposal = await prisma.promotionProposal.update({
        where: { id: params.id },
        data: updateData,
        include: {
          documents: {
            include: {
              documentRequirement: true,
            },
          },
        },
      })

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: "UPDATE_PROPOSAL",
          details: { proposalId: updatedProposal.id, changes: updateData },
          userId: session.user.id,
        },
      })

      return NextResponse.json(updatedProposal)
    }
  } catch (error) {
    console.error("Error updating proposal:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if proposal exists and belongs to user
    const existingProposal = await prisma.promotionProposal.findFirst({
      where: {
        id: params.id,
        pegawaiId: session.user.id,
      },
    })

    if (!existingProposal) {
      return NextResponse.json({ message: "Proposal not found" }, { status: 404 })
    }

    // Only allow deletion of DRAFT proposals
    if (existingProposal.status !== "DRAFT") {
      return NextResponse.json({ message: "Only draft proposals can be deleted" }, { status: 400 })
    }

    await prisma.promotionProposal.delete({
      where: { id: params.id },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "DELETE_PROPOSAL",
        details: { proposalId: params.id },
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: "Proposal deleted successfully" })
  } catch (error) {
    console.error("Error deleting proposal:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
