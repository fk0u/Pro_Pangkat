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
    const { period } = body

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

    // Create PDF-friendly HTML content
    const htmlContent = generatePDFContent(user.unitKerja, period, usulan, stats)
    
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })
  } catch (error) {
    console.error('Export PDF error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
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
    <title>Laporan Usulan Kenaikan Pangkat - ${unitKerja}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.4;
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
            text-transform: uppercase;
        }
        
        .header h2 {
            color: #374151;
            margin: 10px 0;
            font-size: 18px;
            font-weight: normal;
        }
        
        .header .info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
            text-align: left;
        }
        
        .header .info > div {
            background: #f8fafc;
            padding: 10px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
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
            margin-bottom: 15px;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
            font-size: 18px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        
        .summary-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .summary-item .label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .summary-item .value {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
        }
        
        .summary-item.total .value { color: #059669; }
        .summary-item.pending .value { color: #d97706; }
        .summary-item.processing .value { color: #2563eb; }
        .summary-item.approved .value { color: #16a34a; }
        .summary-item.rejected .value { color: #dc2626; }
        
        .data-section {
            margin-top: 30px;
        }
        
        .data-section h3 {
            color: #1e40af;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 18px;
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
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
        }
        
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
            vertical-align: top;
        }
        
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            text-align: center;
            display: inline-block;
            min-width: 60px;
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
        
        .status.draft {
            background-color: #f3f4f6;
            color: #374151;
            border: 1px solid #9ca3af;
        }
        
        .footer {
            margin-top: 40px;
            padding: 20px;
            border-top: 2px solid #e5e7eb;
            background: #f8fafc;
            border-radius: 8px;
        }
        
        .footer-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .footer .signature {
            text-align: center;
        }
        
        .footer .info {
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
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .print-btn:hover {
            background: #2563eb;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #6b7280;
        }
        
        .empty-state .icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
            .summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .header .info {
                grid-template-columns: 1fr;
            }
            
            .footer-content {
                grid-template-columns: 1fr;
            }
            
            table {
                font-size: 10px;
            }
            
            th, td {
                padding: 6px 4px;
            }
        }
        
        @page {
            margin: 1cm;
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">
            🖨️ Cetak PDF
        </button>
    </div>
    
    <div class="header">
        <h1>Laporan Usulan Kenaikan Pangkat</h1>
        <h2>${unitKerja}</h2>
        <div class="info">
            <div>
                <strong>📅 Periode:</strong><br>
                ${period ? `Tahun ${period}` : 'Semua Data'}
            </div>
            <div>
                <strong>📄 Tanggal Cetak:</strong><br>
                ${today}
            </div>
        </div>
    </div>
    
    <div class="summary">
        <h3>📊 Ringkasan Data Usulan</h3>
        <div class="summary-grid">
            <div class="summary-item total">
                <div class="label">Total Usulan</div>
                <div class="value">${stats.total}</div>
            </div>
            <div class="summary-item pending">
                <div class="label">Menunggu</div>
                <div class="value">${stats.pending}</div>
            </div>
            <div class="summary-item processing">
                <div class="label">Diproses</div>
                <div class="value">${stats.diproses}</div>
            </div>
            <div class="summary-item approved">
                <div class="label">Disetujui</div>
                <div class="value">${stats.disetujui}</div>
            </div>
            <div class="summary-item rejected">
                <div class="label">Ditolak</div>
                <div class="value">${stats.ditolak}</div>
            </div>
        </div>
    </div>
    
    <div class="data-section">
        <h3>📋 Detail Data Usulan Kenaikan Pangkat</h3>
        
        ${usulan.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th style="width: 4%">No</th>
                    <th style="width: 22%">Nama Pegawai</th>
                    <th style="width: 15%">NIP</th>
                    <th style="width: 18%">Jabatan</th>
                    <th style="width: 10%">Golongan</th>
                    <th style="width: 12%">Periode</th>
                    <th style="width: 10%">Status</th>
                    <th style="width: 9%">Tanggal</th>
                </tr>
            </thead>
            <tbody>
                ${usulan.map((u, index) => `
                    <tr>
                        <td style="text-align: center;">${index + 1}</td>
                        <td><strong>${u.pegawai.name || '-'}</strong></td>
                        <td style="font-family: monospace;">${u.pegawai.nip || '-'}</td>
                        <td>${u.pegawai.jabatan || '-'}</td>
                        <td style="text-align: center;">${u.pegawai.golongan || '-'}</td>
                        <td>${u.periode || '-'}</td>
                        <td><span class="status ${u.status.toLowerCase()}">${getStatusText(u.status)}</span></td>
                        <td style="text-align: center;">${u.createdAt.toLocaleDateString('id-ID')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : `
        <div class="empty-state">
            <div class="icon">📭</div>
            <h4>Tidak ada data usulan</h4>
            <p>Belum ada data usulan kenaikan pangkat untuk periode yang dipilih.</p>
        </div>
        `}
    </div>
    
    <div class="footer">
        <div class="footer-content">
            <div class="info">
                <p><strong>Keterangan:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Laporan ini dibuat secara otomatis oleh Sistem Propangkat</li>
                    <li>Data yang ditampilkan adalah usulan kenaikan pangkat dari ${unitKerja}</li>
                    <li>Total ${stats.total} usulan tercatat dalam sistem</li>
                </ul>
            </div>
            <div class="signature">
                <p style="margin-bottom: 60px;">Operator Sekolah</p>
                <div style="border-top: 1px solid #374151; padding-top: 10px;">
                    <strong>${unitKerja}</strong>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Auto focus and setup
        window.onload = function() {
            // Auto print if requested
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('autoprint') === 'true') {
                setTimeout(() => {
                    window.print();
                }, 1000);
            }
        };
        
        // Print function
        function printReport() {
            window.print();
        }
        
        // Keyboard shortcut
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                printReport();
            }
        });
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
    case 'DRAFT': return 'Draft'
    default: return status
  }
}
