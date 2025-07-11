import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user's unit kerja for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 400 })
    }

    // Extract unitKerja ID based on whether it's a string or an object
    let unitKerjaId = null;
    if (typeof user.unitKerja === 'string') {
      // Try to find the unitKerja by name
      const unitKerjaByName = await prisma.unitKerja.findFirst({
        where: { nama: user.unitKerja },
        select: { id: true }
      });
      unitKerjaId = unitKerjaByName?.id;
    } else if (typeof user.unitKerja === 'object' && user.unitKerja !== null) {
      // If it's already an object with an ID
      unitKerjaId = (user.unitKerja as { id: string }).id;
    }

    if (!unitKerjaId) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Get recent pegawai data
    const recentPegawai = await prisma.user.findMany({
      where: {
        role: 'PEGAWAI',
        unitKerjaId: unitKerjaId
      },
      select: {
        id: true,
        name: true,
        nip: true,
        jabatan: true,
        jenisJabatan: true,
        golongan: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get recent usulan data
    const recentUsulan = await prisma.promotionProposal.findMany({
      where: {
        pegawai: {
          unitKerjaId: unitKerjaId
        }
      },
      select: {
        id: true,
        periode: true,
        status: true,
        createdAt: true,
        pegawai: {
          select: {
            name: true,
            nip: true,
            golongan: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    const response = {
      recentPegawai: recentPegawai.map(p => ({
        id: p.id,
        nama: p.name,
        nip: p.nip,
        jabatan: p.jabatan || 'Belum diatur',
        jenisJabatan: p.jenisJabatan || 'Belum diatur',
        golongan: p.golongan || 'Belum diatur',
        status: 'Aktif'
      })),
      recentUsulan: recentUsulan.map(u => {
        // Generate golongan tujuan based on current golongan
        const currentGolongan = u.pegawai.golongan || 'III/a'
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
        
        return {
          id: u.id,
          pegawai: u.pegawai.name,
          nip: u.pegawai.nip,
          golonganAsal: currentGolongan,
          golonganTujuan: golonganTujuan,
          periode: u.periode,
          status: getStatusDisplay(u.status),
          tanggal: u.createdAt?.toISOString().split('T')[0] || 'N/A'
        }
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Recent data API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'DIAJUKAN': 'Menunggu Verifikasi Sekolah',
    'MENUNGGU_VERIFIKASI_SEKOLAH': 'Menunggu Verifikasi Sekolah',
    'DIPROSES_OPERATOR': 'Sedang Diproses Operator',
    'MENUNGGU_VERIFIKASI_DINAS': 'Menunggu Verifikasi Dinas',
    'DIPROSES_ADMIN': 'Sedang Diproses Admin',
    'SELESAI': 'Selesai',
    'DITOLAK': 'Ditolak'
  }
  
  return statusMap[status] || status
}
