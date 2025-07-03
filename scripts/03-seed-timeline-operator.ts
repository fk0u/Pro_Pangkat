import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seedTimelineOperator() {
  console.log("🌱 Seeding Timeline data for Operator Dinas Kota...")

  try {
    // Clear existing timeline data first
    await prisma.timeline.deleteMany({})
    console.log("✅ Cleared existing timeline data")

    // Timeline untuk periode saat ini (Agustus 2025)
    const currentTimelines = [
      // Timeline untuk semua jabatan
      {
        title: "Periode Pengusulan Kenaikan Pangkat Agustus 2025",
        description: "Periode pengusulan utama untuk kenaikan pangkat reguler",
        jabatanType: "all",
        startDate: new Date("2025-08-01"),
        endDate: new Date("2025-08-20"),
        isActive: true,
        priority: 3, // Mendesak
        wilayah: null, // Berlaku untuk semua wilayah
        notes: "Timeline utama untuk periode Agustus 2025. Semua dokumen harus sudah lengkap sebelum batas akhir.",
      },
      {
        title: "Masa Perbaikan Dokumen",
        description: "Waktu untuk memperbaiki dokumen yang dikembalikan operator",
        jabatanType: "all", 
        startDate: new Date("2025-08-21"),
        endDate: new Date("2025-08-31"),
        isActive: true,
        priority: 2, // Penting
        wilayah: null,
        notes: "Pegawai dapat memperbaiki dokumen yang dikembalikan selama periode ini.",
      },
      
      // Timeline khusus jabatan pelaksana
      {
        title: "Pengusulan Jabatan Pelaksana",
        description: "Timeline khusus untuk kenaikan pangkat jabatan pelaksana",
        jabatanType: "pelaksana",
        startDate: new Date("2025-08-01"),
        endDate: new Date("2025-08-15"),
        isActive: true,
        priority: 2,
        wilayah: null,
        notes: "Khusus untuk pegawai dengan jabatan pelaksana. Proses lebih cepat karena dokumen yang diperlukan lebih sedikit.",
      },
      
      // Timeline khusus jabatan struktural
      {
        title: "Pengusulan Jabatan Struktural",
        description: "Timeline khusus untuk kenaikan pangkat jabatan struktural",
        jabatanType: "struktural",
        startDate: new Date("2025-08-05"),
        endDate: new Date("2025-08-25"),
        isActive: true,
        priority: 3,
        wilayah: null,
        notes: "Jabatan struktural memerlukan proses verifikasi tambahan dan dokumen yang lebih lengkap.",
      },
      
      // Timeline khusus jabatan fungsional
      {
        title: "Pengusulan Jabatan Fungsional",
        description: "Timeline khusus untuk kenaikan pangkat jabatan fungsional",
        jabatanType: "fungsional",
        startDate: new Date("2025-08-03"),
        endDate: new Date("2025-08-23"),
        isActive: true,
        priority: 2,
        wilayah: null,
        notes: "Jabatan fungsional memerlukan verifikasi kompetensi khusus dan sertifikasi terkait.",
      },

      // Timeline untuk wilayah khusus (contoh: Samarinda)
      {
        title: "Timeline Khusus Samarinda - Percepatan Proses",
        description: "Timeline percepatan khusus untuk wilayah Samarinda",
        jabatanType: "all",
        startDate: new Date("2025-07-25"),
        endDate: new Date("2025-08-10"),
        isActive: true,
        priority: 3,
        wilayah: "SAMARINDA",
        notes: "Program percepatan khusus untuk Samarinda dalam rangka efisiensi birokrasi.",
      },

      // Timeline untuk wilayah khusus (contoh: Balikpapan PPU)
      {
        title: "Program Prioritas Balikpapan PPU",
        description: "Timeline prioritas untuk wilayah Balikpapan PPU",
        jabatanType: "all",
        startDate: new Date("2025-08-02"),
        endDate: new Date("2025-08-18"),
        isActive: true,
        priority: 2,
        wilayah: "BALIKPAPAN_PPU",
        notes: "Program prioritas dalam rangka percepatan pelayanan publik di Balikpapan PPU.",
      },
    ]

    // Insert timeline data
    const createdTimelines = await Promise.all(
      currentTimelines.map(timeline => 
        prisma.timeline.create({
          data: timeline
        })
      )
    )

    console.log(`✅ Created ${createdTimelines.length} timeline entries`)

    // Timeline untuk periode mendatang (September 2025)
    const futureTimelines = [
      {
        title: "Periode Pengusulan September 2025",
        description: "Periode pengusulan lanjutan untuk yang tidak masuk periode Agustus",
        jabatanType: "all",
        startDate: new Date("2025-09-01"),
        endDate: new Date("2025-09-20"),
        isActive: false, // Belum aktif
        priority: 2,
        wilayah: null,
        notes: "Periode cadangan untuk pegawai yang terlewat periode Agustus atau dokumen belum lengkap.",
      },
      {
        title: "Review Semester II 2025",
        description: "Review dan evaluasi hasil kenaikan pangkat semester kedua",
        jabatanType: "all",
        startDate: new Date("2025-09-25"),
        endDate: new Date("2025-09-30"),
        isActive: false,
        priority: 1,
        wilayah: null,
        notes: "Evaluasi dan review untuk persiapan periode berikutnya.",
      },
    ]

    const futureTimelineResults = await Promise.all(
      futureTimelines.map(timeline => 
        prisma.timeline.create({
          data: timeline
        })
      )
    )

    console.log(`✅ Created ${futureTimelineResults.length} future timeline entries`)

    // Statistik timeline
    const totalTimelines = await prisma.timeline.count()
    const activeTimelines = await prisma.timeline.count({
      where: { isActive: true }
    })

    console.log(`📊 Timeline Statistics:`)
    console.log(`   Total timelines: ${totalTimelines}`)
    console.log(`   Active timelines: ${activeTimelines}`)
    console.log(`   Future timelines: ${totalTimelines - activeTimelines}`)

    // Test query: Get timeline for specific operator
    const operatorTimelines = await prisma.timeline.findMany({
      where: {
        isActive: true,
        OR: [
          { wilayah: null }, // Semua wilayah
          { wilayah: "SAMARINDA" }, // Contoh wilayah operator
        ],
      },
      orderBy: [
        { priority: "desc" },
        { startDate: "asc" },
      ],
    })

    console.log(`🔍 Sample query for Samarinda operator: ${operatorTimelines.length} relevant timelines`)

  } catch (error) {
    console.error("❌ Error seeding timeline data:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedTimelineOperator()
    .then(() => {
      console.log("🎉 Timeline seeding completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Timeline seeding failed:", error)
      process.exit(1)
    })
}

export default seedTimelineOperator
