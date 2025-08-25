import { PrismaClient, Role, Wilayah } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Start seeding...")

  // Hash a default password (using NIP as password is a security risk, but following instructions)
  // In a real scenario, generate random passwords and send them securely.
  const salt = await bcrypt.genSalt(10)

  // 1. Create Admin User
  const adminNip = "000000000000000001"
  const adminPassword = await bcrypt.hash(adminNip, salt)
  await prisma.user.upsert({
    where: { nip: adminNip },
    update: {},
    create: {
      nip: adminNip,
      name: "Administrator",
      email: "admin@propangkat.dev",
      password: adminPassword,
      role: Role.ADMIN,
      mustChangePassword: true,
    },
  })
  console.log("Admin user created.")

  // 2. Create Operator Users
  const operators = [
    { name: "Operator 1", nip: "111111111111111111", wilayah: Wilayah.BALIKPAPAN_PPU },
    { name: "Operator 2", nip: "222222222222222222", wilayah: Wilayah.KUTIM_BONTANG },
    { name: "Operator 3", nip: "333333333333333333", wilayah: Wilayah.KUKAR },
    { name: "Operator 4", nip: "444444444444444444", wilayah: Wilayah.KUBAR_MAHULU },
    { name: "Operator 5", nip: "555555555555555555", wilayah: Wilayah.PASER },
    { name: "Operator 6", nip: "666666666666666666", wilayah: Wilayah.BERAU },
    { name: "Operator 7", nip: "777777777777777777", wilayah: Wilayah.SAMARINDA },
  ]

  for (const op of operators) {
    const hashedPassword = await bcrypt.hash(op.nip, salt)
    await prisma.user.upsert({
      where: { nip: op.nip },
      update: {},
      create: {
        nip: op.nip,
        name: op.name,
        email: `operator.${op.wilayah.toLowerCase()}@propangkat.dev`,
        password: hashedPassword,
        role: Role.OPERATOR,
        wilayah: op.wilayah,
        mustChangePassword: true,
      },
    })
  }
  console.log("7 Operator users created.")

  // 3. Create Operator Sekolah Users
  const operatorSekolah = [
    { name: "Operator SMA Negeri 1 Samarinda", nip: "801111111111111111", sekolah: "SMA Negeri 1 Samarinda", wilayah: Wilayah.SAMARINDA, jenjang: "SMA" },
    { name: "Operator SMA Negeri 2 Balikpapan", nip: "802222222222222222", sekolah: "SMA Negeri 2 Balikpapan", wilayah: Wilayah.BALIKPAPAN_PPU, jenjang: "SMA" },
    { name: "Operator SMK Negeri 1 Bontang", nip: "803333333333333333", sekolah: "SMK Negeri 1 Bontang", wilayah: Wilayah.KUTIM_BONTANG, jenjang: "SMK" },
    { name: "Operator SMA Negeri 1 Tenggarong", nip: "804444444444444444", sekolah: "SMA Negeri 1 Tenggarong", wilayah: Wilayah.KUKAR, jenjang: "SMA" },
    { name: "Operator SMK Negeri 1 Sendawar", nip: "805555555555555555", sekolah: "SMK Negeri 1 Sendawar", wilayah: Wilayah.KUBAR_MAHULU, jenjang: "SMK" },
    { name: "Operator SMA Negeri 1 Tanah Grogot", nip: "806666666666666666", sekolah: "SMA Negeri 1 Tanah Grogot", wilayah: Wilayah.PASER, jenjang: "SMA" },
    { name: "Operator SMK Negeri 1 Tanjung Redeb", nip: "807777777777777777", sekolah: "SMK Negeri 1 Tanjung Redeb", wilayah: Wilayah.BERAU, jenjang: "SMK" },
  ]

  // Create UnitKerja records first
  for (const opSekolah of operatorSekolah) {
    await prisma.unitKerja.upsert({
      where: { nama: opSekolah.sekolah },
      update: {},
      create: {
        nama: opSekolah.sekolah,
        jenjang: opSekolah.jenjang,
        wilayah: opSekolah.wilayah,
      },
    })
  }
  console.log("School UnitKerja records created.")

  // Now create the operator accounts with proper UnitKerja relations
  for (const opSekolah of operatorSekolah) {
    const hashedPassword = await bcrypt.hash(opSekolah.nip, salt)
    await prisma.user.upsert({
      where: { nip: opSekolah.nip },
      update: {},
      create: {
        nip: opSekolah.nip,
        name: opSekolah.name,
        email: `operator.sekolah.${opSekolah.wilayah.toLowerCase().replace('_', '.')}@propangkat.dev`,
        password: hashedPassword,
        role: Role.OPERATOR_SEKOLAH,
        wilayah: opSekolah.wilayah,
        mustChangePassword: true,
        unitKerja: {
          connect: {
            nama: opSekolah.sekolah
          }
        },
      },
    })
  }
  console.log("7 Operator Sekolah users created.")

  // 4. Create Sample Pegawai for each school
  const pegawaiSekolah = [
    {
      nip: "198501012010011001",
      name: "Dr. Ahmad Wijaya, S.Pd",
      email: "ahmad.wijaya@smanegeri1samarinda.sch.id",
      golongan: "III/c",
      tmtGolongan: new Date("2020-04-01"),
      jabatan: "Kepala Sekolah",
      jenisJabatan: "Struktural",
      wilayah: Wilayah.SAMARINDA,
      unitKerja: {
        connect: {
          nama: "SMA Negeri 1 Samarinda"
        }
      },
    },
    {
      nip: "198702152011012002",
      name: "Dr. Siti Aminah, S.Pd, M.Pd",
      email: "siti.aminah@smanegeri2balikpapan.sch.id",
      golongan: "IV/a",
      tmtGolongan: new Date("2021-04-01"),
      jabatan: "Guru Madya",
      jenisJabatan: "Guru",
      wilayah: Wilayah.BALIKPAPAN_PPU,
      unitKerja: {
        connect: {
          nama: "SMA Negeri 2 Balikpapan"
        }
      },
    },
    {
      nip: "199203152015031003",
      name: "Dra. Fatimah, M.Pd",
      email: "fatimah@smknegeri1bontang.sch.id",
      golongan: "IV/b",
      tmtGolongan: new Date("2022-04-01"),
      jabatan: "Wakil Kepala Sekolah",
      jenisJabatan: "Struktural",
      wilayah: Wilayah.KUTIM_BONTANG,
      unitKerja: {
        connect: {
          nama: "SMK Negeri 1 Bontang"
        }
      },
    },
    {
      nip: "198012102008012004",
      name: "Bambang Supriyanto, S.Pd",
      email: "bambang@smanegeri1tenggarong.sch.id",
      golongan: "III/d",
      tmtGolongan: new Date("2019-04-01"),
      jabatan: "Guru Muda",
      jenisJabatan: "Guru",
      wilayah: Wilayah.KUKAR,
      unitKerja: {
        connect: {
          nama: "SMA Negeri 1 Tenggarong"
        }
      },
    },
    {
      nip: "199505202020121005",
      name: "Muhammad Rizki, S.Kom",
      email: "rizki@smknegeri1sendawar.sch.id",
      golongan: "III/a",
      tmtGolongan: new Date("2020-12-01"),
      jabatan: "Operator Sekolah",
      jenisJabatan: "Fungsional",
      wilayah: Wilayah.KUBAR_MAHULU,
      unitKerja: {
        connect: {
          nama: "SMK Negeri 1 Sendawar"
        }
      },
    }
  ]

  for (const pegawai of pegawaiSekolah) {
    const hashedPassword = await bcrypt.hash(pegawai.nip, salt)
    await prisma.user.upsert({
      where: { nip: pegawai.nip },
      update: {},
      create: {
        ...pegawai,
        password: hashedPassword,
        role: Role.PEGAWAI,
        mustChangePassword: true,
      },
    })
  }
  console.log("5 Sample Pegawai users created for schools.")

  // 5. Create Document Requirements
  const documentRequirements = [
    {
      code: "surat-pengantar",
      name: "Surat Pengantar Usulan",
      description: "Surat pengantar dari Unit Kerja untuk usulan kenaikan pangkat",
      isRequired: true,
      hasSimASN: false,
    },
    {
      code: "surat-bebas-hukuman",
      name: "Surat Pernyataan Bebas Hukuman Disiplin",
      description: "Surat pernyataan bahwa pegawai bebas dari hukuman disiplin",
      isRequired: true,
      hasSimASN: false,
    },
    {
      code: "surat-kebenaran-dokumen",
      name: "Surat Pernyataan Kebenaran Dokumen",
      description: "Surat pernyataan kebenaran semua dokumen yang diupload",
      isRequired: true,
      hasSimASN: false,
    },
    {
      code: "sk-kenaikan-terakhir",
      name: "SK Kenaikan Pangkat Terakhir",
      description: "SK kenaikan pangkat yang terakhir diterima",
      isRequired: true,
      hasSimASN: true,
    },
    {
      code: "penilaian-kinerja-1",
      name: "Penilaian Kinerja Pegawai 1 (satu) tahun terakhir",
      description: "Penilaian kinerja pegawai untuk 1 tahun terakhir",
      isRequired: true,
      hasSimASN: true,
    },
    {
      code: "penilaian-kinerja-2",
      name: "Penilaian Kinerja Pegawai 2 (dua) tahun terakhir",
      description: "Penilaian kinerja pegawai untuk 2 tahun terakhir",
      isRequired: true,
      hasSimASN: true,
    },
    {
      code: "sk-pns",
      name: "SK PNS",
      description: "Bagi yang baru pertama kali diusulkan kenaikan pangkat",
      isRequired: true,
      hasSimASN: true,
    },
    {
      code: "sk-cpns",
      name: "SK CPNS",
      description: "Bagi yang baru pertama kali diusulkan kenaikan pangkat",
      isRequired: true,
      hasSimASN: true,
    },
    {
      code: "sk-jabatan-fungsional",
      name: "SK Pengangkatan pertama kali dalam Jabatan fungsional",
      description: "SK pengangkatan dalam jabatan fungsional beserta berita acara pelantikan",
      isRequired: true,
      hasSimASN: false,
    },
    {
      code: "sertifikat-uji-kompetensi",
      name: "Sertifikat Uji Kompetensi Kenaikan Jenjang",
      description: "Untuk kenaikan pangkat ke golongan ruang III/a, III/c, IV/a, dan IV/d",
      isRequired: true,
      hasSimASN: false,
    },
    {
      code: "sk-kenaikan-jabatan-fungsional",
      name: "SK Kenaikan Jabatan Fungsional",
      description: "Untuk kenaikan pangkat ke golongan ruang III/a, III/c, IV/a, dan IV/d",
      isRequired: true,
      hasSimASN: false,
    },
    {
      code: "sk-alih-jenjang",
      name: "SK Jabatan Fungsional Alih Jenjang",
      description: "Bagi PNS yang beralih jenjang dari Terampil ke Ahli",
      isRequired: true,
      hasSimASN: false,
    },
    {
      code: "pak-baru",
      name: "Asli PAK baru",
      description: "Penilaian Angka Kredit terbaru (kelanjutan dari PAK lama)",
      isRequired: true,
      hasSimASN: false,
    },
    {
      code: "fotocopy-leges-pak",
      name: "Fotocopy Leges PAK lama",
      description: "Angka kredit sesuai pada SK Kenaikan Pangkat Terakhir",
      isRequired: true,
      hasSimASN: false,
    },
    {
      code: "sertifikat-inpassing",
      name: "Sertifikasi Uji Kompetensi Inpassing",
      description: "Bagi PNS yang pengangkatan fungsionalnya melalui Inpassing",
      isRequired: true,
      hasSimASN: false,
    },
  ]

  for (const doc of documentRequirements) {
    await prisma.documentRequirement.upsert({
      where: { code: doc.code },
      update: { name: doc.name, description: doc.description, isRequired: doc.isRequired, hasSimASN: doc.hasSimASN },
      create: doc,
    })
  }
  console.log("Document requirements created.")

  // 5. Create Timeline Data
  const timelines = [
    {
      title: "Periode Kenaikan Pangkat Agustus 2025",
      description: "Periode kenaikan pangkat reguler untuk bulan Agustus 2025",
      jabatanType: "all",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2025-08-31"),
      isActive: true,
      priority: 1,
      wilayah: null,
      createdBy: "system",
      notes: "Periode reguler dengan semua jenis jabatan yang dapat mengajukan usulan kenaikan pangkat",
    },
    {
      title: "Periode Kenaikan Pangkat September 2025",
      description: "Periode kenaikan pangkat reguler untuk bulan September 2025",
      jabatanType: "all",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-09-30"),
      isActive: false,
      priority: 1,
      wilayah: null,
      createdBy: "system",
      notes: "Periode berikutnya, belum aktif",
    },
    {
      title: "Periode Khusus Jabatan Fungsional Oktober 2025",
      description: "Periode khusus untuk kenaikan pangkat jabatan fungsional",
      jabatanType: "fungsional",
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-10-31"),
      isActive: false,
      priority: 2,
      wilayah: null,
      createdBy: "system",
      notes: "Periode khusus hanya untuk jabatan fungsional",
    }
  ]

  for (const timeline of timelines) {
    const existing = await prisma.timeline.findFirst({
      where: { title: timeline.title }
    })
    if (!existing) {
      await prisma.timeline.create({
        data: timeline,
      })
    }
  }
  console.log("Timeline data created.")

  // 6. Create Detailed Document Information
  const detailedDocInfo = [
    {
      code: "surat-pengantar",
      purpose: "Sebagai dokumen resmi pengantar usulan kenaikan pangkat dari unit kerja",
      obtainMethod: "Meminta kepada atasan langsung atau bagian kepegawaian unit kerja",
      validityPeriod: "3 bulan sejak tanggal diterbitkan",
      legalBasis: "Peraturan Pemerintah Nomor 11 Tahun 2017",
      templateUrl: "/templates/surat-pengantar.docx",
      sampleUrl: "/samples/surat-pengantar-sample.pdf",
      requirements: ["Stempel unit kerja", "Tanda tangan atasan", "Nomor surat resmi"],
      fillTips: "Pastikan data pegawai sesuai dengan database kepegawaian",
      commonMistakes: "Salah penulisan NIP atau nama jabatan"
    },
    {
      code: "sk-kenaikan-terakhir",
      purpose: "Sebagai bukti kenaikan pangkat terakhir yang diterima pegawai",
      obtainMethod: "Download dari aplikasi SimASN atau minta ke bagian kepegawaian",
      validityPeriod: "Berlaku sepanjang masa",
      legalBasis: "PP 11 Tahun 2017 tentang Manajemen PNS",
      templateUrl: null,
      sampleUrl: "/samples/sk-pangkat-sample.pdf",
      requirements: ["Dokumen asli dari BKN", "Masih dapat dibaca dengan jelas"],
      fillTips: "Pastikan SK yang diupload adalah SK kenaikan pangkat terakhir",
      commonMistakes: "Upload SK yang bukan terakhir atau tidak jelas"
    },
    {
      code: "penilaian-kinerja-1",
      purpose: "Sebagai bukti penilaian kinerja pegawai dalam 1 tahun terakhir",
      obtainMethod: "Download dari aplikasi e-SKP atau minta atasan penilai",
      validityPeriod: "Sesuai periode penilaian yang tertera",
      legalBasis: "PerBKN Nomor 1 Tahun 2019 tentang SKP",
      templateUrl: "/templates/skp-template.xlsx",
      sampleUrl: "/samples/skp-sample.pdf",
      requirements: ["Ditandatangani atasan penilai", "Nilai minimal Baik", "Sesuai periode yang diminta"],
      fillTips: "Pastikan periode penilaian sesuai dengan ketentuan yang berlaku",
      commonMistakes: "Periode tidak sesuai atau tidak ada tanda tangan atasan"
    },
    {
      code: "sertifikat-uji-kompetensi",
      purpose: "Sebagai bukti lulus uji kompetensi untuk kenaikan jenjang tertentu",
      obtainMethod: "Mengikuti uji kompetensi yang diselenggarakan instansi berwenang",
      validityPeriod: "5 tahun sejak tanggal diterbitkan",
      legalBasis: "PerBKN Nomor 1 Tahun 2020 tentang Uji Kompetensi",
      templateUrl: null,
      sampleUrl: "/samples/sertifikat-ukom-sample.pdf",
      requirements: ["Sertifikat asli", "Masih dalam masa berlaku", "Sesuai jenjang yang diajukan"],
      fillTips: "Periksa masa berlaku sertifikat sebelum mengupload",
      commonMistakes: "Sertifikat sudah kadaluarsa atau tidak sesuai jenjang"
    },
    {
      code: "pak-baru",
      purpose: "Sebagai bukti penilaian angka kredit terbaru untuk jabatan fungsional",
      obtainMethod: "Mengajukan ke Tim Penilai Angka Kredit sesuai bidang",
      validityPeriod: "Sesuai periode yang ditetapkan dalam PAK",
      legalBasis: "PerBKN tentang Jabatan Fungsional masing-masing bidang",
      templateUrl: "/templates/pak-template.pdf",
      sampleUrl: "/samples/pak-sample.pdf",
      requirements: ["Ditandatangani Tim Penilai", "Stempel resmi", "Angka kredit mencukupi"],
      fillTips: "Pastikan angka kredit sudah mencukupi untuk kenaikan yang diminta",
      commonMistakes: "Angka kredit kurang atau tidak ada tanda tangan tim penilai"
    }
  ]

  // Get document requirements untuk membuat relasi
  const docRequirements = await prisma.documentRequirement.findMany({
    select: { id: true, code: true }
  })

  for (const info of detailedDocInfo) {
    const docReq = docRequirements.find((d: any) => d.code === info.code)
    if (docReq) {
      await prisma.detailedDocumentInfo.upsert({
        where: { documentReqId: docReq.id },
        update: {
          purpose: info.purpose,
          obtainMethod: info.obtainMethod,
          validityPeriod: info.validityPeriod,
          legalBasis: info.legalBasis,
          templateUrl: info.templateUrl,
          sampleUrl: info.sampleUrl,
          requirements: info.requirements,
          fillTips: info.fillTips,
          commonMistakes: info.commonMistakes,
        },
        create: {
          documentReqId: docReq.id,
          purpose: info.purpose,
          obtainMethod: info.obtainMethod,
          validityPeriod: info.validityPeriod,
          legalBasis: info.legalBasis,
          templateUrl: info.templateUrl,
          sampleUrl: info.sampleUrl,
          requirements: info.requirements,
          fillTips: info.fillTips,
          commonMistakes: info.commonMistakes,
        }
      })
    }
  }
  console.log("Detailed document information created.")

  console.log("Seeding finished.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
