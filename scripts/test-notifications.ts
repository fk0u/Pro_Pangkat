import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestNotifications() {
  try {
    console.log('Creating test notifications...')

    // Create notification for pegawai role
    await prisma.notification.create({
      data: {
        title: "Usulan Perlu Kelengkapan",
        message: "Usulan kenaikan pangkat Anda memerlukan kelengkapan dokumen. Silakan lengkapi dokumen yang diperlukan.",
        userRole: "PEGAWAI",
        isRead: false
      }
    })

    // Create notification for operator-sekolah role
    await prisma.notification.create({
      data: {
        title: "Usulan Baru Dibuat",
        message: "Berhasil membuat usulan kenaikan pangkat untuk pegawai. Silakan pantau status verifikasi.",
        userRole: "OPERATOR_SEKOLAH",
        isRead: false
      }
    })

    // Create global notification
    await prisma.notification.create({
      data: {
        title: "Maintenance Sistem",
        message: "Sistem akan menjalani maintenance pada tanggal 30 Desember 2024 pukul 02:00 - 04:00 WIB.",
        isRead: false
      }
    })

    console.log('Test notifications created successfully!')

  } catch (error) {
    console.error('Error creating test notifications:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestNotifications()
