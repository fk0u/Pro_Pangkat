import { PrismaClient, Wilayah } from "@prisma/client"
import { hashPassword } from "@/lib/password"

const prisma = new PrismaClient()

async function createOperatorDinasKota() {
  console.log("🌱 Creating Operator Dinas Kota users...")

  try {
    // Create operator users for different wilayah
    const operatorUsers = [
      {
        nip: "199901012023011001",
        name: "Operator Dinas Pendidikan Samarinda",
        email: "operator.samarinda@dinas.pendidikan.id",
        password: await hashPassword("password123"),
        role: "OPERATOR",
        wilayah: "SAMARINDA",
        unitKerja: "Dinas Pendidikan Kota Samarinda",
        jabatan: "Operator Sistem",
        mustChangePassword: false,
      },
      {
        nip: "199902022023011002", 
        name: "Operator Dinas Pendidikan Balikpapan PPU",
        email: "operator.balikpapan@dinas.pendidikan.id",
        password: await hashPassword("password123"),
        role: "OPERATOR",
        wilayah: "BALIKPAPAN_PPU",
        unitKerja: "Dinas Pendidikan Balikpapan PPU",
        jabatan: "Operator Sistem",
        mustChangePassword: false,
      },
      {
        nip: "199903032023011003",
        name: "Operator Dinas Pendidikan Kutai Timur",
        email: "operator.kutim@dinas.pendidikan.id", 
        password: await hashPassword("password123"),
        role: "OPERATOR",
        wilayah: "KUTIM_BONTANG",
        unitKerja: "Dinas Pendidikan Kutai Timur",
        jabatan: "Operator Sistem",
        mustChangePassword: false,
      },
      {
        nip: "199904042023011004",
        name: "Operator Dinas Pendidikan Kukar",
        email: "operator.kukar@dinas.pendidikan.id",
        password: await hashPassword("password123"),
        role: "OPERATOR", 
        wilayah: "KUKAR",
        unitKerja: "Dinas Pendidikan Kutai Kartanegara",
        jabatan: "Operator Sistem",
        mustChangePassword: false,
      },
      {
        nip: "199905052023011005",
        name: "Operator Dinas Pendidikan Berau",
        email: "operator.berau@dinas.pendidikan.id",
        password: await hashPassword("password123"),
        role: "OPERATOR",
        wilayah: "BERAU",
        unitKerja: "Dinas Pendidikan Berau",
        jabatan: "Operator Sistem", 
        mustChangePassword: false,
      }
    ]

    // Check if users already exist
    for (const userData of operatorUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { nip: userData.nip }
      })

      if (existingUser) {
        console.log(`⚠️  User with NIP ${userData.nip} already exists, skipping...`)
        continue
      }

      const user = await prisma.user.create({
        data: userData
      })

      console.log(`✅ Created operator: ${user.name} (${user.nip}) - ${user.wilayah}`)
    }

    // Update existing pegawai users to have different wilayah
    const pegawaiUsers = await prisma.user.findMany({
      where: { role: "PEGAWAI" }
    })

    const wilayahOptions = ["SAMARINDA", "BALIKPAPAN_PPU", "KUTIM_BONTANG", "KUKAR", "BERAU"]
    
    for (let i = 0; i < pegawaiUsers.length; i++) {
      const pegawai = pegawaiUsers[i]
      const wilayah = wilayahOptions[i % wilayahOptions.length]
      
      await prisma.user.update({
        where: { id: pegawai.id },
        data: { 
          wilayah: wilayah as Wilayah,
          unitKerja: pegawai.unitKerja || `Unit Kerja ${wilayah}`
        }
      })
      
      console.log(`✅ Updated pegawai ${pegawai.name} wilayah to ${wilayah}`)
    }

    // Create sample activity logs for operators
    const operators = await prisma.user.findMany({
      where: { role: "OPERATOR" }
    })

    const sampleActivities = [
      "PROPOSAL_REVIEWED",
      "PROPOSAL_APPROVED", 
      "PROPOSAL_RETURNED",
      "DOCUMENT_VERIFIED",
      "TIMELINE_UPDATED",
      "NOTIFICATION_SENT"
    ]

    for (const operator of operators) {
      for (let i = 0; i < 5; i++) {
        const randomActivity = sampleActivities[Math.floor(Math.random() * sampleActivities.length)]
        const randomDate = new Date()
        randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30))

        await prisma.activityLog.create({
          data: {
            action: randomActivity,
            details: {
              description: `${randomActivity.replace(/_/g, ' ').toLowerCase()}`,
              timestamp: randomDate.toISOString(),
              operator: operator.name
            },
            userId: operator.id,
            createdAt: randomDate
          }
        })
      }
      console.log(`✅ Created activity logs for operator ${operator.name}`)
    }

    console.log("🎉 Operator Dinas Kota setup completed!")

  } catch (error) {
    console.error("❌ Error creating operator users:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  createOperatorDinasKota()
    .then(() => {
      console.log("🎉 Operator creation completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Operator creation failed:", error)
      process.exit(1)
    })
}

export default createOperatorDinasKota
