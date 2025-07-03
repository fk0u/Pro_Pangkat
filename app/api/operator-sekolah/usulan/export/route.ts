import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    const statusFilter = searchParams.get('status')

    // Get user's unit kerja for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Build where clause
    const whereClause: any = {
      pegawai: {
        unitKerja: user.unitKerja
      }
    }

    // Add status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      const statusMap: Record<string, string[]> = {
        'menunggu_verifikasi': ['DRAFT', 'DIAJUKAN', 'MENUNGGU_VERIFIKASI_DINAS', 'MENUNGGU_VERIFIKASI_SEKOLAH'],
        'sedang_diproses': ['DIPROSES_OPERATOR', 'DISETUJUI_OPERATOR', 'DIPROSES_ADMIN'],
        'disetujui': ['SELESAI'],
        'ditolak': ['DITOLAK'],
        'butuh_perbaikan': ['DIKEMBALIKAN_OPERATOR', 'DIKEMBALIKAN_ADMIN', 'PERLU_PERBAIKAN_DARI_DINAS', 'PERLU_PERBAIKAN_DARI_SEKOLAH']
      }
      
      const apiStatuses = statusMap[statusFilter]
      if (apiStatuses) {
        whereClause.status = { in: apiStatuses }
      }
    }

    // Get usulan data
    const usulan = await prisma.promotionProposal.findMany({
      where: whereClause,
      include: {
        pegawai: {
          select: {
            id: true,
            name: true,
            nip: true,
            jabatan: true,
            golongan: true
          }
        },
        documents: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format data for export
    const exportData = usulan.map(u => {
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

      // Map status
      const mapStatus = (status: string) => {
        const statusMap: Record<string, string> = {
          'DRAFT': 'Menunggu Verifikasi',
          'DIAJUKAN': 'Menunggu Verifikasi',
          'DIPROSES_OPERATOR': 'Sedang Diproses',
          'DISETUJUI_OPERATOR': 'Sedang Diproses',
          'DIPROSES_ADMIN': 'Sedang Diproses',
          'SELESAI': 'Disetujui',
          'DITOLAK': 'Ditolak',
          'DIKEMBALIKAN_OPERATOR': 'Butuh Perbaikan',
          'DIKEMBALIKAN_ADMIN': 'Butuh Perbaikan',
          'MENUNGGU_VERIFIKASI_DINAS': 'Menunggu Verifikasi',
          'MENUNGGU_VERIFIKASI_SEKOLAH': 'Menunggu Verifikasi',
          'PERLU_PERBAIKAN_DARI_DINAS': 'Butuh Perbaikan',
          'PERLU_PERBAIKAN_DARI_SEKOLAH': 'Butuh Perbaikan'
        }
        return statusMap[status] || 'Menunggu Verifikasi'
      }

      return {
        'No': '',
        'NIP': u.pegawai.nip || '',
        'Nama': u.pegawai.name || '',
        'Jabatan': u.pegawai.jabatan || '',
        'Unit Kerja': user.unitKerja,
        'Golongan Asal': currentGolongan,
        'Golongan Tujuan': golonganTujuan,
        'Periode': u.periode,
        'Tanggal Ajukan': u.createdAt.toLocaleDateString('id-ID'),
        'Status': mapStatus(u.status),
        'Keterangan': u.notes || '',
        'Dokumen Lengkap': u.documents.length > 0 && u.documents.filter(d => d.status === 'DISETUJUI').length === u.documents.length ? 'Ya' : 'Tidak'
      }
    })

    // Add row numbers
    exportData.forEach((item, index) => {
      item['No'] = (index + 1).toString()
    })

    if (format === 'excel') {
      return await generateExcel(exportData, user.unitKerja)
    } else if (format === 'pdf') {
      return await generatePDF(exportData, user.unitKerja)
    } else {
      return NextResponse.json({ message: 'Format not supported' }, { status: 400 })
    }

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateExcel(data: any[], unitKerja: string) {
  try {
    // Simple Excel generation using CSV format with proper headers
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          // Escape commas and quotes
          return `"${value.toString().replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8' 
    })

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="usulan-kenaikan-pangkat-${unitKerja}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Excel generation error:', error)
    throw error
  }
}

async function generatePDF(data: any[], unitKerja: string) {
  try {
    // Simple PDF generation using HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Laporan Usulan Kenaikan Pangkat</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; }
          .header p { margin: 5px 0; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Usulan Kenaikan Pangkat</h1>
          <p><strong>Unit Kerja:</strong> ${unitKerja}</p>
          <p><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
          <p><strong>Total Data:</strong> ${data.length} usulan</p>
        </div>
        
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })

    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="usulan-kenaikan-pangkat-${unitKerja}-${new Date().toISOString().split('T')[0]}.html"`
      }
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    throw error
  }
}
