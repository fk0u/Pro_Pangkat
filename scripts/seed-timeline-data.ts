import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding timeline data')

  const now = new Date()
  const currentYear = now.getFullYear()
  const nextYear = currentYear + 1

  // Helper function to convert date string to Date object
  function parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Create timeline data for various jabatan types
  const timelineData = [
    // Current active period for all jabatan types
    {
      id: 'timeline-all-current',
      title: 'Periode Kenaikan Pangkat Semester I 2025',
      description: 'Kenaikan pangkat periode April 2025 untuk semua jenis jabatan',
      jabatanType: 'all',
      startDate: parseDate(`${currentYear}-01-15`),
      endDate: parseDate(`${currentYear}-03-31`),
      isActive: true,
      priority: 3,
      notes: 'Periode kenaikan pangkat yang sedang berjalan untuk semua jenis jabatan'
    },
    // Fungsional - specific timeline
    {
      id: 'timeline-fungsional-perbaikan',
      title: 'Masa Perbaikan Dokumen Jabatan Fungsional',
      description: 'Periode perbaikan dokumen untuk jabatan fungsional',
      jabatanType: 'fungsional',
      startDate: parseDate(`${currentYear}-02-01`),
      endDate: parseDate(`${currentYear}-03-15`),
      isActive: true,
      priority: 2,
      notes: 'Khusus untuk perbaikan dokumen jabatan fungsional'
    },
    // Struktural - specific timeline
    {
      id: 'timeline-struktural-verifikasi',
      title: 'Verifikasi Berkas Jabatan Struktural',
      description: 'Periode verifikasi berkas untuk jabatan struktural',
      jabatanType: 'struktural',
      startDate: parseDate(`${currentYear}-01-25`),
      endDate: parseDate(`${currentYear}-03-10`),
      isActive: true,
      priority: 2,
      notes: 'Khusus untuk verifikasi berkas jabatan struktural'
    },
    // Pelaksana - specific timeline
    {
      id: 'timeline-pelaksana-verifikasi',
      title: 'Verifikasi Berkas Jabatan Pelaksana',
      description: 'Periode verifikasi berkas untuk jabatan pelaksana',
      jabatanType: 'pelaksana',
      startDate: parseDate(`${currentYear}-01-20`),
      endDate: parseDate(`${currentYear}-03-05`),
      isActive: true,
      priority: 2,
      notes: 'Khusus untuk verifikasi berkas jabatan pelaksana'
    },
    // Next period (coming soon)
    {
      id: 'timeline-all-next',
      title: 'Periode Kenaikan Pangkat Semester II 2025',
      description: 'Kenaikan pangkat periode Oktober 2025 untuk semua jenis jabatan',
      jabatanType: 'all',
      startDate: parseDate(`${currentYear}-07-15`),
      endDate: parseDate(`${currentYear}-09-30`),
      isActive: true,
      priority: 1,
      notes: 'Periode kenaikan pangkat semester II 2025'
    },
    // Specific periods for next kenaikan pangkat
    {
      id: 'timeline-fungsional-next',
      title: 'Pengajuan Kenaikan Pangkat Fungsional',
      description: 'Periode pengajuan untuk jabatan fungsional semester II 2025',
      jabatanType: 'fungsional',
      startDate: parseDate(`${currentYear}-07-15`),
      endDate: parseDate(`${currentYear}-08-15`),
      isActive: true,
      priority: 1,
      notes: 'Pengajuan awal untuk jabatan fungsional'
    },
    {
      id: 'timeline-struktural-next',
      title: 'Pengajuan Kenaikan Pangkat Struktural',
      description: 'Periode pengajuan untuk jabatan struktural semester II 2025',
      jabatanType: 'struktural',
      startDate: parseDate(`${currentYear}-07-15`),
      endDate: parseDate(`${currentYear}-08-20`),
      isActive: true,
      priority: 1,
      notes: 'Pengajuan awal untuk jabatan struktural'
    },
    {
      id: 'timeline-pelaksana-next',
      title: 'Pengajuan Kenaikan Pangkat Pelaksana',
      description: 'Periode pengajuan untuk jabatan pelaksana semester II 2025',
      jabatanType: 'pelaksana',
      startDate: parseDate(`${currentYear}-07-15`),
      endDate: parseDate(`${currentYear}-08-25`),
      isActive: true,
      priority: 1,
      notes: 'Pengajuan awal untuk jabatan pelaksana'
    },
    // Future period (next year)
    {
      id: 'timeline-all-future',
      title: 'Periode Kenaikan Pangkat Semester I 2026',
      description: 'Kenaikan pangkat periode April 2026 untuk semua jenis jabatan',
      jabatanType: 'all',
      startDate: parseDate(`${nextYear}-01-15`),
      endDate: parseDate(`${nextYear}-03-31`),
      isActive: false,
      priority: 1,
      notes: 'Periode kenaikan pangkat semester I 2026 (belum aktif)'
    }
  ]

  // Get all wilayah in the system
  const wilayahData = await prisma.wilayahMaster.findMany()
  
  // Add wilayah-specific timelines if we have wilayah data
  if (wilayahData && wilayahData.length > 0) {
    for (const wilayah of wilayahData) {
      // Add a specific timeline for this wilayah
      timelineData.push({
        id: `timeline-${wilayah.kode.toLowerCase()}-current`,
        title: `Jadwal Khusus ${wilayah.nama}`,
        description: `Periode khusus untuk wilayah ${wilayah.nama}`,
        jabatanType: 'all',
        startDate: parseDate(`${currentYear}-02-01`),
        endDate: parseDate(`${currentYear}-03-20`),
        isActive: true,
        priority: 2,
        notes: `Timeline khusus untuk wilayah ${wilayah.nama}`,
        wilayahId: wilayah.id
      })
    }
  }

  // Create or update timeline entries
  for (const timeline of timelineData) {
    const { id, ...timelineData } = timeline
    
    await prisma.timeline.upsert({
      where: { id },
      update: timelineData,
      create: {
        id,
        ...timelineData
      }
    })
    
    console.log(`Created/updated timeline: ${timeline.title}`)
  }

  console.log('Timeline data seeding completed')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
