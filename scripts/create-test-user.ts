import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('password', salt)

    const user = await prisma.user.upsert({
      where: { nip: 'test123' },
      update: {
        password: hashedPassword,
        mustChangePassword: false
      },
      create: {
        nip: 'test123',
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'PEGAWAI',
        jabatan: 'Guru Test',
        golongan: 'III/a',
        unitKerja: 'SMA Test',
        wilayah: 'BALIKPAPAN_PPU',
        mustChangePassword: false
      }
    })

    console.log('Test user created/updated:')
    console.log('NIP: test123')
    console.log('Password: password')
    console.log('User ID:', user.id)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
