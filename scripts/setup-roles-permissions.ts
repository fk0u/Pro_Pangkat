import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

/**
 * Seed script untuk membuat definisi roles dan permissions
 */
async function main() {
  console.log('Memulai setup roles dan permissions...')

  // 1. Membuat Permissions
  const permissionModules = [
    'users', 'proposals', 'documents', 'system', 'timeline', 'reports', 'unit_kerja'
  ]

  // Define base permissions
  const permissionsData = [
    // User Management
    { 
      name: 'Lihat Pengguna', 
      key: 'VIEW_USERS', 
      description: 'Dapat melihat daftar pengguna',
      module: 'users'
    },
    { 
      name: 'Kelola Pengguna', 
      key: 'MANAGE_USERS', 
      description: 'Dapat menambah, mengedit, dan menghapus pengguna',
      module: 'users'
    },
    { 
      name: 'Impor Data Pengguna', 
      key: 'IMPORT_USERS', 
      description: 'Dapat mengimpor data pengguna dari file',
      module: 'users'
    },
    
    // Proposal Management
    { 
      name: 'Buat Usulan', 
      key: 'CREATE_PROPOSALS', 
      description: 'Dapat membuat usulan kenaikan pangkat',
      module: 'proposals'
    },
    { 
      name: 'Lihat Usulan', 
      key: 'VIEW_PROPOSALS', 
      description: 'Dapat melihat usulan kenaikan pangkat',
      module: 'proposals'
    },
    { 
      name: 'Verifikasi Usulan', 
      key: 'VERIFY_PROPOSALS', 
      description: 'Dapat memverifikasi usulan kenaikan pangkat',
      module: 'proposals'
    },
    { 
      name: 'Kelola Semua Usulan', 
      key: 'MANAGE_ALL_PROPOSALS', 
      description: 'Dapat mengelola semua usulan di sistem',
      module: 'proposals'
    },
    
    // Document Management
    { 
      name: 'Kelola Persyaratan Dokumen', 
      key: 'MANAGE_DOCUMENT_REQUIREMENTS', 
      description: 'Dapat mengelola persyaratan dokumen',
      module: 'documents'
    },
    { 
      name: 'Unggah Dokumen', 
      key: 'UPLOAD_DOCUMENTS', 
      description: 'Dapat mengunggah dokumen usulan',
      module: 'documents'
    },
    { 
      name: 'Verifikasi Dokumen', 
      key: 'VERIFY_DOCUMENTS', 
      description: 'Dapat memverifikasi dokumen usulan',
      module: 'documents'
    },
    
    // System Management
    { 
      name: 'Kelola Pengaturan Sistem', 
      key: 'MANAGE_SYSTEM_SETTINGS', 
      description: 'Dapat mengubah pengaturan sistem',
      module: 'system'
    },
    { 
      name: 'Kelola Role dan Permission', 
      key: 'MANAGE_ROLES_PERMISSIONS', 
      description: 'Dapat mengelola role dan permission',
      module: 'system'
    },
    { 
      name: 'Lihat Log Aktivitas', 
      key: 'VIEW_ACTIVITY_LOGS', 
      description: 'Dapat melihat log aktivitas pengguna',
      module: 'system'
    },
    
    // Timeline Management
    { 
      name: 'Kelola Timeline', 
      key: 'MANAGE_TIMELINE', 
      description: 'Dapat mengelola timeline sistem',
      module: 'timeline'
    },
    { 
      name: 'Lihat Timeline', 
      key: 'VIEW_TIMELINE', 
      description: 'Dapat melihat timeline',
      module: 'timeline'
    },
    
    // Reports
    { 
      name: 'Lihat Laporan', 
      key: 'VIEW_REPORTS', 
      description: 'Dapat melihat laporan sistem',
      module: 'reports'
    },
    { 
      name: 'Export Laporan', 
      key: 'EXPORT_REPORTS', 
      description: 'Dapat mengekspor laporan',
      module: 'reports'
    },
    
    // Unit Kerja Management
    { 
      name: 'Kelola Unit Kerja', 
      key: 'MANAGE_UNIT_KERJA', 
      description: 'Dapat mengelola unit kerja',
      module: 'unit_kerja'
    },
    { 
      name: 'Lihat Unit Kerja', 
      key: 'VIEW_UNIT_KERJA', 
      description: 'Dapat melihat unit kerja',
      module: 'unit_kerja'
    },
  ]

  // Create all permissions
  console.log('Membuat permissions...')
  for (const permData of permissionsData) {
    await prisma.permission.upsert({
      where: { key: permData.key },
      update: {
        name: permData.name,
        description: permData.description,
        module: permData.module
      },
      create: {
        id: randomUUID(),
        name: permData.name,
        key: permData.key,
        description: permData.description,
        module: permData.module
      }
    })
  }
  
  // 2. Membuat Roles
  console.log('Membuat roles...')
  const rolesData = [
    {
      name: 'Super Admin',
      description: 'Memiliki akses penuh terhadap semua fitur sistem',
      color: 'bg-red-100 text-red-700',
      isSystem: true,
      rolePriority: 100,
    },
    {
      name: 'Admin',
      description: 'Mengelola sistem dan data pengguna',
      color: 'bg-blue-100 text-blue-700',
      isSystem: true,
      rolePriority: 90,
    },
    {
      name: 'Operator',
      description: 'Memproses dan memverifikasi usulan',
      color: 'bg-green-100 text-green-700',
      isSystem: true,
      rolePriority: 80,
    },
    {
      name: 'Operator Sekolah',
      description: 'Mengelola usulan di tingkat sekolah',
      color: 'bg-purple-100 text-purple-700',
      isSystem: true,
      rolePriority: 70,
    },
    {
      name: 'Operator Unit Kerja',
      description: 'Mengelola usulan di tingkat unit kerja',
      color: 'bg-yellow-100 text-yellow-700',
      isSystem: true,
      rolePriority: 60,
    },
    {
      name: 'Pegawai',
      description: 'Pengguna standar yang dapat membuat usulan',
      color: 'bg-gray-100 text-gray-700',
      isSystem: true,
      rolePriority: 10,
    },
  ]
  
  // Create roles
  for (const roleData of rolesData) {
    await prisma.roleDefinition.upsert({
      where: { name: roleData.name },
      update: {
        description: roleData.description,
        color: roleData.color,
        isSystem: roleData.isSystem,
        rolePriority: roleData.rolePriority,
      },
      create: {
        id: randomUUID(),
        name: roleData.name,
        description: roleData.description,
        color: roleData.color,
        isSystem: roleData.isSystem,
        rolePriority: roleData.rolePriority,
      }
    })
  }
  
  // 3. Assign Permissions to Roles
  console.log('Menetapkan permissions ke roles...')
  
  // Get all created permissions
  const permissions = await prisma.permission.findMany()
  
  // Get all created roles
  const roles = await prisma.roleDefinition.findMany()
  
  // Find roles by name
  const superAdmin = roles.find(r => r.name === 'Super Admin')
  const admin = roles.find(r => r.name === 'Admin')
  const operator = roles.find(r => r.name === 'Operator')
  const operatorSekolah = roles.find(r => r.name === 'Operator Sekolah')
  const operatorUnitKerja = roles.find(r => r.name === 'Operator Unit Kerja')
  const pegawai = roles.find(r => r.name === 'Pegawai')
  
  // Super Admin gets all permissions
  if (superAdmin) {
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdmin.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: superAdmin.id,
          permissionId: permission.id
        }
      })
    }
  }
  
  // Admin permissions
  if (admin) {
    const adminPermissions = [
      'VIEW_USERS', 'MANAGE_USERS', 'IMPORT_USERS',
      'VIEW_PROPOSALS', 'VERIFY_PROPOSALS', 'MANAGE_ALL_PROPOSALS',
      'MANAGE_DOCUMENT_REQUIREMENTS', 'VERIFY_DOCUMENTS',
      'MANAGE_SYSTEM_SETTINGS', 'VIEW_ACTIVITY_LOGS',
      'MANAGE_TIMELINE', 'VIEW_TIMELINE',
      'VIEW_REPORTS', 'EXPORT_REPORTS',
      'MANAGE_UNIT_KERJA', 'VIEW_UNIT_KERJA'
    ]
    
    for (const permKey of adminPermissions) {
      const permission = permissions.find(p => p.key === permKey)
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: admin.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: admin.id,
            permissionId: permission.id
          }
        })
      }
    }
  }
  
  // Operator permissions
  if (operator) {
    const operatorPermissions = [
      'VIEW_USERS',
      'VIEW_PROPOSALS', 'VERIFY_PROPOSALS',
      'VERIFY_DOCUMENTS',
      'VIEW_TIMELINE',
      'VIEW_REPORTS', 'EXPORT_REPORTS',
      'VIEW_UNIT_KERJA'
    ]
    
    for (const permKey of operatorPermissions) {
      const permission = permissions.find(p => p.key === permKey)
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: operator.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: operator.id,
            permissionId: permission.id
          }
        })
      }
    }
  }
  
  // Operator Sekolah permissions
  if (operatorSekolah) {
    const operatorSekolahPermissions = [
      'VIEW_USERS',
      'VIEW_PROPOSALS', 'VERIFY_PROPOSALS',
      'VERIFY_DOCUMENTS',
      'VIEW_TIMELINE',
      'VIEW_REPORTS'
    ]
    
    for (const permKey of operatorSekolahPermissions) {
      const permission = permissions.find(p => p.key === permKey)
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: operatorSekolah.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: operatorSekolah.id,
            permissionId: permission.id
          }
        })
      }
    }
  }
  
  // Operator Unit Kerja permissions
  if (operatorUnitKerja) {
    const operatorUnitKerjaPermissions = [
      'VIEW_USERS',
      'VIEW_PROPOSALS', 'VERIFY_PROPOSALS',
      'VERIFY_DOCUMENTS',
      'VIEW_TIMELINE',
      'VIEW_REPORTS'
    ]
    
    for (const permKey of operatorUnitKerjaPermissions) {
      const permission = permissions.find(p => p.key === permKey)
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: operatorUnitKerja.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: operatorUnitKerja.id,
            permissionId: permission.id
          }
        })
      }
    }
  }
  
  // Pegawai permissions
  if (pegawai) {
    const pegawaiPermissions = [
      'CREATE_PROPOSALS', 'VIEW_PROPOSALS',
      'UPLOAD_DOCUMENTS',
      'VIEW_TIMELINE'
    ]
    
    for (const permKey of pegawaiPermissions) {
      const permission = permissions.find(p => p.key === permKey)
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: pegawai.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: pegawai.id,
            permissionId: permission.id
          }
        })
      }
    }
  }
  
  // 4. Migrate existing users to the new role system
  console.log('Migrasi pengguna ke sistem role baru...')
  
  const users = await prisma.user.findMany()
  
  for (const user of users) {
    let roleToAssign
    
    switch (user.role) {
      case 'ADMIN':
        roleToAssign = admin
        break
      case 'OPERATOR':
        roleToAssign = operator
        break
      case 'OPERATOR_SEKOLAH':
        roleToAssign = operatorSekolah
        break
      case 'OPERATOR_UNIT_KERJA':
        roleToAssign = operatorUnitKerja
        break
      case 'PEGAWAI':
      default:
        roleToAssign = pegawai
        break
    }
    
    if (roleToAssign) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: roleToAssign.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: roleToAssign.id
        }
      })
    }
  }
  
  console.log('Setup roles dan permissions selesai!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
