import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Build where clause
    const where: any = {}

    if (status && status !== "ALL") {
      where.status = status
    }

    if (wilayah && wilayah !== "ALL") {
      where.pegawai = {
        wilayah: wilayah
      }
    }

    if (search) {
      where.OR = [
        { pegawai: { name: { contains: search, mode: "insensitive" } } },
        { pegawai: { nip: { contains: search, mode: "insensitive" } } },
        { unitKerja: { contains: search, mode: "insensitive" } }
      ]
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
            golongan: true,
            unitKerja: true,
            wilayah: true
          }
        },
        documents: {
          include: {
            documentRequirement: true
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

    const formattedProposals = proposals.map(proposal => {
      // Calculate golongan progression
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

      // Get status label
      const statusLabels: Record<string, string> = {
        'DRAFT': 'Draft',
        'MENUNGGU_VERIFIKASI_SEKOLAH': 'Menunggu Verifikasi Sekolah',
        'MENUNGGU_VERIFIKASI_DINAS': 'Menunggu Verifikasi Dinas',
        'PERLU_PERBAIKAN_DARI_SEKOLAH': 'Perlu Perbaikan dari Sekolah',
        'PERLU_PERBAIKAN_DARI_DINAS': 'Perlu Perbaikan dari Dinas',
        'DIPROSES_ADMIN': 'Diproses Admin Pusat',
        'SELESAI': 'Selesai/Disetujui',
        'DITOLAK_SEKOLAH': 'Ditolak Sekolah',
        'DITOLAK_DINAS': 'Ditolak Dinas',
        'DITOLAK_ADMIN': 'Ditolak Admin Pusat',
        'DITARIK': 'Ditarik'
      }

      return {
        id: proposal.id,
        pegawai: proposal.pegawai,
        golonganAsal: currentGolongan,
        golonganTujuan: golonganTujuan,
        periode: proposal.periode,
        status: proposal.status,
        statusLabel: statusLabels[proposal.status] || proposal.status,
        tanggalAjukan: proposal.createdAt.toISOString().split('T')[0],
        tanggalUpdate: proposal.updatedAt.toISOString().split('T')[0],
        keterangan: proposal.notes || '',
        documentsCount: proposal.documents.length
      }
    })

    return NextResponse.json({
      proposals: formattedProposals,
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
