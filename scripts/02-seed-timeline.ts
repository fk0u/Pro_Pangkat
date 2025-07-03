import { PrismaClient, Wilayah } from "@prisma/client"

const prisma = new PrismaClient()

async function seedTimeline() {
  console.log("🕒 Seeding Timeline data...")

  // Clear existing timeline data
  await prisma.timeline.deleteMany({})
  await prisma.detailedDocumentInfo.deleteMany({})

  // Seed Timeline data
  const timelines = await prisma.timeline.createMany({
    data: [
      {
        title: "Periode Kenaikan Pangkat Reguler",
        description: "Periode kenaikan pangkat reguler untuk semua jenis jabatan",
        jabatanType: "all",
        startDate: new Date("2025-08-01"),
        endDate: new Date("2025-08-31"),
        isActive: true,
        priority: 1,
        notes: "Periode resmi kenaikan pangkat tahun 2025",
      },
      {
        title: "Periode Khusus Jabatan Struktural",
        description: "Periode khusus untuk kenaikan pangkat jabatan struktural",
        jabatanType: "struktural",
        startDate: new Date("2025-07-15"),
        endDate: new Date("2025-07-30"),
        isActive: true,
        priority: 2,
        notes: "Periode prioritas untuk jabatan struktural",
      },
      {
        title: "Periode Fungsional Terampil",
        description: "Periode kenaikan pangkat untuk jabatan fungsional terampil",
        jabatanType: "fungsional",
        startDate: new Date("2025-08-15"),
        endDate: new Date("2025-09-15"),
        isActive: true,
        priority: 1,
        wilayah: Wilayah.SAMARINDA,
        notes: "Khusus wilayah Samarinda",
      },
      {
        title: "Periode Pelaksana Pemula",
        description: "Periode kenaikan pangkat untuk jabatan pelaksana",
        jabatanType: "pelaksana",
        startDate: new Date("2025-09-01"),
        endDate: new Date("2025-09-30"),
        isActive: false,
        priority: 1,
        notes: "Periode mendatang untuk pelaksana",
      },
    ],
  })

  console.log(`✅ Created ${timelines.count} timeline records`)

  // Get document requirements for detailed info
  const docReqs = await prisma.documentRequirement.findMany()

  if (docReqs.length > 0) {
    console.log("📄 Seeding Detailed Document Info...")

    const detailedInfos = [
      {
        documentReqId: docReqs[0].id,
        purpose: "Membuktikan pengangkatan pertama sebagai PNS dan sebagai dasar perhitungan masa kerja",
        obtainMethod: "Minta fotokopi dari bagian kepegawaian unit kerja asal, lalu legalisir",
        validityPeriod: "Permanen (tidak ada masa berlaku)",
        legalBasis: "UU No. 5 Tahun 2014 tentang ASN",
        templateUrl: "/templates/sk-pengangkatan.pdf",
        sampleUrl: "/samples/sk-pengangkatan-sample.pdf",
        requirements: JSON.stringify([
          "Fotokopi harus jelas dan terbaca",
          "Harus dilegalisir oleh pejabat yang berwenang",
          "Semua halaman harus lengkap"
        ]),
        fillTips: "Pastikan nomor SK, tanggal, dan nama sesuai dengan dokumen asli",
        commonMistakes: "Sering tidak dilegalisir atau fotokopi buram/tidak jelas",
      },
      {
        documentReqId: docReqs[1]?.id || docReqs[0].id,
        purpose: "Menunjukkan pangkat dan golongan terakhir yang dimiliki sebagai dasar kenaikan pangkat berikutnya",
        obtainMethod: "Ambil dari arsip pribadi atau minta fotokopi dari bagian kepegawaian",
        validityPeriod: "Sesuai dengan periode pangkat yang tertera",
        legalBasis: "PP No. 11 Tahun 2017 tentang Manajemen PNS",
        templateUrl: "/templates/sk-pangkat.pdf",
        sampleUrl: "/samples/sk-pangkat-sample.pdf",
        requirements: JSON.stringify([
          "SK pangkat yang paling terakhir/terbaru",
          "Fotokopi harus dilegalisir",
          "Tanggal TMT harus jelas terlihat"
        ]),
        fillTips: "Periksa kesesuaian pangkat dengan golongan dan TMT",
        commonMistakes: "Menggunakan SK pangkat yang bukan terakhir atau tidak dilegalisir",
      },
      {
        documentReqId: docReqs[2]?.id || docReqs[0].id,
        purpose: "Membuktikan kualifikasi pendidikan yang dimiliki untuk mendukung kenaikan pangkat",
        obtainMethod: "Fotokopi ijazah asli dari institusi pendidikan, lalu legalisir",
        validityPeriod: "Permanen",
        legalBasis: "Permendikbud terkait legalisasi ijazah",
        templateUrl: "/templates/ijazah-format.pdf",
        sampleUrl: "/samples/ijazah-sample.pdf",
        requirements: JSON.stringify([
          "Ijazah pendidikan formal terakhir",
          "Harus dilegalisir oleh institusi yang berwenang",
          "Transkrip nilai (jika diperlukan)"
        ]),
        fillTips: "Pastikan legalisasi masih berlaku dan cap/stempel jelas",
        commonMistakes: "Legalisir tidak sesuai ketentuan atau menggunakan ijazah yang tidak relevan",
      },
    ]

    for (const info of detailedInfos) {
      if (info.documentReqId) {
        await prisma.detailedDocumentInfo.create({
          data: info,
        })
      }
    }

    console.log(`✅ Created ${detailedInfos.length} detailed document info records`)
  }
}

async function main() {
  try {
    await seedTimeline()
    console.log("🎉 Timeline seeding completed!")
  } catch (error) {
    console.error("❌ Error seeding timeline:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
