import type { NextRequest } from "next/server"
import { withAuth, createSuccessResponse, createErrorResponse } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

/**
 * GET endpoint for exporting data in various formats
 * Supports CSV and JSON export formats with flexible filtering
 */
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return createErrorResponse("Unauthorized", 403)
    }

    const url = new URL(req.url)
    const format = url.searchParams.get("format") || "json" // 'json' or 'csv'
    const type = url.searchParams.get("type") || "proposals" // 'proposals', 'users', 'documents', 'unit-kerja'
    const periodId = url.searchParams.get("periodId")
    const status = url.searchParams.get("status")
    const wilayahId = url.searchParams.get("wilayahId")
    const jenjang = url.searchParams.get("jenjang")
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    
    // Define export data based on type
    let exportData: any[] = []
    
    switch (type) {
      case "proposals":
        // Build where clause
        const proposalsWhere: any = {}
        
        if (periodId) {
          proposalsWhere.periode = periodId
        }
        
        if (status && status !== "all") {
          proposalsWhere.status = status
        }
        
        if (startDate || endDate) {
          proposalsWhere.createdAt = {}
          
          if (startDate) {
            proposalsWhere.createdAt.gte = new Date(startDate)
          }
          
          if (endDate) {
            proposalsWhere.createdAt.lte = new Date(endDate)
          }
        }
        
        if (wilayahId) {
          proposalsWhere.pegawai = {
            wilayahId
          }
        }
        
        // Get proposals with related data
        const proposals = await prisma.promotionProposal.findMany({
          where: proposalsWhere,
          include: {
            pegawai: {
              select: {
                nama: true,
                nip: true,
                jabatan: true,
                golongan: true,
                unitKerja: true,
                wilayahRelasi: true
              }
            },
            documents: {
              include: {
                documentRequirement: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        })
        
        // Transform data for export
        exportData = proposals.map(proposal => ({
          ID: proposal.id,
          Periode: proposal.periode,
          Status: proposal.status,
          NamaPegawai: proposal.pegawai?.nama || "N/A",
          NIP: proposal.pegawai?.nip || "N/A",
          Jabatan: proposal.pegawai?.jabatan || "N/A",
          Golongan: proposal.pegawai?.golongan || "N/A",
          UnitKerja: typeof proposal.pegawai?.unitKerja === 'object' 
            ? proposal.pegawai?.unitKerja?.nama 
            : proposal.pegawai?.unitKerja || "N/A",
          Wilayah: proposal.pegawai?.wilayahRelasi?.nama || "N/A",
          JumlahDokumen: proposal.documents.length,
          TanggalPengajuan: proposal.createdAt.toISOString().split('T')[0],
          TanggalUpdate: proposal.updatedAt.toISOString().split('T')[0],
          Catatan: proposal.notes || ""
        }))
        break
        
      case "users":
        // Build where clause
        const usersWhere: any = {}
        
        if (wilayahId) {
          usersWhere.wilayahId = wilayahId
        }
        
        // Get users
        const users = await prisma.user.findMany({
          where: usersWhere,
          include: {
            unitKerja: true,
            wilayahRelasi: true
          },
          orderBy: {
            name: "asc"
          }
        })
        
        // Transform data for export
        exportData = users.map(user => ({
          ID: user.id,
          NIP: user.nip,
          Nama: user.name,
          Email: user.email || "N/A",
          Role: user.role,
          Golongan: user.golongan || "N/A",
          TMTGolongan: user.tmtGolongan ? user.tmtGolongan.toISOString().split('T')[0] : "N/A",
          Jabatan: user.jabatan || "N/A",
          JenisJabatan: user.jenisJabatan || "N/A",
          UnitKerja: user.unitKerja?.nama || "N/A",
          Wilayah: user.wilayahRelasi?.nama || "N/A",
          Pendidikan: user.pendidikan || "N/A",
          Jurusan: user.jurusan || "N/A",
          TahunLulus: user.tahunLulus || "N/A",
          TanggalRegistrasi: user.createdAt.toISOString().split('T')[0]
        }))
        break
        
      case "unit-kerja":
        // Build where clause
        const unitKerjaWhere: any = {}
        
        if (wilayahId) {
          unitKerjaWhere.wilayahId = wilayahId
        }
        
        if (jenjang && jenjang !== "all") {
          unitKerjaWhere.jenjang = jenjang
        }
        
        // Get unit kerja
        const unitKerjas = await prisma.unitKerja.findMany({
          where: unitKerjaWhere,
          include: {
            wilayahRelasi: true,
            pegawai: {
              select: {
                id: true,
                nama: true,
                nip: true
              }
            }
          },
          orderBy: {
            nama: "asc"
          }
        })
        
        // Transform data for export
        exportData = unitKerjas.map(unitKerja => ({
          ID: unitKerja.id,
          Nama: unitKerja.nama,
          NPSN: unitKerja.npsn || "N/A",
          Jenjang: unitKerja.jenjang,
          Alamat: unitKerja.alamat || "N/A",
          Kecamatan: unitKerja.kecamatan || "N/A",
          Kabupaten: unitKerja.kabupaten || "N/A",
          Provinsi: unitKerja.provinsi || "N/A",
          KepalaSekolah: unitKerja.kepalaSekolah || "N/A",
          Telepon: unitKerja.telepon || "N/A",
          Email: unitKerja.email || "N/A",
          Website: unitKerja.website || "N/A",
          BentukSekolah: unitKerja.bentukSekolah || "N/A",
          StatusSekolah: unitKerja.statusSekolah || "N/A",
          Wilayah: unitKerja.wilayahRelasi?.nama || "N/A",
          JumlahPegawai: unitKerja.pegawai.length,
          Status: unitKerja.status
        }))
        break
        
      default:
        return createErrorResponse(`Invalid export type: ${type}`, 400)
    }
    
    // Format output based on requested format
    if (format === "csv") {
      // Convert to CSV
      if (exportData.length === 0) {
        return new Response("No data available for export", {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename=${type}-export-${new Date().toISOString().split('T')[0]}.csv`
          }
        })
      }
      
      const headers = Object.keys(exportData[0]).join(",")
      const rows = exportData.map(row => 
        Object.values(row).map(value => 
          // Handle values with commas by wrapping in quotes
          typeof value === 'string' && value.includes(",") 
            ? `"${value}"` 
            : value
        ).join(",")
      )
      
      const csv = [headers, ...rows].join("\n")
      
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=${type}-export-${new Date().toISOString().split('T')[0]}.csv`
        }
      })
    } else {
      // Return JSON by default
      return createSuccessResponse({
        data: exportData,
        metadata: {
          type,
          count: exportData.length,
          exportDate: new Date().toISOString()
        }
      })
    }
  } catch (error: any) {
    console.error(`Error exporting ${error.message || error}:`, error)
    return createErrorResponse(error.message || "Failed to export data")
  }
})
