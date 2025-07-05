import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { z } from "zod"

const createProposalSchema = z.object({
  periode: z.string().min(1, "Periode harus diisi"),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Ambil semua usulan untuk pegawai ini, baik yang dibuat sendiri maupun yang dibuat operator sekolah
    const proposals = await prisma.promotionProposal.findMany({
      where: { pegawaiId: session.user.id },
      include: {
        pegawai: {
          select: {
            name: true,
            nip: true,
            jabatan: true,
            golongan: true,
            unitKerja: true,
          },
        },
        documents: {
          include: {
            documentRequirement: {
              select: {
                name: true,
                code: true,
                description: true,
                isRequired: true,
              },
            },
          },
          orderBy: { uploadedAt: "asc" },
        },
        operator: {
          select: {
            name: true,
            nip: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Get document requirements yang belum diupload
    const documentRequirements = await prisma.documentRequirement.findMany({
      orderBy: { name: 'asc' }
    })

    // Transform data untuk response
    const transformedProposals = proposals.map((proposal) => {
      // Tentukan golongan tujuan berdasarkan golongan saat ini
      const currentGolongan = proposal.pegawai.golongan || 'III/a'
      const golonganMap: Record<string, string> = {
        'III/a': 'III/b',
        'III/b': 'III/c',
        'III/c': 'III/d',
        'III/d': 'IV/a',
        'IV/a': 'IV/b',
        'IV/b': 'IV/c',
        'IV/c': 'IV/d',
        'IV/d': 'IV/e',
      }
      const golonganTujuan = golonganMap[currentGolongan] || 'IV/a'

      // Cari dokumen yang belum diupload
      const uploadedDocCodes = proposal.documents.map(doc => doc.documentRequirement.code)
      const missingDocuments = documentRequirements.filter(req => !uploadedDocCodes.includes(req.code))

      return {
        id: proposal.id,
        periode: proposal.periode,
        status: proposal.status,
        notes: proposal.notes,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
        pegawai: proposal.pegawai,
        operator: proposal.operator,
        golonganAsal: currentGolongan,
        golonganTujuan: golonganTujuan,
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
    })

    return NextResponse.json(transformedProposals)
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "PEGAWAI") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    console.log("Create proposal request body:", body);
    
    // Allow formData field to pass through validation
    const parsed = createProposalSchema.safeParse(body)

    if (!parsed.success) {
      console.error("Validation failed:", parsed.error.errors);
      return NextResponse.json({ message: "Invalid input", errors: parsed.error.errors }, { status: 400 })
    }

    // In production, check for existing proposals
    if (process.env.NODE_ENV === 'production') {
      // Cek apakah sudah ada proposal dengan status DRAFT atau sedang diproses
      const existingProposal = await prisma.promotionProposal.findFirst({
        where: {
          pegawaiId: session.user.id,
          status: {
            in: ["DRAFT", "DIAJUKAN", "DIPROSES_OPERATOR", "DIPROSES_ADMIN", "MENUNGGU_VERIFIKASI_DINAS", "MENUNGGU_VERIFIKASI_SEKOLAH"]
          }
        }
      })

      if (existingProposal) {
        return NextResponse.json({ 
          message: "Anda masih memiliki proposal yang sedang diproses. Tidak dapat membuat proposal baru." 
        }, { status: 400 })
      }
    }

    // Create the proposal
    const proposal = await prisma.promotionProposal.create({
      data: {
        periode: parsed.data.periode,
        notes: parsed.data.notes || `Usulan kenaikan pangkat untuk periode ${parsed.data.periode}`,
        pegawaiId: session.user.id,
        status: "DRAFT",
      },
      include: {
        pegawai: {
          select: {
            name: true,
            nip: true,
            jabatan: true,
            golongan: true,
            unitKerja: true,
          },
        },
        documents: {
          include: {
            documentRequirement: true,
          },
        },
      },
    })

    console.log("Proposal created successfully:", proposal.id);

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "CREATE_PROPOSAL",
        details: { proposalId: proposal.id, periode: proposal.periode },
        userId: session.user.id,
      },
    })

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    console.error("Error creating proposal:", error)
    
    // Provide more detailed error message
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      message: errorMessage,
      detail: "Failed to create proposal. Please check the data you provided."
    }, { status: 500 })
  }
}
