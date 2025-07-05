import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding document requirements')

  // Create document requirements
  const documentRequirements = [
    {
      code: 'surat-pengantar-usulan',
      name: 'Surat Pengantar Usulan',
      description: 'Surat pengantar untuk pengajuan kenaikan pangkat',
      isRequired: true,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Sebagai dokumen resmi pengantar untuk mengajukan kenaikan pangkat',
        obtainMethod: 'Dibuat oleh unit kerja pegawai',
        validityPeriod: 'Untuk satu kali pengajuan',
        legalBasis: 'PP No. 17 Tahun 2020 tentang Perubahan atas PP No. 11 Tahun 2017',
        templateUrl: '/templates/contoh-surat-pengantar.pdf',
        requirements: JSON.stringify([
          'Menggunakan kop surat resmi unit kerja',
          'Ditandatangani oleh pejabat yang berwenang',
          'Mencantumkan data lengkap pegawai yang diusulkan'
        ]),
        fillTips: 'Pastikan format dan penomoran sesuai dengan ketentuan tata naskah dinas',
        commonMistakes: 'Tidak mencantumkan informasi lengkap atau tidak ditandatangani pejabat berwenang'
      }
    },
    {
      code: 'surat-bebas-hukuman',
      name: 'Surat Pernyataan Bebas Hukuman Disiplin',
      description: 'Surat pernyataan bahwa pegawai bebas dari hukuman disiplin',
      isRequired: true,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Membuktikan bahwa pegawai tidak sedang menjalani hukuman disiplin',
        obtainMethod: 'Dibuat oleh pegawai dan diketahui atasan langsung',
        validityPeriod: '6 bulan sejak tanggal penerbitan',
        legalBasis: 'PP No. 94 Tahun 2021 tentang Disiplin PNS',
        templateUrl: '/templates/surat-bebas-hukuman.docx',
        requirements: JSON.stringify([
          'Ditandatangani oleh pegawai di atas meterai',
          'Diketahui dan ditandatangani oleh atasan langsung',
          'Mencantumkan tanggal pembuatan'
        ]),
        fillTips: 'Gunakan materai Rp 10.000 dan pastikan cap/stempel unit kerja jelas',
        commonMistakes: 'Tidak menggunakan materai atau tidak diketahui atasan langsung'
      }
    },
    {
      code: 'surat-kebenaran-dokumen',
      name: 'Surat Pernyataan Kebenaran Dokumen Kelengkapan Usulan yang Diupload',
      description: 'Pernyataan bahwa semua dokumen yang diupload adalah benar dan valid',
      isRequired: true,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Memastikan pertanggungjawaban pegawai atas kebenaran dokumen yang diajukan',
        obtainMethod: 'Dibuat oleh pegawai yang bersangkutan',
        validityPeriod: 'Untuk satu kali pengajuan',
        legalBasis: 'PP No. 17 Tahun 2020 tentang Perubahan atas PP No. 11 Tahun 2017',
        templateUrl: '/templates/surat-kebenaran-dokumen.docx',
        requirements: JSON.stringify([
          'Ditandatangani oleh pegawai di atas meterai',
          'Mencantumkan daftar dokumen yang diajukan',
          'Menyertakan konsekuensi jika terdapat pemalsuan dokumen'
        ]),
        fillTips: 'Pastikan seluruh dokumen yang diupload tercantum dalam daftar',
        commonMistakes: 'Tidak menyertakan seluruh dokumen dalam daftar atau tidak bermeterai'
      }
    },
    {
      code: 'sk-kenaikan-pangkat-terakhir',
      name: 'SK Kenaikan Pangkat Terakhir',
      description: 'Surat Keputusan kenaikan pangkat yang terakhir diterima',
      isRequired: true,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Membuktikan pangkat/golongan terakhir yang dimiliki pegawai',
        obtainMethod: 'Diperoleh dari BKD/BKN pada kenaikan pangkat terakhir',
        validityPeriod: 'Hingga mendapatkan SK pangkat baru',
        legalBasis: 'PP No. 17 Tahun 2020 tentang Perubahan atas PP No. 11 Tahun 2017',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Pastikan terlihat dengan jelas nomor dan tanggal SK',
          'Sertakan semua halaman SK termasuk lampiran'
        ]),
        fillTips: 'Dapat ditarik langsung dari data SimASN jika tersedia',
        commonMistakes: 'Menggunakan SK yang tidak terbaru atau tidak dilegalisir'
      }
    },
    {
      code: 'penilaian-kinerja-1',
      name: 'Penilaian Kinerja Pegawai 1 (satu) tahun terakhir',
      description: 'Dokumen penilaian kinerja pegawai untuk 1 tahun terakhir',
      isRequired: true,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Menunjukkan kinerja pegawai selama 1 tahun terakhir',
        obtainMethod: 'Diperoleh dari sistem penilaian kinerja instansi',
        validityPeriod: '1 tahun',
        legalBasis: 'PP No. 30 Tahun 2019 tentang Penilaian Kinerja PNS',
        requirements: JSON.stringify([
          'Dokumen asli atau fotokopi yang dilegalisir',
          'Ditandatangani oleh atasan dan pegawai yang bersangkutan',
          'Mencantumkan periode penilaian dengan jelas'
        ]),
        fillTips: 'Dapat ditarik langsung dari data SimASN jika tersedia',
        commonMistakes: 'Periode penilaian tidak sesuai atau tidak ditandatangani'
      }
    },
    {
      code: 'penilaian-kinerja-2',
      name: 'Penilaian Kinerja Pegawai 2 (dua) tahun terakhir',
      description: 'Dokumen penilaian kinerja pegawai untuk 2 tahun terakhir',
      isRequired: true,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Menunjukkan kinerja pegawai selama 2 tahun terakhir',
        obtainMethod: 'Diperoleh dari sistem penilaian kinerja instansi',
        validityPeriod: '1 tahun',
        legalBasis: 'PP No. 30 Tahun 2019 tentang Penilaian Kinerja PNS',
        requirements: JSON.stringify([
          'Dokumen asli atau fotokopi yang dilegalisir',
          'Ditandatangani oleh atasan dan pegawai yang bersangkutan',
          'Mencantumkan periode penilaian dengan jelas'
        ]),
        fillTips: 'Dapat ditarik langsung dari data SimASN jika tersedia',
        commonMistakes: 'Periode penilaian tidak sesuai atau tidak ditandatangani'
      }
    },
    {
      code: 'sk-pns',
      name: 'SK PNS',
      description: 'SK Pengangkatan sebagai PNS (bagi yang baru pertama kali diusulkan kenaikan pangkat)',
      isRequired: false,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Membuktikan status pegawai sebagai PNS',
        obtainMethod: 'Diterbitkan oleh BKN saat pertama kali diangkat sebagai PNS',
        validityPeriod: 'Selamanya',
        legalBasis: 'PP No. 11 Tahun 2017 tentang Manajemen PNS',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Pastikan terlihat dengan jelas nomor dan tanggal SK',
          'Wajib bagi yang baru pertama kali mengajukan kenaikan pangkat'
        ]),
        fillTips: 'Dapat ditarik langsung dari data SimASN jika tersedia',
        commonMistakes: 'Dokumen tidak lengkap atau tidak dilegalisir'
      }
    },
    {
      code: 'sk-cpns',
      name: 'SK CPNS',
      description: 'SK Pengangkatan sebagai CPNS (bagi yang baru pertama kali diusulkan kenaikan pangkat)',
      isRequired: false,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Membuktikan status awal pengangkatan sebagai CPNS',
        obtainMethod: 'Diterbitkan oleh BKN saat pertama kali diangkat sebagai CPNS',
        validityPeriod: 'Selamanya',
        legalBasis: 'PP No. 11 Tahun 2017 tentang Manajemen PNS',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Pastikan terlihat dengan jelas nomor dan tanggal SK',
          'Wajib bagi yang baru pertama kali mengajukan kenaikan pangkat'
        ]),
        fillTips: 'Dapat ditarik langsung dari data SimASN jika tersedia',
        commonMistakes: 'Dokumen tidak lengkap atau tidak dilegalisir'
      }
    },
    {
      code: 'sk-jabatan-fungsional',
      name: 'SK Pengangkatan Jabatan Fungsional',
      description: 'SK Pengangkatan pertama kali dalam Jabatan fungsional berikut berita acara pelantikan/sumpah jabatan, atau SK Jabatan Fungsional sesuai SK Kenaikan Pangkat Terakhir',
      isRequired: false,
      hasSimASN: true,
      detailInfo: {
        purpose: 'Membuktikan status jabatan fungsional pegawai',
        obtainMethod: 'Diterbitkan oleh pejabat pembina kepegawaian',
        validityPeriod: 'Hingga ada perubahan jabatan',
        legalBasis: 'Permenpan No. 13 Tahun 2019 tentang Pengusulan, Penetapan, dan Pembinaan Jabatan Fungsional PNS',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Sertakan berita acara pelantikan/sumpah jabatan (bagi pengangkatan pertama)',
          'Bagi yang sudah pernah naik pangkat, gunakan SK Jabatan Fungsional sesuai SK Kenaikan Pangkat Terakhir'
        ]),
        fillTips: 'Pastikan informasi jabatan fungsional sesuai dengan data kepegawaian terkini',
        commonMistakes: 'Tidak menyertakan berita acara pelantikan atau menggunakan SK yang tidak sesuai'
      }
    },
    {
      code: 'sertifikat-uji-kompetensi-kenaikan-jenjang',
      name: 'Sertifikat Uji Kompetensi Kenaikan Jenjang',
      description: 'Sertifikat Uji Kompetensi untuk kenaikan jenjang jabatan fungsional',
      isRequired: false,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Membuktikan kompetensi pegawai untuk kenaikan jenjang jabatan fungsional',
        obtainMethod: 'Diperoleh dari lembaga sertifikasi yang ditunjuk',
        validityPeriod: 'Sesuai ketentuan masing-masing jabatan fungsional',
        legalBasis: 'Permenpan No. 13 Tahun 2019 tentang Pengusulan, Penetapan, dan Pembinaan Jabatan Fungsional PNS',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Wajib bagi kenaikan pangkat ke golongan ruang III/a, III/c, IV/a, dan IV/d',
          'Harus masih berlaku pada saat pengajuan'
        ]),
        fillTips: 'Pastikan sertifikat diterbitkan oleh lembaga yang diakui',
        commonMistakes: 'Menggunakan sertifikat yang sudah tidak berlaku atau bukan dari lembaga yang diakui'
      }
    },
    {
      code: 'sk-kenaikan-jabatan-fungsional',
      name: 'SK Kenaikan Jabatan Fungsional',
      description: 'SK Kenaikan Jabatan Fungsional untuk kenaikan pangkat tertentu',
      isRequired: false,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Membuktikan kenaikan jenjang jabatan fungsional',
        obtainMethod: 'Diterbitkan oleh pejabat pembina kepegawaian',
        validityPeriod: 'Hingga ada perubahan jabatan',
        legalBasis: 'Permenpan No. 13 Tahun 2019 tentang Pengusulan, Penetapan, dan Pembinaan Jabatan Fungsional PNS',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Wajib bagi kenaikan pangkat ke golongan ruang III/a, III/c, IV/a, dan IV/d',
          'Pastikan terlihat dengan jelas nomor dan tanggal SK'
        ]),
        fillTips: 'Pastikan informasi jabatan fungsional sesuai dengan data kepegawaian terkini',
        commonMistakes: 'Menggunakan SK yang tidak sesuai dengan kenaikan pangkat yang diajukan'
      }
    },
    {
      code: 'sk-jabatan-fungsional-alih-jenjang',
      name: 'SK Jabatan Fungsional Alih Jenjang',
      description: 'SK Jabatan Fungsional Alih Jenjang bagi PNS yang beralih jenjang dari Terampil ke Ahli',
      isRequired: false,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Membuktikan alih jenjang jabatan fungsional dari Terampil ke Ahli',
        obtainMethod: 'Diterbitkan oleh pejabat pembina kepegawaian',
        validityPeriod: 'Hingga ada perubahan jabatan',
        legalBasis: 'Permenpan No. 13 Tahun 2019 tentang Pengusulan, Penetapan, dan Pembinaan Jabatan Fungsional PNS',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Wajib bagi PNS yang beralih jenjang dari Terampil ke Ahli',
          'Pastikan terlihat dengan jelas nomor dan tanggal SK'
        ]),
        fillTips: 'Pastikan SK mencantumkan informasi lengkap tentang alih jenjang',
        commonMistakes: 'Menggunakan SK yang tidak secara spesifik menyebutkan alih jenjang dari Terampil ke Ahli'
      }
    },
    {
      code: 'pak-baru',
      name: 'Asli PAK Baru',
      description: 'Asli Penetapan Angka Kredit (PAK) baru yang merupakan kelanjutan dari PAK lama sampai dengan PAK terbaru',
      isRequired: true,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Membuktikan jumlah angka kredit terbaru yang dimiliki',
        obtainMethod: 'Diterbitkan oleh tim penilai angka kredit',
        validityPeriod: 'Hingga ada PAK baru',
        legalBasis: 'Permenpan No. 13 Tahun 2019 tentang Pengusulan, Penetapan, dan Pembinaan Jabatan Fungsional PNS',
        requirements: JSON.stringify([
          'Harus dokumen asli',
          'Ditandatangani oleh ketua tim penilai dan pejabat yang berwenang',
          'Mencantumkan rincian perolehan angka kredit'
        ]),
        fillTips: 'Pastikan PAK merupakan kelanjutan dari PAK sebelumnya dan mencakup periode yang relevan',
        commonMistakes: 'Menggunakan fotokopi atau tidak menyertakan rincian perolehan angka kredit'
      }
    },
    {
      code: 'fotocopy-pak-lama',
      name: 'Fotocopy Leges PAK Lama',
      description: 'Fotocopy Leges PAK lama dengan angka kredit sesuai pada SK Kenaikan Pangkat Terakhir',
      isRequired: true,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Membuktikan jumlah angka kredit pada kenaikan pangkat terakhir',
        obtainMethod: 'Fotokopi dari dokumen PAK yang sesuai dengan SK Kenaikan Pangkat Terakhir',
        validityPeriod: 'Selamanya',
        legalBasis: 'Permenpan No. 13 Tahun 2019 tentang Pengusulan, Penetapan, dan Pembinaan Jabatan Fungsional PNS',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir (leges) oleh pejabat yang berwenang',
          'Angka kredit harus sesuai dengan yang tercantum pada SK Kenaikan Pangkat Terakhir',
          'Pastikan terlihat dengan jelas nomor dan tanggal PAK'
        ]),
        fillTips: 'Pastikan legalisasi masih berlaku dan terlihat jelas',
        commonMistakes: 'Menggunakan PAK yang tidak sesuai dengan SK Kenaikan Pangkat Terakhir atau tidak dilegalisir'
      }
    },
    {
      code: 'sertifikat-uji-kompetensi-inpassing',
      name: 'Sertifikat Uji Kompetensi Inpassing',
      description: 'Sertifikasi Uji Kompetensi berikut Rekomendasi Pengangkatan dalam Jabatan Fungsional melalui Inpassing',
      isRequired: false,
      hasSimASN: false,
      detailInfo: {
        purpose: 'Membuktikan kompetensi pegawai yang diangkat melalui jalur inpassing',
        obtainMethod: 'Diperoleh dari lembaga sertifikasi yang ditunjuk',
        validityPeriod: 'Sesuai ketentuan masing-masing jabatan fungsional',
        legalBasis: 'Permenpan tentang Pengangkatan PNS dalam Jabatan Fungsional melalui Penyesuaian/Inpassing',
        requirements: JSON.stringify([
          'Fotokopi harus dilegalisir oleh pejabat yang berwenang',
          'Sertakan rekomendasi pengangkatan dalam jabatan fungsional',
          'Wajib bagi PNS yang pengangkatan fungsionalnya melalui inpassing dan baru pertama kali diusulkan kenaikan pangkat fungsional'
        ]),
        fillTips: 'Pastikan sertifikat diterbitkan oleh lembaga yang diakui',
        commonMistakes: 'Tidak menyertakan rekomendasi pengangkatan atau menggunakan sertifikat yang tidak valid'
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const baseData: Record<string, any> = {
        purpose: doc.detailInfo.purpose || null,
        obtainMethod: doc.detailInfo.obtainMethod || null,
        validityPeriod: doc.detailInfo.validityPeriod || null,
        legalBasis: doc.detailInfo.legalBasis || null,
        fillTips: doc.detailInfo.fillTips || null,
        commonMistakes: doc.detailInfo.commonMistakes || null,
      };
      
      // Tambahkan properti opsional
      if ('templateUrl' in doc.detailInfo && typeof doc.detailInfo.templateUrl === 'string') {
        baseData.templateUrl = doc.detailInfo.templateUrl;
      }
      
      if ('sampleUrl' in doc.detailInfo && typeof doc.detailInfo.sampleUrl === 'string') {
        baseData.sampleUrl = doc.detailInfo.sampleUrl;
      }
      
      // Handle requirements dengan JSON parsing yang tepat
      if ('requirements' in doc.detailInfo && doc.detailInfo.requirements) {
        if (typeof doc.detailInfo.requirements === 'string') {
          try {
            baseData.requirements = JSON.parse(doc.detailInfo.requirements);
          } catch (e) {
            console.error(`Failed to parse requirements JSON for ${doc.code}:`, e);
          }
        } else {
          baseData.requirements = doc.detailInfo.requirements;
        }
      }
      
      try {
        await prisma.detailedDocumentInfo.upsert({
          where: { documentReqId: requirement.id },
          update: baseData,
          create: {
            ...baseData,
            documentReqId: requirement.id
          }
        });
      } catch (error) {
        console.error(`Error upserting detail for ${doc.code}:`, error);
      }
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
