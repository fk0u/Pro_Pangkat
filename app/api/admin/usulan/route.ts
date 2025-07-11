import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-utils"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session.isLoggedIn || session.user?.role !== "ADMIN") {
      return NextResponse.json({ 
        status: "error",
        message: "Unauthorized access. Admin privileges required."
      }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const wilayah = searchParams.get("wilayah")
    const periode = searchParams.get("periode")
    const onlyInbox = searchParams.get("inbox") === "true"

    console.log("[API] Fetching usulan with params:", { status, page, limit, search, wilayah, periode, onlyInbox });

    // Build where clause
    const whereConditions: Record<string, unknown>[] = [];
    
    // Status filter
    if (status && status !== "ALL") {
      whereConditions.push({ status });
    } else if (onlyInbox) {
      // For inbox view, only show proposals that need admin attention
      whereConditions.push({
        OR: [
          { status: "DISETUJUI_OPERATOR" }, // Approved by operator, needs admin approval
          { status: "DIPROSES_ADMIN" },     // Being processed by admin
        ]
      });
    } else {
      // If no specific status is requested and not inbox view, show all proposals
      // but prioritize those needing admin attention
      whereConditions.push({
        OR: [
          { status: "DISETUJUI_OPERATOR" }, 
          { status: "DIPROSES_ADMIN" },
          { status: "SELESAI" },
          { status: "DITOLAK" },
          { status: "DITOLAK_ADMIN" },
          { status: "DIKEMBALIKAN_ADMIN" }
        ]
      });
    }
    
    // Wilayah filter
    if (wilayah && wilayah !== "ALL") {
      whereConditions.push({
        pegawai: {
          unitKerja: {
            wilayah: wilayah
          }
        }
      });
    }
    
    // Search filter
    if (search && search.trim() !== "") {
      whereConditions.push({
        OR: [
          { pegawai: { name: { contains: search, mode: "insensitive" } } },
          { pegawai: { nip: { contains: search, mode: "insensitive" } } }
        ]
      });
    }
    
    // Periode filter
    if (periode && periode !== "ALL") {
      whereConditions.push({ periode });
    }
    
    // Combine all conditions with AND
    const where = whereConditions.length > 0 
      ? { AND: whereConditions } 
      : {};

    // Get total count
    const total = await prisma.promotionProposal.count({ where })
    
    if (total === 0) {
      // Return empty data instead of error when no results are found
      return NextResponse.json({
        status: "success",
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        },
        message: onlyInbox 
          ? "Tidak ada usulan yang memerlukan perhatian admin saat ini"
          : status && status !== "ALL"
          ? `Tidak ada usulan dengan status ${status} yang ditemukan`
          : search && search.trim() !== ""
          ? `Tidak ada usulan yang cocok dengan pencarian "${search}"`
          : "Belum ada data usulan yang tersedia dalam database"
      })
    }

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
            golongan: true,
            tmtGolongan: true,
            unitKerja: true,
            unitKerjaId: true
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
    
    // Helper functions for processing proposals
    
    // Get the next golongan based on current golongan
    function getNextGolongan(currentGolongan: string): string {
      // Map of golongan progression
      const golonganProgression: Record<string, string> = {
        "I/a": "I/b",
        "I/b": "I/c",
        "I/c": "I/d",
        "I/d": "II/a",
        "II/a": "II/b",
        "II/b": "II/c",
        "II/c": "II/d",
        "II/d": "III/a",
        "III/a": "III/b",
        "III/b": "III/c",
        "III/c": "III/d",
        "III/d": "IV/a",
        "IV/a": "IV/b",
        "IV/b": "IV/c",
        "IV/c": "IV/d",
        "IV/d": "IV/e",
        // Add other mappings as needed
      };
      
      return golonganProgression[currentGolongan] || 
             (currentGolongan !== "-" ? `${currentGolongan} + 1` : "-");
    }
    
    // Get a more descriptive status text
    function getStatusDescription(status: string): string {
      const statusMap: Record<string, string> = {
        "DRAFT": "Draft (Belum Diajukan)",
        "DIAJUKAN": "Telah Diajukan",
        "DIPROSES_OPERATOR": "Sedang Diproses Operator",
        "DITOLAK_OPERATOR": "Ditolak oleh Operator",
        "DISETUJUI_OPERATOR": "Disetujui Operator (Menunggu Admin)",
        "DIPROSES_ADMIN": "Sedang Diproses Admin",
        "DITOLAK": "Ditolak oleh Admin",
        "DISETUJUI_ADMIN": "Disetujui Admin",
        "SELESAI": "Selesai Diproses",
        "DITOLAK_SEKOLAH": "Ditolak oleh Sekolah",
        "DISETUJUI_SEKOLAH": "Disetujui oleh Sekolah",
      };
      
      return statusMap[status] || status;
    }
    
    // Helper function to generate timeline for a proposal
    function generateProposalTimeline(proposal: {
      id: string;
      createdAt: Date;
      periode: string;
      pegawai: {
        golongan?: string;
      };
    }): {
      id: string;
      title: string;
      startDate: Date;
      endDate: Date;
      description: string;
    } {
      const timeline = {
        id: 'proposal-' + proposal.id,
        title: proposal.periode || 'Periode Kenaikan Pangkat',
        startDate: proposal.createdAt,
        endDate: new Date(new Date(proposal.createdAt).setMonth(new Date(proposal.createdAt).getMonth() + 3)),
        description: `Proses kenaikan pangkat dari ${proposal.pegawai.golongan || '-'} ke ${getNextGolongan(proposal.pegawai.golongan || '-')}`
      };
      
      return timeline;
    }

    // Process proposals to ensure data is in the expected format
    const processedProposals = proposals.map(proposal => {
      // Handle unitKerja 
      let unitKerjaName = "Unit Kerja Tidak Tersedia";
      let wilayahInfo = null;
      
      if (proposal.pegawai.unitKerja) {
        if (typeof proposal.pegawai.unitKerja === 'object' && proposal.pegawai.unitKerja !== null) {
          // @ts-expect-error - unitKerja might be an object with name/nama property
          unitKerjaName = proposal.pegawai.unitKerja.nama || proposal.pegawai.unitKerja.name || "Unit Kerja Tidak Tersedia";
          wilayahInfo = proposal.pegawai.unitKerja.wilayah ? {
            // @ts-expect-error - wilayah structure
            id: proposal.pegawai.unitKerja.wilayah.id || proposal.pegawai.unitKerja.wilayah,
            // @ts-expect-error - wilayah structure
            name: proposal.pegawai.unitKerja.wilayah.name || proposal.pegawai.unitKerja.wilayah
          } : null;
        } else if (typeof proposal.pegawai.unitKerja === 'string') {
          unitKerjaName = proposal.pegawai.unitKerja;
        }
      }
      
      // Calculate target golongan based on current golongan
      const currentGolongan = proposal.pegawai.golongan || "III/a";
      const targetGolongan = getNextGolongan(currentGolongan);
      
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
          unitKerja: unitKerjaName,
          wilayah: wilayahInfo,
          golongan: currentGolongan,
          targetGolongan: targetGolongan,
          tmtGolongan: proposal.pegawai.tmtGolongan
        },
        status: proposal.status,
        statusText: getStatusDescription(proposal.status),
        periode: proposal.periode,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
        timeline: generateProposalTimeline({
          id: proposal.id,
          createdAt: proposal.createdAt,
          periode: proposal.periode,
          pegawai: {
            golongan: proposal.pegawai.golongan || undefined
          }
        }),
        dokumen: proposal.documents.map((doc) => ({
          id: doc.id,
          fileId: doc.fileUrl,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          status: doc.status,
          name: doc.documentRequirement.name,
          documentType: doc.documentRequirement.code
        }))
      };
    });

    return NextResponse.json({
      status: "success",
      data: processedProposals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      message: `Berhasil memuat ${processedProposals.length} usulan dari total ${total} data`
    })
  } catch (error) {
    console.error("[API ERROR] Error fetching proposals:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : "No stack trace available";
    
    // Return more detailed error information
    return NextResponse.json({ 
      status: "error",
      message: "Gagal memuat data usulan. Silakan coba lagi.", 
      details: process.env.NODE_ENV === 'development' ? {
        error: errorMessage,
        stack: errorStack,
        hint: "Periksa koneksi database dan integritas schema"
      } : { 
        message: "Terjadi kesalahan internal server. Silakan coba beberapa saat lagi." 
      }
    }, { status: 500 })
  }
}

// Route for handling admin actions on proposals (PUT)
export const PUT = withAuth(async (req: NextRequest, user: { id: string, role: string }) => {
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
            name: true,
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
          pegawaiName: proposal.pegawai.name,
          pegawaiNip: proposal.pegawai.nip,
          previousStatus: proposal.status,
          newStatus: status,
          reason: catatan || (status === "DISETUJUI_ADMIN" ? "Disetujui oleh admin" : "Ditolak oleh admin")
        },
        userId: user.id
      }
    })

    return createSuccessResponse(updatedProposal, "Proposal updated successfully")
  } catch (error) {
    console.error("Error updating proposal:", error)
    return createErrorResponse(error instanceof Error ? error.message : "Failed to update proposal")
  }
})
