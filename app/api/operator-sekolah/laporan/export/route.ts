import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session.isLoggedIn || session.user?.role !== 'OPERATOR_SEKOLAH') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { period, format = 'excel' } = body

    // Get user's unit kerja
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true, name: true }
    })

    if (!user?.unitKerja) {
      return NextResponse.json({ message: 'Unit kerja not found' }, { status: 400 })
    }

    // Get promotion proposals data
    const usulan = await prisma.promotionProposal.findMany({
      where: {
        pegawai: {
          unitKerja: user.unitKerja
        },
        ...(period && period !== 'all' ? {
          createdAt: {
            gte: new Date(`${period}-01-01`),
            lt: new Date(`${parseInt(period) + 1}-01-01`)
          }
        } : {})
      },
      include: {
        pegawai: {
          select: {
            name: true,
            nip: true,
            jabatan: true,
            golongan: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get statistics for summary
    const stats = {
      total: usulan.length,
      pending: usulan.filter(u => u.status === 'PENDING').length,
      disetujui: usulan.filter(u => u.status === 'APPROVED').length,
      ditolak: usulan.filter(u => u.status === 'REJECTED').length,
      diproses: usulan.filter(u => u.status === 'PROCESSING').length
    }

    if (format === 'pdf') {
      // Create PDF-friendly HTML content
      const htmlContent = generatePDFContent(user.unitKerja, period, usulan, stats)
      
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="laporan-usulan-${user.unitKerja.replace(/\s+/g, '-')}-${period || 'semua'}.html"`
        }
      })
    } else {
      // Create Excel-like CSV content with better formatting
      const csvContent = generateExcelContent(user.unitKerja, period, usulan, stats)
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="laporan-usulan-${user.unitKerja.replace(/\s+/g, '-')}-${period || 'semua'}.csv"`
        }
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateExcelContent(unitKerja: string, period: string | undefined, usulan: any[], stats: any): string {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Header dengan informasi laporan
  let content = `LAPORAN USULAN KENAIKAN PANGKAT\n`
  content += `${unitKerja}\n`
  content += `Periode: ${period ? `Tahun ${period}` : 'Semua Data'}\n`
  content += `Tanggal Cetak: ${today}\n`
  content += `\n`
  
  // Ringkasan statistik
  content += `RINGKASAN DATA\n`
  content += `Total Usulan,${stats.total}\n`
  content += `Menunggu Persetujuan,${stats.pending}\n`
  content += `Sedang Diproses,${stats.diproses}\n`
  content += `Disetujui,${stats.disetujui}\n`
  content += `Ditolak,${stats.ditolak}\n`
  content += `\n`
  
  // Header tabel utama
  content += `DETAIL DATA USULAN\n`
  content += `No,Nama Pegawai,NIP,Jabatan,Golongan Saat Ini,Periode,Status,Tanggal Usulan,Catatan\n`
  
  // Data rows
  usulan.forEach((u, index) => {
    const row = [
      index + 1,
      `"${u.pegawai.name || '-'}"`,
      `"${u.pegawai.nip || '-'}"`,
      `"${u.pegawai.jabatan || '-'}"`,
      `"${u.pegawai.golongan || '-'}"`,
      `"${u.periode || '-'}"`,
      getStatusText(u.status),
      u.createdAt.toLocaleDateString('id-ID'),
      `"${(u.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]
    content += row.join(',') + '\n'
  })
  
  // Footer
  content += `\n`
  content += `Laporan ini dibuat secara otomatis oleh Sistem Propangkat\n`
  content += `Dicetak pada: ${today}\n`
  
  return content
}

function generatePDFContent(unitKerja: string, period: string | undefined, usulan: any[], stats: any): string {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Usulan Kenaikan Pangkat</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        
        .header h2 {
            color: #374151;
            margin: 5px 0;
            font-size: 18px;
            font-weight: normal;
        }
        
        .header p {
            margin: 5px 0;
            color: #6b7280;
        }
        
        .summary {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid #93c5fd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .summary h3 {
            color: #1e40af;
            margin-top: 0;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .summary-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .summary-item .label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        
        .summary-item .value {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
        }
        
        .data-section {
            margin-top: 30px;
        }
        
        .data-section h3 {
            color: #1e40af;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        th {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 15px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }
        
        td {
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
        }
        
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        tr:hover {
            background-color: #eff6ff;
        }
        
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            text-align: center;
        }
        
        .status.pending {
            background-color: #fef3c7;
            color: #92400e;
            border: 1px solid #fbbf24;
        }
        
        .status.approved {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #34d399;
        }
        
        .status.rejected {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #f87171;
        }
        
        .status.processing {
            background-color: #dbeafe;
            color: #1e40af;
            border: 1px solid #60a5fa;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        
        .no-print {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        
        .print-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .print-btn:hover {
            background: #2563eb;
        }
        
        @media (max-width: 768px) {
            table {
                font-size: 12px;
            }
            
            th, td {
                padding: 8px 6px;
            }
            
            .summary-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">🖨️ Cetak PDF</button>
    </div>
    
    <div class="header">
        <h1>LAPORAN USULAN KENAIKAN PANGKAT</h1>
        <h2>${unitKerja}</h2>
        <p><strong>Periode:</strong> ${period ? `Tahun ${period}` : 'Semua Data'}</p>
        <p><strong>Tanggal Cetak:</strong> ${today}</p>
    </div>
    
    <div class="summary">
        <h3>📊 Ringkasan Data</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">Total Usulan</div>
                <div class="value">${stats.total}</div>
            </div>
            <div class="summary-item">
                <div class="label">Menunggu Persetujuan</div>
                <div class="value">${stats.pending}</div>
            </div>
            <div class="summary-item">
                <div class="label">Sedang Diproses</div>
                <div class="value">${stats.diproses}</div>
            </div>
            <div class="summary-item">
                <div class="label">Disetujui</div>
                <div class="value">${stats.disetujui}</div>
            </div>
            <div class="summary-item">
                <div class="label">Ditolak</div>
                <div class="value">${stats.ditolak}</div>
            </div>
        </div>
    </div>
    
    <div class="data-section">
        <h3>📋 Detail Data Usulan</h3>
        <table>
            <thead>
                <tr>
                    <th style="width: 5%">No</th>
                    <th style="width: 20%">Nama Pegawai</th>
                    <th style="width: 15%">NIP</th>
                    <th style="width: 15%">Jabatan</th>
                    <th style="width: 10%">Golongan</th>
                    <th style="width: 10%">Periode</th>
                    <th style="width: 10%">Status</th>
                    <th style="width: 10%">Tanggal</th>
                    <th style="width: 5%">Catatan</th>
                </tr>
            </thead>
            <tbody>
                ${usulan.map((u, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${u.pegawai.name || '-'}</strong></td>
                        <td>${u.pegawai.nip || '-'}</td>
                        <td>${u.pegawai.jabatan || '-'}</td>
                        <td>${u.pegawai.golongan || '-'}</td>
                        <td>${u.periode || '-'}</td>
                        <td><span class="status ${u.status.toLowerCase()}">${getStatusText(u.status)}</span></td>
                        <td>${u.createdAt.toLocaleDateString('id-ID')}</td>
                        <td>${u.notes ? '📝' : '-'}</td>
                    </tr>
                `).join('')}
                ${usulan.length === 0 ? `
                    <tr>
                        <td colspan="9" style="text-align: center; padding: 30px; color: #6b7280;">
                            📭 Tidak ada data usulan untuk periode ini
                        </td>
                    </tr>
                ` : ''}
            </tbody>
        </table>
    </div>
    
    <div class="footer">
        <p>Laporan ini dibuat secara otomatis oleh <strong>Sistem Propangkat</strong></p>
        <p>Dicetak pada: ${today} | Total Data: ${stats.total} usulan</p>
    </div>

    <script>
        // Auto print when loaded from download
        if (window.location.search.includes('autoprint=true')) {
            setTimeout(() => window.print(), 1000);
        }
    </script>
</body>
</html>`
}

function getStatusText(status: string): string {
  switch (status) {
    case 'PENDING': return 'Menunggu'
    case 'PROCESSING': return 'Diproses'
    case 'APPROVED': return 'Disetujui'
    case 'REJECTED': return 'Ditolak'
    default: return status
  }
}
