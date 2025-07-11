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
    const period = searchParams.get('period') || '2025'

    // Get user's unit kerja for filtering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { unitKerja: true, unitKerjaId: true, wilayah: true }
    })

    if (!user) {
      console.error('User not found:', session.user.id)
      return NextResponse.json({ message: 'User not found' }, { status: 400 })
    }
    
    // Handle both string and object unitKerja formats
    let unitKerjaId = user.unitKerjaId
    const unitKerjaNama = typeof user.unitKerja === 'string' ? user.unitKerja : 
                        typeof user.unitKerja === 'object' && user.unitKerja !== null ? 
                        (user.unitKerja as Record<string, any>).nama || null : null

    console.log('User unit kerja info:', { 
      unitKerjaId, 
      unitKerjaNama,
      unitKerjaType: typeof user.unitKerja,
      unitKerja: user.unitKerja 
    })

    // If we don't have a unitKerjaId but we have the object, extract the ID
    if (!unitKerjaId && typeof user.unitKerja === 'object' && user.unitKerja !== null && 'id' in user.unitKerja) {
      unitKerjaId = (user.unitKerja as Record<string, any>).id
    }

    if (!unitKerjaId && !unitKerjaNama) {
      console.error('Unit kerja information not found for user:', session.user.id)
      return NextResponse.json({ message: 'Unit kerja information not found' }, { status: 400 })
    }

    // Build date filter based on period
    const currentYear = parseInt(period) || new Date().getFullYear()
    
    const dateFilter = {
      gte: new Date(`${currentYear}-01-01`),
      lt: new Date(`${currentYear + 1}-01-01`)
    }

    // Build where clause for proposals - use unitKerjaId if available, otherwise use name
    const whereClause = {
      pegawai: unitKerjaId ? {
        unitKerjaId
      } : {
        unitKerja: {
          nama: unitKerjaNama
        }
      },
      createdAt: dateFilter,
      // Exclude withdrawn (DITARIK) proposals and DRAFT status (incomplete data)
      status: {
        not: {
          in: ['DITARIK', 'DRAFT']
        }
      }
    }

    console.log('Generating report with filters:', { 
      unitKerjaId, 
      unitKerjaNama, 
      year: currentYear,
      whereClause 
    })

    // Process to get data with proper error handling
    let totalPegawai = 0;
    let totalUsulan = 0;
    let usulanSelesai = 0;
    let usulanDitolak = 0;
    let usulanProses = 0;
    let usulanMenunggu = 0;
    let monthlyData: unknown[] = [];
    let statusDistribution: {status: string; _count: {status: number}}[] = [];
    let golonganDistribution: {golongan: string; _count: {golongan: number}}[] = [];
    
    try {
      // Get total pegawai
      totalPegawai = await prisma.user.count({
        where: {
          role: 'PEGAWAI',
          ...(unitKerjaId ? { unitKerjaId } : {})
        }
      }).catch(err => {
        console.error('Error counting pegawai:', err);
        return 0;
      });

      // Get total usulan
      totalUsulan = await prisma.promotionProposal.count({
        where: whereClause
      }).catch(err => {
        console.error('Error counting usulan:', err);
        return 0;
      });

      // Get usulan selesai
      usulanSelesai = await prisma.promotionProposal.count({
        where: {
          ...whereClause,
          status: 'SELESAI'
        }
      }).catch(err => {
        console.error('Error counting usulan selesai:', err);
        return 0;
      });

      // Get usulan ditolak
      usulanDitolak = await prisma.promotionProposal.count({
        where: {
          ...whereClause,
          status: {
            in: ['DITOLAK', 'DITOLAK_SEKOLAH', 'DITOLAK_DINAS', 'DITOLAK_ADMIN']
          }
        }
      }).catch(err => {
        console.error('Error counting usulan ditolak:', err);
        return 0;
      });

      // Get usulan sedang diproses
      usulanProses = await prisma.promotionProposal.count({
        where: {
          ...whereClause,
          status: {
            in: ['DIPROSES_OPERATOR', 'DIPROSES_ADMIN', 'DISETUJUI_OPERATOR', 'DISETUJUI_SEKOLAH']
          }
        }
      }).catch(err => {
        console.error('Error counting usulan diproses:', err);
        return 0;
      });

      // Get usulan menunggu
      usulanMenunggu = await prisma.promotionProposal.count({
        where: {
          ...whereClause,
          status: {
            in: ['MENUNGGU_VERIFIKASI_SEKOLAH', 'MENUNGGU_VERIFIKASI_DINAS', 'MENUNGGU_KONFIRMASI', 'SUBMITTED', 'PENDING']
          }
        }
      }).catch(err => {
        console.error('Error counting usulan menunggu:', err);
        return 0;
      });

      // Get monthly data
      try {
        monthlyData = await prisma.$queryRaw`
          SELECT 
            EXTRACT(MONTH FROM p."createdAt")::INTEGER as month,
            COUNT(p.id) as total_usulan,
            COUNT(CASE WHEN p.status = 'SELESAI' THEN 1 END) as disetujui,
            COUNT(CASE WHEN p.status IN ('DITOLAK', 'DITOLAK_SEKOLAH', 'DITOLAK_DINAS', 'DITOLAK_ADMIN') THEN 1 END) as ditolak,
            COUNT(CASE WHEN p.status IN ('MENUNGGU_VERIFIKASI_SEKOLAH', 'MENUNGGU_VERIFIKASI_DINAS', 'MENUNGGU_KONFIRMASI', 'SUBMITTED', 'PENDING') THEN 1 END) as pending
          FROM "PromotionProposal" p
          JOIN "User" u ON p."pegawaiId" = u.id
          WHERE p."createdAt" >= ${dateFilter.gte}::DATE
            AND p."createdAt" < ${dateFilter.lt}::DATE
            AND p.status != 'DITARIK'
            AND p.status != 'DRAFT'
          GROUP BY EXTRACT(MONTH FROM p."createdAt")
          ORDER BY month
        `;
      } catch (err) {
        console.error('Error fetching monthly data:', err);
        monthlyData = [];
      }

      // Get status distribution
      try {
        statusDistribution = await prisma.promotionProposal.groupBy({
          by: ['status'],
          where: whereClause,
          _count: {
            status: true
          }
        });
      } catch (err) {
        console.error('Error fetching status distribution:', err);
        statusDistribution = [];
      }

      // Get golongan distribution
      try {
        golonganDistribution = await prisma.user.groupBy({
          by: ['golongan'],
          where: {
            role: 'PEGAWAI',
            ...(unitKerjaId ? { unitKerjaId } : {}),
            golongan: {
              not: null
            }
          },
          _count: {
            golongan: true
          }
        });
      } catch (err) {
        console.error('Error fetching golongan distribution:', err);
        golonganDistribution = [];
      }

      const tingkatPenyelesaian = totalUsulan > 0 ? (usulanSelesai / totalUsulan) * 100 : 0

      // Process monthly data
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      
      // Ensure monthlyData is an array (handle empty results)
      const monthlyDataArray = Array.isArray(monthlyData) ? monthlyData : [];
      
      // Create a sample data for empty months to show a complete chart
      const processedMonthlyData = Array.from({ length: 12 }, (_, index) => {
        const monthNum = index + 1
        const monthData = monthlyDataArray.find((item: any) => {
          const month = typeof item.month === 'string' 
            ? parseInt(item.month) 
            : typeof item.month === 'number' 
              ? item.month 
              : null;
          return month === monthNum;
        });
        
        return {
          month: monthNames[index],
          usulan: monthData ? Number(monthData.total_usulan || 0) : 0,
          disetujui: monthData ? Number(monthData.disetujui || 0) : 0,
          ditolak: monthData ? Number(monthData.ditolak || 0) : 0,
          pending: monthData ? Number(monthData.pending || 0) : 0
        }
      });

      // Process status distribution
      const statusMap: Record<string, string> = {
        'SELESAI': 'Selesai',
        'DIPROSES_OPERATOR': 'Sedang Diproses',
        'DIPROSES_ADMIN': 'Sedang Diproses', 
        'MENUNGGU_VERIFIKASI_SEKOLAH': 'Menunggu Verifikasi',
        'MENUNGGU_VERIFIKASI_DINAS': 'Menunggu Verifikasi',
        'DITOLAK': 'Ditolak',
        'DITOLAK_SEKOLAH': 'Ditolak',
        'DITOLAK_DINAS': 'Ditolak',
        'DITOLAK_ADMIN': 'Ditolak',
        'DISETUJUI_OPERATOR': 'Sedang Diproses',
        'DISETUJUI_SEKOLAH': 'Sedang Diproses',
        'MENUNGGU_KONFIRMASI': 'Menunggu Verifikasi',
        'SUBMITTED': 'Menunggu Verifikasi',
        'PENDING': 'Menunggu Verifikasi',
        'DRAFT': 'Menunggu Verifikasi',
        'DITARIK': 'Ditarik'
      }

      // Ensure statusDistribution is an array
      const statusDistArray = Array.isArray(statusDistribution) ? statusDistribution : [];

      interface StatusDataItem {
        name: string
        value: number
        color: string
      }

      const processedStatusData: StatusDataItem[] = [];
      
      for (const item of statusDistArray) {
        const displayName = statusMap[item.status] || item.status;
        const existing = processedStatusData.find(a => a.name === displayName);
        
        if (existing) {
          existing.value += item._count.status;
        } else {
          const colors: Record<string, string> = {
            'Selesai': '#10B981',
            'Sedang Diproses': '#3B82F6',
            'Menunggu Verifikasi': '#F59E0B',
            'Ditolak': '#EF4444',
            'Ditarik': '#9CA3AF'
          };
          
          processedStatusData.push({
            name: displayName,
            value: item._count.status,
            color: colors[displayName] || '#6B7280'
          });
        }
      }

      // Add default status categories if none exist to show a complete chart
      const requiredStatuses = ['Selesai', 'Sedang Diproses', 'Menunggu Verifikasi', 'Ditolak'];
      for (const status of requiredStatuses) {
        if (!processedStatusData.find(item => item.name === status)) {
          const colors: Record<string, string> = {
            'Selesai': '#10B981',
            'Sedang Diproses': '#3B82F6', 
            'Menunggu Verifikasi': '#F59E0B',
            'Ditolak': '#EF4444',
            'Ditarik': '#9CA3AF'
          };
          
          processedStatusData.push({
            name: status,
            value: 0,
            color: colors[status]
          });
        }
      }

      // Process golongan distribution  
      const golonganDistArray = Array.isArray(golonganDistribution) ? golonganDistribution : [];
      
      const processedGolonganData = golonganDistArray.map(item => ({
        golongan: item.golongan || 'Tidak diketahui',
        jumlah: item._count.golongan
      })).sort((a, b) => a.golongan.localeCompare(b.golongan));

      const stats = {
        totalPegawai,
        totalUsulan,
        usulanSelesai,
        usulanProses,
        usulanMenunggu,
        usulanDitolak,
        tingkatPenyelesaian: Math.round(tingkatPenyelesaian * 10) / 10
      }

      console.log('Successfully processed all report data');
      
      return NextResponse.json({
        stats,
        monthlyData: processedMonthlyData,
        statusData: processedStatusData,
        golonganData: processedGolonganData,
        unitKerja: unitKerjaNama || 'Semua Unit Kerja',
        periode: period
      });
      
    } catch (error) {
      console.error('Laporan API error:', error);
      
      // Provide more detailed error information for debugging
      let errorMessage = 'Internal server error';
      let errorDetails = {};
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = {
          name: error.name,
          stack: error.stack
        };
      }

      // Return at least partial data if we got this far
      const stats = {
        totalPegawai,
        totalUsulan,
        usulanSelesai,
        usulanProses,
        usulanMenunggu,
        usulanDitolak,
        tingkatPenyelesaian: totalUsulan > 0 ? Math.round((usulanSelesai / totalUsulan) * 1000) / 10 : 0
      }
      
      // Generate empty monthly data as fallback
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const emptyMonthlyData = monthNames.map(month => ({
        month,
        usulan: 0,
        disetujui: 0,
        ditolak: 0,
        pending: 0
      }));
      
      // Generate empty status data as fallback
      const emptyStatusData = [
        { name: 'Menunggu Verifikasi', value: 0, color: '#F59E0B' },
        { name: 'Sedang Diproses', value: 0, color: '#3B82F6' },
        { name: 'Selesai', value: 0, color: '#10B981' },
        { name: 'Ditolak', value: 0, color: '#EF4444' }
      ];
      
      // Generate empty golongan data as fallback
      const emptyGolonganData = [
        { golongan: 'III/a', jumlah: 0 },
        { golongan: 'III/b', jumlah: 0 },
        { golongan: 'III/c', jumlah: 0 },
        { golongan: 'III/d', jumlah: 0 },
        { golongan: 'IV/a', jumlah: 0 }
      ];
      
      return NextResponse.json({
        stats,
        monthlyData: emptyMonthlyData,
        statusData: emptyStatusData,
        golonganData: emptyGolonganData,
        unitKerja: unitKerjaNama || 'Semua Unit Kerja',
        periode: period,
        partial: true,
        error: errorMessage,
        details: errorDetails
      });
    }
  } catch (error) {
    console.error('Laporan API error:', error);
    
    // Provide more detailed error information for debugging
    let errorMessage = 'Internal server error';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack
      };
    }
    
    return NextResponse.json(
      { 
        message: errorMessage, 
        details: errorDetails,
        error: error instanceof Error ? error.toString() : String(error)
      },
      { status: 500 }
    );
  }
}
