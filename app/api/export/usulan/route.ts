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
    const status = searchParams.get("status") || undefined
    const searchQuery = searchParams.get("search") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "1000", 10) // Default 1000 untuk ekspor

    // Filter dasar
    const baseWhereClause: any = {}

    // Join ke User dan UnitKerja
    let userWhereClause: any = {}

    // Ambil semua usulan atau hanya usulan dari unit kerja tertentu
    if (unitKerjaId) {
      userWhereClause.unitKerjaId = unitKerjaId
    } else if (user.role === "OPERATOR_SEKOLAH") {
      // Untuk operator sekolah, perlu mengambil unitKerjaId dari user data
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { unitKerjaId: true }
      })
      
      if (userData?.unitKerjaId) {
        userWhereClause.unitKerjaId = userData.unitKerjaId
      }
    }

    // Filter status jika ada
    if (status && status !== 'ALL') {
      baseWhereClause.status = status
    }

    // Filter pencarian (nama pegawai, nip)
    if (searchQuery) {
      userWhereClause.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { nip: { contains: searchQuery, mode: 'insensitive' } }
      ]
    }

    // Ambil data usulan dengan informasi pegawai dan unit kerja
    const proposals = await prisma.promotionProposal.findMany({
      where: {
        ...baseWhereClause,
        pegawai: userWhereClause
      },
      include: {
        pegawai: {
          select: {
            id: true,
            nip: true,
            name: true,
            jabatan: true,
            golongan: true,
            unitKerja: {
              select: {
                id: true,
                nama: true
              }
            }
          }
        },
        operator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Hitung total data
    const total = await prisma.promotionProposal.count({
      where: {
        ...baseWhereClause,
        pegawai: userWhereClause
      }
    })

    return NextResponse.json({
      data: proposals,
      meta: {
        total,
        page,
        limit,
        pageCount: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Error fetching proposal data:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
