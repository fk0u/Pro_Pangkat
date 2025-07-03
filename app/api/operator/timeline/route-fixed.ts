import { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"
import { StatusProposal, StatusDokumen } from "@prisma/client"

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Hanya operator yang bisa mengakses
    if (user.role !== "OPERATOR") {
      return createErrorResponse("Access denied", 403)
    }

    // Get operator's wilayah
    const operatorData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { wilayah: true, name: true },
    })

    if (!operatorData || !operatorData.wilayah) {
      return createErrorResponse("Operator wilayah not found", 400)
    }

    // Current period (since no Timeline model in schema)
    const currentPeriod = {
      title: "Periode Agustus 2025",
      startDate: "2025-08-01",
      endDate: "2025-08-31"
    }

    // Get proposals in operator's region
    const proposals = await prisma.promotionProposal.findMany({
      where: {
        pegawai: {
          wilayah: operatorData.wilayah,
        },
      },
      include: {
        pegawai: {
          select: {
            name: true,
            nip: true,
            unitKerja: true,
            jabatan: true,
            golongan: true,
          },
        },
        documents: {
          include: {
            documentRequirement: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Helper function to get jabatan type
    function getJabatanType(jabatan: string | null): string {
      if (!jabatan) return "pelaksana"
      const jabatanLower = jabatan.toLowerCase()
      
      if (jabatanLower.includes("struktural") || jabatanLower.includes("kepala") || jabatanLower.includes("direktur") || jabatanLower.includes("manager")) {
        return "struktural"
      } else if (jabatanLower.includes("fungsional") || jabatanLower.includes("ahli") || jabatanLower.includes("terampil")) {
        return "fungsional"
      } else {
        return "pelaksana"
      }
    }

    // Group proposals by jabatan type
    const groupedProposals = proposals.reduce((acc: any, proposal: any) => {
      const jabatanType = getJabatanType(proposal.pegawai.jabatan)
      if (!acc[jabatanType]) {
        acc[jabatanType] = []
      }
      acc[jabatanType].push(proposal)
      return acc
    }, {})

    // Create timeline data for each jabatan type
    const jabatanTypes = [
      {
        id: "pelaksana",
        title: "Jabatan Pelaksana",
        description: "Kenaikan pangkat untuk jabatan pelaksana"
      },
      {
        id: "struktural", 
        title: "Jabatan Struktural",
        description: "Kenaikan pangkat untuk jabatan struktural"
      },
      {
        id: "fungsional",
        title: "Jabatan Fungsional", 
        description: "Kenaikan pangkat untuk jabatan fungsional"
      }
    ]

    const timelineData = jabatanTypes.map(jabatanType => {
      const jabatanProposals = groupedProposals[jabatanType.id] || []
      
      // Default periods for all jabatan types
      const defaultPeriods = [
        {
          type: "Waktu Pengusulan",
          startDate: "5 Mei 2025",
          endDate: "19 Mei 2025",
        },
        {
          type: "Waktu Perbaikan", 
          startDate: "5 Mei 2025",
          endDate: "28 Mei 2025",
        },
      ]

      // Get sample pegawai with document count
      const pegawaiSample = jabatanProposals.slice(0, 5).map((proposal: any) => ({
        nama: proposal.pegawai.name,
        nip: proposal.pegawai.nip,
        unitKerja: proposal.pegawai.unitKerja,
        jabatan: proposal.pegawai.jabatan,
        golongan: proposal.pegawai.golongan,
        dokumen: proposal.documents?.length || 0,
        status: proposal.status,
      }))

      return {
        id: jabatanType.id,
        title: jabatanType.title,
        description: jabatanType.description,
        total: jabatanProposals.length,
        status: "active",
        periods: defaultPeriods,
        pegawai: pegawaiSample,
        statistics: {
          diajukan: jabatanProposals.filter((p: any) => p.status === StatusProposal.DIAJUKAN).length,
          diproses: jabatanProposals.filter((p: any) => p.status === StatusProposal.DIPROSES_OPERATOR).length,
          disetujui: jabatanProposals.filter((p: any) => p.status === StatusProposal.DISETUJUI_OPERATOR).length,
          ditolak: jabatanProposals.filter((p: any) => p.status === StatusProposal.DITOLAK).length,
        }
      }
    })

    return createSuccessResponse({
      timelineData,
      currentPeriod,
      summary: {
        totalProposals: proposals.length,
        byJabatan: {
          pelaksana: groupedProposals.pelaksana?.length || 0,
          struktural: groupedProposals.struktural?.length || 0,
          fungsional: groupedProposals.fungsional?.length || 0,
        },
        byStatus: {
          draft: proposals.filter(p => p.status === StatusProposal.DRAFT).length,
          diajukan: proposals.filter(p => p.status === StatusProposal.DIAJUKAN).length,
          diproses: proposals.filter(p => p.status === StatusProposal.DIPROSES_OPERATOR).length,
          disetujui: proposals.filter(p => p.status === StatusProposal.DISETUJUI_OPERATOR).length,
          ditolak: proposals.filter(p => p.status === StatusProposal.DITOLAK).length,
        }
      }
    })

  } catch (error) {
    console.error("Error fetching operator timeline data:", error)
    return createErrorResponse("Failed to fetch timeline data", 500)
  }
})
