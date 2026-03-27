import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Default system settings
  const defaultSettings = [
    // General settings
    { category: 'general', key: 'applicationName', value: 'Pro Pangkat', description: 'Nama aplikasi' },
    { category: 'general', key: 'applicationDescription', value: 'Sistem pengelolaan kenaikan pangkat terintegrasi', description: 'Deskripsi aplikasi' },
    { category: 'general', key: 'logoUrl', value: 'https://kaltimprov.go.id/images/logofavicon.png', description: 'URL logo aplikasi' },
    
    // Security settings
    { category: 'security', key: 'twoFactorAuth', value: 'false', description: 'Aktifkan autentikasi dua faktor' },
    { category: 'security', key: 'sessionDuration', value: '240', description: 'Durasi sesi dalam menit' },
    { category: 'security', key: 'passwordPolicy', value: 'medium', description: 'Kebijakan password (low, medium, high)' },
    
    // Notification settings
    { category: 'notification', key: 'emailNotifications', value: 'true', description: 'Aktifkan notifikasi email' },
    { category: 'notification', key: 'systemNotifications', value: 'true', description: 'Aktifkan notifikasi sistem' },
    { category: 'notification', key: 'whatsappNotifications', value: 'false', description: 'Aktifkan notifikasi WhatsApp' },
    { category: 'notification', key: 'smtpServer', value: 'smtp.example.com', description: 'Server SMTP untuk email' },
    { category: 'notification', key: 'smtpPort', value: '587', description: 'Port SMTP' },
    { category: 'notification', key: 'smtpUser', value: 'notifications@propangkat.id', description: 'Username SMTP' },
    { category: 'notification', key: 'smtpPassword', value: '', description: 'Password SMTP' },
    
    // Advanced settings
    { category: 'advanced', key: 'maintenanceMode', value: 'false', description: 'Mode pemeliharaan' },
    { category: 'advanced', key: 'debugMode', value: 'false', description: 'Mode debug' },
    { category: 'advanced', key: 'caching', value: 'true', description: 'Aktifkan caching' },
    
    // Backup settings
    { category: 'backup', key: 'autoBackup', value: 'true', description: 'Aktifkan backup otomatis' },
    { category: 'backup', key: 'backupSchedule', value: 'weekly', description: 'Jadwal backup (daily, weekly, monthly)' },
    { category: 'backup', key: 'backupLocation', value: '/var/backups/propangkat', description: 'Lokasi backup' },
  ]

  console.log('Starting to seed system settings...')

  // Upsert all settings
  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: {
        category_key: {
          category: setting.category,
          key: setting.key
        }
      },
      update: {},
      create: setting
    })
  }

  console.log('System settings seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
