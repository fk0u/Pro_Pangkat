import { PrismaClient, Role, Wilayah } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Starting user cleanup and setup...')

  try {
    // 1. Hapus semua user kecuali OPERATOR dan ADMIN
    console.log('1. Cleaning up users...')
    
    // Hapus activity logs dulu untuk menghindari foreign key constraint
    await prisma.activityLog.deleteMany({
      where: {
        user: {
          role: {
            in: [Role.PEGAWAI, Role.OPERATOR_SEKOLAH, Role.OPERATOR_UNIT_KERJA]
          }
        }
      }
    })

    // Hapus notifications
    await prisma.notification.deleteMany({
      where: {
        user: {
          role: {
            in: [Role.PEGAWAI, Role.OPERATOR_SEKOLAH, Role.OPERATOR_UNIT_KERJA]
          }
        }
      }
    })

    // Hapus proposals yang dibuat oleh pegawai
    await prisma.proposalDocument.deleteMany({
      where: {
        proposal: {
          pegawai: {
            role: {
              in: [Role.PEGAWAI, Role.OPERATOR_SEKOLAH, Role.OPERATOR_UNIT_KERJA]
            }
          }
        }
      }
    })

    await prisma.promotionProposal.deleteMany({
      where: {
        pegawai: {
          role: {
            in: [Role.PEGAWAI, Role.OPERATOR_SEKOLAH, Role.OPERATOR_UNIT_KERJA]
          }
        }
      }
    })

    // Hapus user pegawai, operator sekolah, dan operator unit kerja
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          in: [Role.PEGAWAI, Role.OPERATOR_SEKOLAH, Role.OPERATOR_UNIT_KERJA]
        }
      }
    })

    console.log(`✅ Deleted ${deletedUsers.count} users (PEGAWAI, OPERATOR_SEKOLAH, OPERATOR_UNIT_KERJA)`)

    // 2. Update existing operators dengan wilayah yang benar
    console.log('2. Setting up operators with correct wilayah...')
    
    const operators = await prisma.user.findMany({
      where: { role: Role.OPERATOR }
    })

    // Pastikan setiap operator memiliki wilayah
    for (const operator of operators) {
      if (!operator.wilayah) {
        await prisma.user.update({
          where: { id: operator.id },
          data: { 
            wilayah: Wilayah.BALIKPAPAN_PPU // Default wilayah
          }
        })
        console.log(`✅ Updated operator ${operator.name} with default wilayah`)
      }
    }

    // 3. Buat sample unit kerja untuk setiap wilayah
    console.log('3. Creating sample unit kerja...')
    
    const wilayahUnitKerja = [
      // BALIKPAPAN_PPU
      { nama: 'SMAN 1 Balikpapan', npsn: '30401234', jenjang: 'SMA', wilayah: Wilayah.BALIKPAPAN_PPU, kecamatan: 'Balikpapan Selatan' },
      { nama: 'SMPN 5 Balikpapan', npsn: '20401567', jenjang: 'SMP', wilayah: Wilayah.BALIKPAPAN_PPU, kecamatan: 'Balikpapan Utara' },
      { nama: 'SDN 001 Penajam', npsn: '10401890', jenjang: 'SD', wilayah: Wilayah.BALIKPAPAN_PPU, kecamatan: 'Penajam' },
      { nama: 'Dinas Pendidikan Kota Balikpapan', npsn: '90401001', jenjang: 'UMUM', wilayah: Wilayah.BALIKPAPAN_PPU, kecamatan: 'Balikpapan Tengah' },
      
      // KUTIM_BONTANG
      { nama: 'SMAN 1 Sangatta', npsn: '30402234', jenjang: 'SMA', wilayah: Wilayah.KUTIM_BONTANG, kecamatan: 'Sangatta Utara' },
      { nama: 'SMPN 2 Bontang', npsn: '20402567', jenjang: 'SMP', wilayah: Wilayah.KUTIM_BONTANG, kecamatan: 'Bontang Selatan' },
      { nama: 'SDN 003 Sangatta', npsn: '10402890', jenjang: 'SD', wilayah: Wilayah.KUTIM_BONTANG, kecamatan: 'Sangatta Selatan' },
      { nama: 'Dinas Pendidikan Kutai Timur', npsn: '90402001', jenjang: 'UMUM', wilayah: Wilayah.KUTIM_BONTANG, kecamatan: 'Sangatta Utara' },
      
      // KUKAR
      { nama: 'SMAN 2 Tenggarong', npsn: '30403234', jenjang: 'SMA', wilayah: Wilayah.KUKAR, kecamatan: 'Tenggarong' },
      { nama: 'SMPN 1 Loa Janan', npsn: '20403567', jenjang: 'SMP', wilayah: Wilayah.KUKAR, kecamatan: 'Loa Janan' },
      { nama: 'SDN 002 Tenggarong', npsn: '10403890', jenjang: 'SD', wilayah: Wilayah.KUKAR, kecamatan: 'Tenggarong' },
      { nama: 'Dinas Pendidikan Kutai Kartanegara', npsn: '90403001', jenjang: 'UMUM', wilayah: Wilayah.KUKAR, kecamatan: 'Tenggarong' },
      
      // KUBAR_MAHULU
      { nama: 'SMAN 1 Sendawar', npsn: '30404234', jenjang: 'SMA', wilayah: Wilayah.KUBAR_MAHULU, kecamatan: 'Sendawar' },
      { nama: 'SMPN 1 Long Bagun', npsn: '20404567', jenjang: 'SMP', wilayah: Wilayah.KUBAR_MAHULU, kecamatan: 'Long Bagun' },
      { nama: 'SDN 001 Sendawar', npsn: '10404890', jenjang: 'SD', wilayah: Wilayah.KUBAR_MAHULU, kecamatan: 'Sendawar' },
      { nama: 'Dinas Pendidikan Kutai Barat', npsn: '90404001', jenjang: 'UMUM', wilayah: Wilayah.KUBAR_MAHULU, kecamatan: 'Sendawar' },
      
      // PASER
      { nama: 'SMAN 1 Tanah Grogot', npsn: '30405234', jenjang: 'SMA', wilayah: Wilayah.PASER, kecamatan: 'Tanah Grogot' },
      { nama: 'SMPN 2 Tanjung Harapan', npsn: '20405567', jenjang: 'SMP', wilayah: Wilayah.PASER, kecamatan: 'Tanjung Harapan' },
      { nama: 'SDN 001 Tanah Grogot', npsn: '10405890', jenjang: 'SD', wilayah: Wilayah.PASER, kecamatan: 'Tanah Grogot' },
      { nama: 'Dinas Pendidikan Paser', npsn: '90405001', jenjang: 'UMUM', wilayah: Wilayah.PASER, kecamatan: 'Tanah Grogot' },
      
      // BERAU
      { nama: 'SMAN 1 Tanjung Redeb', npsn: '30406234', jenjang: 'SMA', wilayah: Wilayah.BERAU, kecamatan: 'Tanjung Redeb' },
      { nama: 'SMPN 1 Gunung Tabur', npsn: '20406567', jenjang: 'SMP', wilayah: Wilayah.BERAU, kecamatan: 'Gunung Tabur' },
      { nama: 'SDN 002 Tanjung Redeb', npsn: '10406890', jenjang: 'SD', wilayah: Wilayah.BERAU, kecamatan: 'Tanjung Redeb' },
      { nama: 'Dinas Pendidikan Berau', npsn: '90406001', jenjang: 'UMUM', wilayah: Wilayah.BERAU, kecamatan: 'Tanjung Redeb' },
    ]

    // Hapus unit kerja existing
    await prisma.unitKerja.deleteMany({})

    for (const unitKerja of wilayahUnitKerja) {
      await prisma.unitKerja.create({
        data: {
          nama: unitKerja.nama,
          npsn: unitKerja.npsn,
          jenjang: unitKerja.jenjang,
          wilayah: unitKerja.wilayah,
          kecamatan: unitKerja.kecamatan,
          alamat: `Jalan Pendidikan No. 1, ${unitKerja.kecamatan}`,
          status: 'Aktif'
        }
      })
    }

    console.log(`✅ Created ${wilayahUnitKerja.length} unit kerja`)

    // 4. Buat operator unit kerja untuk setiap wilayah
    console.log('4. Creating operator unit kerja...')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const operatorUnitKerja = [
      { 
        nip: '199001011001', 
        name: 'Operator Unit Kerja Wilayah I', 
        email: 'operator.unitkerja.wilayah1@pendidikan.kaltim.go.id',
        wilayah: Wilayah.BALIKPAPAN_PPU
      },
      { 
        nip: '199002021002', 
        name: 'Operator Unit Kerja Wilayah II', 
        email: 'operator.unitkerja.wilayah2@pendidikan.kaltim.go.id',
        wilayah: Wilayah.KUTIM_BONTANG
      },
      { 
        nip: '199003031003', 
        name: 'Operator Unit Kerja Wilayah III', 
        email: 'operator.unitkerja.wilayah3@pendidikan.kaltim.go.id',
        wilayah: Wilayah.KUKAR
      },
      { 
        nip: '199004041004', 
        name: 'Operator Unit Kerja Wilayah IV', 
        email: 'operator.unitkerja.wilayah4@pendidikan.kaltim.go.id',
        wilayah: Wilayah.KUBAR_MAHULU
      },
      { 
        nip: '199005051005', 
        name: 'Operator Unit Kerja Wilayah V', 
        email: 'operator.unitkerja.wilayah5@pendidikan.kaltim.go.id',
        wilayah: Wilayah.PASER
      },
      { 
        nip: '199006061006', 
        name: 'Operator Unit Kerja Wilayah VI', 
        email: 'operator.unitkerja.wilayah6@pendidikan.kaltim.go.id',
        wilayah: Wilayah.BERAU
      },
    ]

    for (const op of operatorUnitKerja) {
      await prisma.user.create({
        data: {
          nip: op.nip,
          name: op.name,
          email: op.email,
          password: hashedPassword,
          role: Role.OPERATOR_UNIT_KERJA,
          wilayah: op.wilayah,
          mustChangePassword: true
        }
      })
    }

    console.log(`✅ Created ${operatorUnitKerja.length} operator unit kerja`)

    // 5. Summary
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    })

    const unitKerjaCount = await prisma.unitKerja.count()

    console.log('\n📊 Summary:')
    userCounts.forEach(count => {
      console.log(`- ${count.role}: ${count._count} users`)
    })
    console.log(`- Unit Kerja: ${unitKerjaCount} units`)

    console.log('\n🎉 Cleanup and setup completed successfully!')

  } catch (error) {
    console.error('❌ Error during cleanup and setup:', error)
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
