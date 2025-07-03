import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const wilayahData = [
  {
    id: 'wilayah_balikpapan_ppu',
    kode: 'BALIKPAPAN_PPU',
    nama: 'Balikpapan & PPU',
    namaLengkap: 'Kota Balikpapan dan Kabupaten Penajam Paser Utara',
    ibukota: 'Balikpapan',
    koordinat: '-1.2379,116.8529',
    luasWilayah: 30325,
    jumlahKecamatan: 14,
    isActive: true
  },
  {
    id: 'wilayah_kutim_bontang',
    kode: 'KUTIM_BONTANG',
    nama: 'Kutai Timur & Bontang',
    namaLengkap: 'Kabupaten Kutai Timur dan Kota Bontang',
    ibukota: 'Sangatta',
    koordinat: '0.4037,117.4953',
    luasWilayah: 36450,
    jumlahKecamatan: 21,
    isActive: true
  },
  {
    id: 'wilayah_kukar',
    kode: 'KUKAR',
    nama: 'Kutai Kartanegara',
    namaLengkap: 'Kabupaten Kutai Kartanegara',
    ibukota: 'Tenggarong',
    koordinat: '-0.4174,117.3752',
    luasWilayah: 27263,
    jumlahKecamatan: 18,
    isActive: true
  },
  {
    id: 'wilayah_kubar_mahulu',
    kode: 'KUBAR_MAHULU',
    nama: 'Kutai Barat & Mahakam Ulu',
    namaLengkap: 'Kabupaten Kutai Barat dan Kabupaten Mahakam Ulu',
    ibukota: 'Sendawar',
    koordinat: '0.4836,115.7817',
    luasWilayah: 35825,
    jumlahKecamatan: 23,
    isActive: true
  },
  {
    id: 'wilayah_paser',
    kode: 'PASER',
    nama: 'Paser',
    namaLengkap: 'Kabupaten Paser',
    ibukota: 'Tanah Grogot',
    koordinat: '-1.8894,115.9993',
    luasWilayah: 11603,
    jumlahKecamatan: 10,
    isActive: true
  },
  {
    id: 'wilayah_berau',
    kode: 'BERAU',
    nama: 'Berau',
    namaLengkap: 'Kabupaten Berau',
    ibukota: 'Tanjung Redeb',
    koordinat: '2.0397,117.4653',
    luasWilayah: 21000,
    jumlahKecamatan: 13,
    isActive: true
  },
  {
    id: 'wilayah_samarinda',
    kode: 'SAMARINDA',
    nama: 'Samarinda',
    namaLengkap: 'Kota Samarinda',
    ibukota: 'Samarinda',
    koordinat: '-0.4950,117.1436',
    luasWilayah: 78225,
    jumlahKecamatan: 10,
    isActive: true
  }
]

async function seedWilayahMaster() {
  console.log('🌍 Mulai seeding wilayah master...')

  try {
    // Hapus data wilayah lama jika ada
    await prisma.wilayahMaster.deleteMany({})
    console.log('✅ Data wilayah master lama berhasil dihapus')

    // Insert data wilayah baru
    const result = await prisma.wilayahMaster.createMany({
      data: wilayahData,
      skipDuplicates: true
    })

    console.log(`✅ Berhasil menambahkan ${result.count} wilayah master`)
    
    // Tampilkan semua wilayah yang berhasil ditambahkan
    const allWilayah = await prisma.wilayahMaster.findMany({
      orderBy: { kode: 'asc' }
    })

    console.log('\n📊 Daftar Wilayah Master:')
    allWilayah.forEach((wilayah, index) => {
      console.log(`   ${index + 1}. ${wilayah.kode} - ${wilayah.nama}`)
      console.log(`      ${wilayah.namaLengkap}`)
      console.log(`      Ibukota: ${wilayah.ibukota}, Luas: ${wilayah.luasWilayah?.toLocaleString()} km²`)
    })

    console.log(`\n🎉 Total wilayah master dalam database: ${allWilayah.length}`)

    // Update relasi UnitKerja dengan WilayahMaster
    console.log('\n🔗 Memperbarui relasi UnitKerja dengan WilayahMaster...')
    
    const updates = [
      { enumWilayah: 'BALIKPAPAN_PPU', wilayahId: 'wilayah_balikpapan_ppu' },
      { enumWilayah: 'KUTIM_BONTANG', wilayahId: 'wilayah_kutim_bontang' },
      { enumWilayah: 'KUKAR', wilayahId: 'wilayah_kukar' },
      { enumWilayah: 'KUBAR_MAHULU', wilayahId: 'wilayah_kubar_mahulu' },
      { enumWilayah: 'PASER', wilayahId: 'wilayah_paser' },
      { enumWilayah: 'BERAU', wilayahId: 'wilayah_berau' },
      { enumWilayah: 'SAMARINDA', wilayahId: 'wilayah_samarinda' }
    ]

    for (const update of updates) {
      const updateResult = await prisma.unitKerja.updateMany({
        where: { wilayah: update.enumWilayah },
        data: { wilayahId: update.wilayahId }
      })
      console.log(`   ✅ ${update.enumWilayah}: ${updateResult.count} unit kerja diperbarui`)
    }

    // Verifikasi relasi
    const unitKerjaWithWilayah = await prisma.unitKerja.findMany({
      include: {
        wilayahRelasi: true
      },
      take: 5
    })

    console.log('\n🔍 Verifikasi relasi (5 contoh pertama):')
    unitKerjaWithWilayah.forEach(unit => {
      console.log(`   ${unit.nama} -> ${unit.wilayahRelasi?.nama || 'Tidak ada relasi'}`)
    })

  } catch (error) {
    console.error('❌ Error saat seeding wilayah master:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Jalankan seeding
if (require.main === module) {
  seedWilayahMaster()
    .then(() => {
      console.log('✅ Seeding wilayah master selesai!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seeding gagal:', error)
      process.exit(1)
    })
}

export default seedWilayahMaster
