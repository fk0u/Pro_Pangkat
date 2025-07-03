import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding document requirements')

  // Create document requirements
  const documentRequirements = [
    {
      code: 'sk-pengangkatan-pertama',
      name: 'Fotokopi SK Pengangkatan Pertama',
      description: 'Surat Keputusan pengangkatan pertama kali sebagai PNS',
      isRequired: true,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Dokumen ini digunakan untuk membuktikan awal mula status kepegawaian',
        obtainMethod: 'Diambil dari BKD/BKN saat pertama kali diangkat sebagai PNS',
        validityPeriod: 'Selamanya',
        legalBasis: 'PP No. 11 Tahun 2017 tentang Manajemen PNS',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Pastikan terlihat dengan jelas nomor dan tanggal SK',
          'Sertakan semua halaman SK termasuk lampiran'
        ]),
        fillTips: 'Scan dengan resolusi minimal 300 DPI untuk kejelasan dokumen',
        commonMistakes: 'SK yang tidak lengkap atau tidak terbaca dengan jelas'
      }
    },
    {
      code: 'sk-pangkat-terakhir',
      name: 'Fotokopi SK Pangkat Terakhir',
      description: 'Surat Keputusan kenaikan pangkat yang terakhir',
      isRequired: true,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Dokumen ini digunakan untuk memverifikasi pangkat/golongan saat ini',
        obtainMethod: 'Diberikan oleh BKD/BKN saat kenaikan pangkat terakhir',
        validityPeriod: 'Hingga mendapatkan SK Pangkat baru',
        legalBasis: 'PP No. 17 Tahun 2020 tentang Perubahan atas PP No. 11 Tahun 2017',
        templateUrl: '/templates/contoh-sk-pangkat.pdf',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Pastikan terlihat dengan jelas nomor dan tanggal SK',
          'Sertakan semua halaman SK termasuk lampiran'
        ]),
        fillTips: 'Pastikan semua informasi terbaca dengan jelas terutama TMT dan Golongan/Pangkat',
        commonMistakes: 'Menggunakan SK lama atau tidak menyertakan lampiran'
      }
    },
    {
      code: 'ijazah-terakhir',
      name: 'Fotokopi Ijazah Pendidikan Terakhir',
      description: 'Ijazah pendidikan formal terakhir yang telah dilegalisir',
      isRequired: true,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Membuktikan tingkat pendidikan formal yang telah ditempuh',
        obtainMethod: 'Diperoleh dari institusi pendidikan tempat menempuh pendidikan',
        validityPeriod: 'Selamanya',
        legalBasis: 'Permenpan No. 13 Tahun 2019',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh institusi yang mengeluarkan',
          'Lampirkan juga transkrip nilai yang dilegalisir',
          'Bagi lulusan luar negeri, sertakan juga surat penyetaraan dari Kemendikbud'
        ]),
        fillTips: 'Scan dalam satu file dengan transkrip nilai',
        commonMistakes: 'Tidak menyertakan transkrip nilai atau ijazah tidak dilegalisir'
      }
    },
    {
      code: 'str-sip',
      name: 'Fotokopi STR/SIP (Jika Ada)',
      description: 'Surat Tanda Registrasi atau Surat Izin Praktik untuk profesi tertentu',
      isRequired: false,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Membuktikan kelayakan praktik untuk profesi tertentu',
        obtainMethod: 'Diperoleh dari organisasi profesi terkait',
        validityPeriod: '5 tahun sejak tanggal penerbitan (bervariasi)',
        legalBasis: 'UU No. 36 Tahun 2014 tentang Tenaga Kesehatan',
        requirements: JSON.stringify([
          'Pastikan STR/SIP masih berlaku',
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Lampirkan riwayat perpanjangan jika ada'
        ]),
        fillTips: 'Pastikan masa berlaku masih panjang',
        commonMistakes: 'Menggunakan STR/SIP yang sudah kadaluarsa'
      }
    },
    {
      code: 'dp3-skp',
      name: 'Daftar Penilaian Prestasi Kerja (DP3/SKP)',
      description: 'Penilaian prestasi kerja 2 tahun terakhir',
      isRequired: true,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Membuktikan prestasi kerja selama periode penilaian',
        obtainMethod: 'Diperoleh dari BKD/unit kepegawaian',
        validityPeriod: '1 tahun',
        legalBasis: 'PP No. 30 Tahun 2019 tentang Penilaian Kinerja PNS',
        templateUrl: '/templates/contoh-skp.pdf',
        sampleUrl: '/samples/skp-terisi.pdf',
        requirements: JSON.stringify([
          'Sertakan SKP 2 tahun terakhir',
          'Pastikan sudah ditandatangani oleh pejabat penilai dan atasan pejabat penilai',
          'Lampirkan rekap pencapaian target kinerja'
        ]),
        fillTips: 'Pastikan nilai prestasi kerja minimal baik (76)',
        commonMistakes: 'SKP tidak lengkap atau belum ditandatangani pejabat penilai'
      }
    },
    {
      code: 'sertifikat-diklat',
      name: 'Sertifikat Diklat/Pelatihan',
      description: 'Sertifikat pendidikan dan pelatihan yang relevan',
      isRequired: false,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Membuktikan telah mengikuti pendidikan dan pelatihan tertentu',
        obtainMethod: 'Diperoleh dari penyelenggara diklat/pelatihan',
        validityPeriod: 'Bervariasi tergantung jenis diklat',
        legalBasis: 'PP No. 11 Tahun 2017 tentang Manajemen PNS',
        requirements: JSON.stringify([
          'Sertifikat harus relevan dengan jabatan',
          'Fotokopi harus dilegalisir jika diperlukan',
          'Pastikan tanggal pelaksanaan masih dalam periode penilaian'
        ]),
        fillTips: 'Urutkan berdasarkan tanggal terbaru',
        commonMistakes: 'Menyertakan sertifikat yang tidak relevan dengan jabatan'
      }
    },
    {
      code: 'karpeg',
      name: 'Fotokopi Kartu Pegawai (Karpeg)',
      description: 'Kartu identitas pegawai negeri sipil',
      isRequired: true,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Membuktikan identitas sebagai PNS',
        obtainMethod: 'Diterbitkan oleh BKN',
        validityPeriod: 'Selamanya',
        legalBasis: 'PP No. 11 Tahun 2017 tentang Manajemen PNS',
        requirements: JSON.stringify([
          'Fotokopi harus jelas dan dapat terbaca',
          'Pastikan nomor Karpeg terlihat dengan jelas'
        ]),
        fillTips: 'Scan kedua sisi kartu',
        commonMistakes: 'Tidak menyertakan kedua sisi kartu'
      }
    },
    {
      code: 'sk-jabatan-terakhir',
      name: 'Fotokopi SK Jabatan Terakhir',
      description: 'Surat Keputusan pengangkatan dalam jabatan terakhir',
      isRequired: true,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Membuktikan jabatan yang sedang diduduki',
        obtainMethod: 'Diterbitkan oleh pejabat pembina kepegawaian',
        validityPeriod: 'Hingga ada perubahan jabatan',
        legalBasis: 'PP No. 11 Tahun 2017 tentang Manajemen PNS',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Pastikan terlihat dengan jelas nomor dan tanggal SK',
          'Sertakan semua halaman SK termasuk lampiran'
        ]),
        fillTips: 'Pastikan jabatan yang tercantum sesuai dengan data di sistem',
        commonMistakes: 'Menggunakan SK jabatan lama yang sudah tidak berlaku'
      }
    },
    {
      code: 'daftar-riwayat-hidup',
      name: 'Daftar Riwayat Hidup',
      description: 'Daftar riwayat hidup pegawai',
      isRequired: true,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Menyediakan informasi riwayat pendidikan dan pekerjaan secara lengkap',
        obtainMethod: 'Dibuat oleh pegawai yang bersangkutan',
        templateUrl: '/templates/format-daftar-riwayat-hidup.docx',
        sampleUrl: '/samples/contoh-daftar-riwayat-hidup.pdf',
        requirements: JSON.stringify([
          'Gunakan format yang telah ditentukan',
          'Sertakan foto terbaru',
          'Harus ditandatangani oleh pegawai yang bersangkutan',
          'Cantumkan tanggal pembuatan'
        ]),
        fillTips: 'Lengkapi semua informasi yang diminta sesuai template',
        commonMistakes: 'Informasi tidak lengkap atau tidak menggunakan format yang ditentukan'
      }
    },
    {
      code: 'pas-foto',
      name: 'Pas Foto Terbaru',
      description: 'Pas foto berwarna terbaru dengan latar belakang merah',
      isRequired: true,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Untuk keperluan administratif dan identifikasi',
        obtainMethod: 'Foto di studio foto profesional',
        validityPeriod: '6 bulan',
        requirements: JSON.stringify([
          'Ukuran 4x6 cm',
          'Latar belakang merah',
          'Menggunakan pakaian dinas formal',
          'Foto tidak boleh lebih dari 6 bulan'
        ]),
        fillTips: 'Upload dalam format JPG atau PNG dengan resolusi minimal 300 DPI',
        commonMistakes: 'Menggunakan foto lama atau tidak sesuai ketentuan'
      }
    },
    {
      code: 'surat-pengantar',
      name: 'Surat Pengantar dari Unit Kerja',
      description: 'Surat pengantar pengajuan kenaikan pangkat dari unit kerja',
      isRequired: true,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Sebagai pengantar resmi dari unit kerja',
        obtainMethod: 'Diterbitkan oleh unit kerja/instansi pegawai',
        templateUrl: '/templates/format-surat-pengantar.docx',
        requirements: JSON.stringify([
          'Ditandatangani oleh pimpinan unit kerja',
          'Mencantumkan daftar pegawai yang diusulkan',
          'Menggunakan kop surat resmi instansi',
          'Mencantumkan nomor surat dan tanggal'
        ]),
        fillTips: 'Pastikan telah ditandatangani dan dicap resmi',
        commonMistakes: 'Tidak mencantumkan daftar lengkap pegawai yang diusulkan'
      }
    },
    {
      code: 'surat-pernyataan-keabsahan',
      name: 'Surat Pernyataan Keabsahan Dokumen',
      description: 'Pernyataan tentang keabsahan dokumen yang dilampirkan',
      isRequired: true,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Memastikan pertanggungjawaban atas keabsahan dokumen yang diajukan',
        obtainMethod: 'Dibuat oleh pegawai yang bersangkutan',
        templateUrl: '/templates/format-surat-pernyataan-keabsahan.docx',
        sampleUrl: '/samples/contoh-surat-pernyataan-keabsahan.pdf',
        requirements: JSON.stringify([
          'Gunakan format yang telah ditentukan',
          'Harus ditandatangani di atas materai',
          'Cantumkan tanggal pembuatan'
        ]),
        fillTips: 'Pastikan semua dokumen yang dilampirkan tercantum dalam daftar',
        commonMistakes: 'Tidak ditandatangani di atas materai atau menggunakan format yang salah'
      }
    }
  ]

  for (const doc of documentRequirements) {
    // Create the document requirement
    const requirement = await prisma.documentRequirement.upsert({
      where: { code: doc.code },
      update: {
        name: doc.name,
        description: doc.description,
        isRequired: doc.isRequired,
        hasSimASN: doc.hasSimASN
      },
      create: {
        code: doc.code,
        name: doc.name,
        description: doc.description,
        isRequired: doc.isRequired,
        hasSimASN: doc.hasSimASN
      }
    })

    // Create detailed info if provided
    if (doc.detailInfo) {
      await prisma.detailedDocumentInfo.upsert({
        where: { documentReqId: requirement.id },
        update: {
          purpose: doc.detailInfo.purpose,
          obtainMethod: doc.detailInfo.obtainMethod,
          validityPeriod: doc.detailInfo.validityPeriod,
          legalBasis: doc.detailInfo.legalBasis,
          templateUrl: doc.detailInfo.templateUrl,
          sampleUrl: doc.detailInfo.sampleUrl,
          requirements: doc.detailInfo.requirements,
          fillTips: doc.detailInfo.fillTips,
          commonMistakes: doc.detailInfo.commonMistakes
        },
        create: {
          documentReqId: requirement.id,
          purpose: doc.detailInfo.purpose,
          obtainMethod: doc.detailInfo.obtainMethod,
          validityPeriod: doc.detailInfo.validityPeriod,
          legalBasis: doc.detailInfo.legalBasis,
          templateUrl: doc.detailInfo.templateUrl,
          sampleUrl: doc.detailInfo.sampleUrl,
          requirements: doc.detailInfo.requirements,
          fillTips: doc.detailInfo.fillTips,
          commonMistakes: doc.detailInfo.commonMistakes
        }
      })
    }

    console.log(`Created document requirement: ${doc.name}`)
  }

  console.log('Document requirements seeding completed')
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
