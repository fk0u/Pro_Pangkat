import type { NextRequest } from "next/server"
import { withAuth, createErrorResponse } from "@/lib/api-utils"
import { generateExcelExport } from "@/lib/excel-utils"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const GET = withAuth(
  async (req: NextRequest, user: any) => {
    try {
      const url = new URL(req.url)
      const format = url.searchParams.get("format") || "excel"
      const periode = url.searchParams.get("periode")
      const status = url.searchParams.get("status")
      const wilayah = url.searchParams.get("wilayah")

      // Build where clause
      const whereClause: any = {}

      if (periode) whereClause.periode = periode
      if (status) whereClause.status = status

      // Role-based filtering
      if (user.role === "OPERATOR" && user.wilayah) {
        whereClause.pegawai = { wilayah: user.wilayah }
      } else if (wilayah && user.role === "ADMIN") {
        whereClause.pegawai = { wilayah: wilayah }
      }

      // Fetch proposals
      const proposals = await prisma.promotionProposal.findMany({
        where: whereClause,
        include: {
          pegawai: {
            select: {
              nip: true,
              name: true,
              unitKerja: true,
              golongan: true,
              jabatan: true,
              jenisJabatan: true,
              wilayah: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      // Format data for export
      const exportData = proposals.map((proposal, index) => ({
        No: index + 1,
        NIP: proposal.pegawai.nip,
        Nama: proposal.pegawai.name,
        "Unit Kerja": proposal.pegawai.unitKerja || "-",
        Wilayah: proposal.pegawai.wilayah || "-",
        "Golongan Saat Ini": proposal.currentGolongan,
        "Golongan Target": proposal.targetGolongan,
        Jabatan: proposal.pegawai.jabatan || "-",
        "Jenis Jabatan": proposal.pegawai.jenisJabatan || "-",
        Status: proposal.status,
        Periode: proposal.periode,
        "Tanggal Diajukan": proposal.createdAt.toLocaleDateString("id-ID"),
        Catatan: proposal.notes || "-",
      }))

      if (format === "excel") {
        const buffer = generateExcelExport(
          exportData,
          "Data Usulan Kenaikan Pangkat",
          `usulan-kenaikan-pangkat-${new Date().toISOString().split("T")[0]}.xlsx`,
        )

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="usulan-kenaikan-pangkat-${new Date().toISOString().split("T")[0]}.xlsx"`,
          },
        })
      }

      // For other formats, return JSON for now
      return NextResponse.json(exportData)
    } catch (error: any) {
      console.error("Error exporting proposals:", error)
      return createErrorResponse(error.message || "Failed to export data")
    }
  },
  ["OPERATOR", "ADMIN"],
)
