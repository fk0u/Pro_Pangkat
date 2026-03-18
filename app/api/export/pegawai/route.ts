import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    // Verifikasi session dan hak akses
    const session = await getSession()

    if (!session.isLoggedIn) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = session.user
    
    // Hanya admin, operator, dan operator sekolah yang boleh mengakses
    const allowedRoles = ["ADMIN", "OPERATOR", "OPERATOR_SEKOLAH"]
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      )
    }

    // Parse parameter query
    const { searchParams } = new URL(req.url)
    const unitKerjaId = searchParams.get("unitKerjaId") || undefined
    const searchQuery = searchParams.get("search") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "1000", 10) // Default 1000 untuk ekspor

    // Filter berdasarkan unitKerja dan peran
    let whereClause: any = {
      role: "PEGAWAI"
    }

    // Filter berdasarkan unitKerja jika ada
    if (unitKerjaId) {
      whereClause.unitKerjaId = unitKerjaId
    } else if (user.role === "OPERATOR_SEKOLAH" && user.unitKerjaId) {
      // Untuk operator sekolah, hanya bisa lihat pegawai di unitKerjanya
      whereClause.unitKerjaId = user.unitKerjaId
    }

    // Filter pencarian
    if (searchQuery) {
      whereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { nip: { contains: searchQuery, mode: 'insensitive' } },
        { jabatan: { contains: searchQuery, mode: 'insensitive' } },
      ]
    }

    // Hitung total data
    const total = await prisma.user.count({
      where: whereClause,
    })

    // Ambil data
    const pegawai = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        golongan: true,
        tmtGolongan: true,
        jabatan: true,
        jenisJabatan: true,
        phone: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        unitKerja: {
          select: {
            id: true,
            nama: true,
            npsn: true,
            jenjang: true,
            alamat: true,
            kecamatan: true,
            wilayah: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      data: pegawai,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching pegawai data:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
