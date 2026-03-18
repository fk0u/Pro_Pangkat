import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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
        unitKerja: {
          select: {
            nama: true,
            jenjang: true,
          }
        },
        golongan: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    console.log('Available PEGAWAI users:')
    console.table(users.map((u) => ({
      id: u.id,
      nip: u.nip,
      name: u.name,
      email: u.email,
      role: u.role,
      golongan: u.golongan,
      unitKerja: u.unitKerja?.nama || '-',
      jenjang: u.unitKerja?.jenjang || '-',
    })))

    if (users.length === 0) {
      console.log('No PEGAWAI users found. Creating default user...')

      const defaultNip = '123456789012345678'
      const hashedPassword = await bcrypt.hash(defaultNip, 10)
      const defaultUnit = await prisma.unitKerja.findFirst()

      if (!defaultUnit) {
        throw new Error('Cannot create default user because UnitKerja table is empty')
      }
      
      const defaultUser = await prisma.user.create({
        data: {
          email: 'pegawai@test.com',
          nip: defaultNip,
          name: 'John Doe',
          password: hashedPassword,
          mustChangePassword: true,
          role: 'PEGAWAI',
          jabatan: 'Guru',
          golongan: 'III/a',
          wilayah: defaultUnit.wilayah,
          unitKerja: {
            connect: {
              id: defaultUnit.id,
            }
          }
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
