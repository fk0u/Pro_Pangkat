import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateUserWilayahRelations() {
  console.log('🔄 Memperbarui relasi User dengan WilayahMaster...')

  try {
    // Mapping enum wilayah ke wilayahId
    const enumToWilayahId: Record<string, string> = {
      'BALIKPAPAN_PPU': 'wilayah_balikpapan_ppu',
      'KUTIM_BONTANG': 'wilayah_kutim_bontang',
      'KUKAR': 'wilayah_kukar',
      'KUBAR_MAHULU': 'wilayah_kubar_mahulu',
      'PASER': 'wilayah_paser',
      'BERAU': 'wilayah_berau',
      'SAMARINDA': 'wilayah_samarinda'
    }

    console.log('📋 Mendapatkan daftar user yang perlu diperbarui...')
    
    // Get all users with enum wilayah but no wilayahId
    const usersToUpdate = await prisma.user.findMany({
      where: {
        wilayah: { not: null },
        wilayahId: null
      },
      select: {
        id: true,
        name: true,
        role: true,
        wilayah: true
      }
    })

    console.log(`📊 Ditemukan ${usersToUpdate.length} user yang perlu diperbarui`)

    if (usersToUpdate.length === 0) {
      console.log('✅ Semua user sudah memiliki relasi WilayahMaster yang benar')
      return
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const user of usersToUpdate) {
      try {
        const wilayahId = enumToWilayahId[user.wilayah as string]
        
        if (!wilayahId) {
          errors.push(`User ${user.name} (${user.id}): Wilayah enum "${user.wilayah}" tidak ditemukan mapping-nya`)
          errorCount++
          continue
        }

        // Update user dengan wilayahId
        await prisma.user.update({
          where: { id: user.id },
          data: { wilayahId: wilayahId }
        })

        console.log(`   ✅ ${user.name} (${user.role}): ${user.wilayah} -> ${wilayahId}`)
        successCount++

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`User ${user.name} (${user.id}): ${errorMessage}`)
        errorCount++
      }
    }

    console.log(`\n📈 Hasil Update User:`)
    console.log(`   ✅ Berhasil: ${successCount} user`)
    console.log(`   ❌ Gagal: ${errorCount} user`)

    if (errors.length > 0) {
      console.log(`\n❌ Error yang terjadi:`)
      errors.forEach(error => console.log(`   - ${error}`))
    }

    // Verifikasi hasil update
    console.log('\n🔍 Verifikasi hasil update...')
    const verificationUsers = await prisma.user.findMany({
      where: {
        wilayahId: { not: null }
      },
      include: {
        wilayahRelasi: {
          select: {
            kode: true,
            nama: true
          }
        }
      },
      take: 10
    })

    console.log('\n📋 Contoh user dengan relasi WilayahMaster (10 pertama):')
    verificationUsers.forEach(user => {
      console.log(`   ${user.name} (${user.role}): ${user.wilayah} -> ${user.wilayahRelasi?.nama || 'Tidak ada relasi'}`)
    })

    // Summary final
    const totalUsersWithRelation = await prisma.user.count({
      where: { wilayahId: { not: null } }
    })

    const totalUsersWithoutRelation = await prisma.user.count({
      where: { 
        wilayah: { not: null },
        wilayahId: null 
      }
    })

    console.log(`\n📊 Summary Final:`)
    console.log(`   👥 Total user dengan relasi WilayahMaster: ${totalUsersWithRelation}`)
    console.log(`   ⚠️  Total user tanpa relasi WilayahMaster: ${totalUsersWithoutRelation}`)

  } catch (error) {
    console.error('❌ Error saat update user wilayah relations:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Jalankan update
if (require.main === module) {
  updateUserWilayahRelations()
    .then(() => {
      console.log('✅ Update user wilayah relations selesai!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Update gagal:', error)
      process.exit(1)
    })
}

export default updateUserWilayahRelations
