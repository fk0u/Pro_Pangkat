import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function showUsers() {
  try {
    console.log('Fetching all users...')
    
    const users = await prisma.user.findMany({
      where: { role: 'PEGAWAI' },
      select: {
        id: true,
        email: true,
        nip: true,
        name: true,
        role: true,
        unitKerja: true,
        golongan: true
      }
    })

    console.log('Available PEGAWAI users:')
    console.table(users)

    if (users.length === 0) {
      console.log('No PEGAWAI users found. Creating default user...')
      
      const defaultUser = await prisma.user.create({
        data: {
          email: 'pegawai@test.com',
          nip: '123456789',
          name: 'John Doe',
          role: 'PEGAWAI',
          jabatan: 'Guru',
          golongan: 'III/a',
          unitKerja: 'SMA Negeri 1',
          wilayah: 'BALIKPAPAN_PPU'
        }
      })
      
      console.log('Created default user:', defaultUser)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showUsers()
