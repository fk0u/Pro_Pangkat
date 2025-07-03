import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const wilayahList = await prisma.wilayahMaster.findMany({
      include: {
        _count: {
          select: {
            unitKerja: true,
            users: true
          }
        }
      },
      orderBy: {
        kode: 'asc'
      }
    })

    // Enrich data dengan statistik
    const enrichedWilayah = await Promise.all(
      wilayahList.map(async (wilayah) => {
        // Count unit kerja aktif
        const activeUnitKerja = await prisma.unitKerja.count({
          where: {
            wilayahId: wilayah.id,
            status: 'AKTIF'
          }
        })

        // Count pegawai
        const totalPegawai = await prisma.user.count({
          where: {
            wilayahId: wilayah.id,
            role: 'PEGAWAI'
          }
        })

        // Count operators
        const totalOperators = await prisma.user.count({
          where: {
            wilayahId: wilayah.id,
            role: 'OPERATOR'
          }
        })

        return {
          id: wilayah.id,
          kode: wilayah.kode,
          nama: wilayah.nama,
          namaLengkap: wilayah.namaLengkap,
          ibukota: wilayah.ibukota,
          koordinat: wilayah.koordinat,
          luasWilayah: wilayah.luasWilayah,
          jumlahKecamatan: wilayah.jumlahKecamatan,
          isActive: wilayah.isActive,
          statistics: {
            totalUnitKerja: wilayah._count.unitKerja,
            activeUnitKerja,
            totalUsers: wilayah._count.users,
            totalPegawai,
            totalOperators
          },
          createdAt: wilayah.createdAt,
          updatedAt: wilayah.updatedAt
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enrichedWilayah,
      summary: {
        totalWilayah: enrichedWilayah.length,
        totalUnitKerja: enrichedWilayah.reduce((sum, w) => sum + w.statistics.totalUnitKerja, 0),
        totalPegawai: enrichedWilayah.reduce((sum, w) => sum + w.statistics.totalPegawai, 0),
        totalOperators: enrichedWilayah.reduce((sum, w) => sum + w.statistics.totalOperators, 0)
      }
    })

  } catch (error) {
    console.error('Error fetching wilayah master:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch wilayah master data' 
      },
      { status: 500 }
    )
  }
}
