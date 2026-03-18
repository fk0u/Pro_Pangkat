import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Cek autentikasi pengguna
    const session = await getSession()
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Dapatkan ID operator dari session
    const operatorId = session.user.id
    
    // Dapatkan informasi operator termasuk wilayah
    const operator = await prisma.user.findUnique({
      where: { id: operatorId },
      include: {
        wilayahRelasi: true
      }
    })
    
    if (!operator) {
      return NextResponse.json(
        { success: false, message: 'Operator tidak ditemukan' },
        { status: 404 }
      )
    }
    
    // Dapatkan semua unit kerja berdasarkan wilayah operator
    const unitKerjaData = await prisma.unitKerja.findMany({
      where: {
        wilayahId: operator.wilayahId
      },
      include: {
        wilayahRelasi: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })
    
    // Mendapatkan jumlah pegawai untuk setiap unit kerja
    const unitKerjaWithCounts = await Promise.all(
      unitKerjaData.map(async (unit) => {
        // Hitung jumlah pegawai untuk unit kerja ini
        const pegawaiCount = await prisma.user.count({
          where: {
            unitKerjaId: unit.id,
            role: 'PEGAWAI'
          }
        })
        
        // Hitung jumlah usulan untuk unit kerja ini
        const usulanCount = await prisma.usulan.count({
          where: {
            pegawai: {
              unitKerjaId: unit.id
            }
          }
        })
        
        return {
          ...unit,
          jumlahPegawai: pegawaiCount,
          jumlahUsulan: usulanCount
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      data: unitKerjaWithCounts,
      message: 'Data unit kerja berhasil diambil'
    })
  } catch (error) {
    console.error('Error mengambil data unit kerja:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
