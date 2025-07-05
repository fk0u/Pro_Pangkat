import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const wilayah = searchParams.get("wilayah")
    const periode = searchParams.get("periode")

    // Build where clause
    const where: any = {}

    if (status && status !== "ALL") {
      where.status = status
    } else {
      // If no specific status is requested, prioritize those needing admin attention
      where.OR = [
        { status: "DISETUJUI_OPERATOR" }, // Approved by operator, needs admin approval
        { status: "DIPROSES_ADMIN" },    // Being processed by admin
      ]
    }

    if (wilayah && wilayah !== "ALL") {
      where.pegawai = {
        OR: [
          { wilayah: wilayah },
          { wilayahId: wilayah }
        ]
      }
    }

    if (search) {
      where.OR = [
        { pegawai: { name: { contains: search, mode: "insensitive" } } },
        { pegawai: { nip: { contains: search, mode: "insensitive" } } }
      ]
    }
    
    if (periode && periode !== "ALL") {
      where.periode = periode
    }

    // Get total count
    const total = await prisma.promotionProposal.count({ where })

    // Get proposals with pagination
    const proposals = await prisma.promotionProposal.findMany({
      where,
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            nip: true,
            jabatan: true,
            unitKerja: true,
            wilayah: true,
            wilayahId: true
          }
        },
        documents: {
          include: {
            documentRequirement: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: [
        { updatedAt: "desc" },
        { createdAt: "desc" }
      ],
      skip: (page - 1) * limit,
      take: limit,
    })
    
    // Process proposals to ensure data is in the expected format
    const processedProposals = proposals.map(proposal => {
      // Handle unitKerja if it's an object
      let unitKerja = proposal.pegawai.unitKerja
      if (unitKerja && typeof unitKerja === 'object' && unitKerja !== null) {
        // @ts-ignore - unitKerja might be an object with name/nama property
        unitKerja = unitKerja.nama || unitKerja.name || "Unit Kerja Tidak Tersedia"
      }
      
      return {
        id: proposal.id,
        name: proposal.pegawai.name, // For backward compatibility
        nip: proposal.pegawai.nip,
        pegawaiId: proposal.pegawai.id,
        pegawai: {
          id: proposal.pegawai.id,
          nama: proposal.pegawai.name,
          nip: proposal.pegawai.nip,
          jabatan: proposal.pegawai.jabatan,
          unitKerja: unitKerja
        },
        status: proposal.status,
        periode: proposal.periode,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
        dokumen: proposal.documents.map(doc => ({
          id: doc.id,
          fileId: doc.fileUrl,
          name: doc.documentRequirement.name,
          documentType: doc.documentRequirement.code
        }))
      }
    })

    return NextResponse.json({
      status: "success",
      data: processedProposals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// Route for handling admin actions on proposals (PUT)
export const PUT = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const body = await req.json()
    const { proposalId, status, catatan } = body

    if (!proposalId || !status) {
      return createErrorResponse("Missing required fields", 400)
    }

    // Check if proposal exists
    const proposal = await prisma.promotionProposal.findUnique({
      where: { id: proposalId },
      include: {
        pegawai: {
          select: {
            id: true,
            nama: true,
            nip: true
          }
        }
      }
    })

    if (!proposal) {
      return createErrorResponse("Proposal not found", 404)
    }

    // Update proposal
    const updatedProposal = await prisma.promotionProposal.update({
      where: { id: proposalId },
      data: {
        status,
        notes: catatan || undefined
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: status === "DISETUJUI_ADMIN" ? "APPROVE_PROPOSAL" : "REJECT_PROPOSAL",
        details: {
          proposalId: proposal.id,
          pegawaiName: proposal.pegawai.nama,
          pegawaiNip: proposal.pegawai.nip,
          previousStatus: proposal.status,
          newStatus: status,
          reason: catatan || (status === "DISETUJUI_ADMIN" ? "Disetujui oleh admin" : "Ditolak oleh admin")
        },
        userId: user.id
      }
    })

    return createSuccessResponse(updatedProposal, "Proposal updated successfully")
  } catch (error: any) {
    console.error("Error updating proposal:", error)
    return createErrorResponse(error.message || "Failed to update proposal")
  }
})
