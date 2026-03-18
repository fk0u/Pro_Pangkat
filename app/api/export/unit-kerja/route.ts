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
    if (!user) {
      return NextResponse.json(
        { message: "User session not found" },
        { status: 401 }
      )
    }
    
    // Hanya admin dan operator yang boleh mengakses semua unit kerja
    const allowedRoles = ["ADMIN", "OPERATOR", "OPERATOR_SEKOLAH"]
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      )
    }

    // Parse parameter query
    const { searchParams } = new URL(req.url)
    const wilayah = searchParams.get("wilayah") || undefined
    const jenjang = searchParams.get("jenjang") || undefined
    const searchQuery = searchParams.get("search") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "1000", 10) // Default 1000 untuk ekspor

    // Bangun filter
    const whereClause: Record<string, any> = {}

    // Filter berdasarkan wilayah jika ada
    if (wilayah) {
      whereClause.wilayah = wilayah
    }

    // Filter berdasarkan jenjang jika ada
    if (jenjang) {
      whereClause.jenjang = jenjang
    }

    // Untuk operator sekolah, hanya bisa melihat unit kerjanya sendiri
    if (user.role === "OPERATOR_SEKOLAH") {
      // Dapatkan unitKerjaId operator
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { unitKerjaId: true }
      })
      
      if (userData?.unitKerjaId) {
        whereClause.id = userData.unitKerjaId
      }
    }

    // Filter pencarian
    if (searchQuery) {
      whereClause.OR = [
        { nama: { contains: searchQuery, mode: 'insensitive' } },
        { npsn: { contains: searchQuery, mode: 'insensitive' } },
        { alamat: { contains: searchQuery, mode: 'insensitive' } },
        { kecamatan: { contains: searchQuery, mode: 'insensitive' } }
      ]
    }

    // Ambil data unit kerja
    const unitKerja = await prisma.unitKerja.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            users: {
              where: {
                role: 'PEGAWAI'
              }
            }
          }
        }
      },
      orderBy: {
        nama: 'asc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Hitung total data
    const total = await prisma.unitKerja.count({
      where: whereClause
    })

    // Transformasi data untuk respons
    const formattedData = unitKerja.map(unit => ({
      ...unit,
      jumlahPegawai: unit._count.users
    }))

    return NextResponse.json({
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Error fetching unit kerja data:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
