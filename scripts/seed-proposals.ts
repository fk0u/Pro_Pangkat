import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedProposals() {
  try {
    console.log('Starting to seed proposal data...')

    // Check if there are existing users with role PEGAWAI
    const pegawaiUsers = await prisma.user.findMany({
      where: { role: 'PEGAWAI' },
      take: 5
    })

    if (pegawaiUsers.length === 0) {
      console.log('No PEGAWAI users found. Creating sample users...')
      
      // Create sample pegawai users
      const samplePegawai = await Promise.all([
        prisma.user.create({
          data: {
            email: 'pegawai1@example.com',
            nip: '198501012009121001',
            name: 'Ahmad Suryadi',
            role: 'PEGAWAI',
            jabatan: 'Guru Matematika',
            golongan: 'III/c',
            unitKerja: 'SMA Negeri 1 Balikpapan',
            wilayah: 'BALIKPAPAN_PPU'
          }
        }),
        prisma.user.create({
          data: {
            email: 'pegawai2@example.com',
            nip: '198703152010032002',
            name: 'Siti Nurhaliza',
            role: 'PEGAWAI',
            jabatan: 'Guru Bahasa Indonesia',
            golongan: 'III/b',
            unitKerja: 'SMP Negeri 5 Samarinda',
            wilayah: 'SAMARINDA'
          }
        }),
        prisma.user.create({
          data: {
            email: 'pegawai3@example.com',
            nip: '198612202008121003',
            name: 'Budi Santoso',
            role: 'PEGAWAI',
            jabatan: 'Kepala Sekolah',
            golongan: 'IV/a',
            unitKerja: 'SD Negeri 12 Bontang',
            wilayah: 'KUTIM_BONTANG'
          }
        })
      ])
      
      console.log('Created sample pegawai users:', samplePegawai.length)
    }

    // Get updated list of pegawai users
    const allPegawai = await prisma.user.findMany({
      where: { role: 'PEGAWAI' }
    })

    // Create document requirements if they don't exist
    const existingRequirements = await prisma.documentRequirement.findMany()
    
    if (existingRequirements.length === 0) {
      console.log('Creating document requirements...')
      
      await Promise.all([
        prisma.documentRequirement.create({
          data: {
            code: 'sk-kenaikan-terakhir',
            name: 'SK Kenaikan Pangkat Terakhir',
            description: 'Surat Keputusan kenaikan pangkat terakhir yang dimiliki',
            isRequired: true,
            hasSimASN: true
          }
        }),
        prisma.documentRequirement.create({
          data: {
            code: 'sk-jabatan',
            name: 'SK Jabatan',
            description: 'Surat Keputusan jabatan yang sedang diemban',
            isRequired: true,
            hasSimASN: false
          }
        }),
        prisma.documentRequirement.create({
          data: {
            code: 'penilaian-prestasi-kerja',
            name: 'Penilaian Prestasi Kerja',
            description: 'Penilaian prestasi kerja 2 tahun terakhir',
            isRequired: true,
            hasSimASN: true
          }
        }),
        prisma.documentRequirement.create({
          data: {
            code: 'ijazah',
            name: 'Ijazah Pendidikan',
            description: 'Ijazah pendidikan terakhir yang dimiliki',
            isRequired: true,
            hasSimASN: false
          }
        }),
        prisma.documentRequirement.create({
          data: {
            code: 'sertifikat-diklat',
            name: 'Sertifikat Diklat',
            description: 'Sertifikat pendidikan dan pelatihan yang relevan',
            isRequired: false,
            hasSimASN: false
          }
        })
      ])
      
      console.log('Created document requirements')
    }

    // Create sample proposals for each pegawai
    const documentRequirements = await prisma.documentRequirement.findMany()
    
    for (const pegawai of allPegawai.slice(0, 3)) {
      // Create different proposals with various statuses
      const proposals = [
        {
          periode: 'April 2025',
          status: 'MENUNGGU_VERIFIKASI_DINAS',
          notes: 'Usulan kenaikan pangkat periode April 2025'
        },
        {
          periode: 'Oktober 2024',
          status: 'SELESAI',
          notes: 'Usulan kenaikan pangkat periode Oktober 2024 - Sudah selesai diproses'
        },
        {
          periode: 'April 2024',
          status: 'PERLU_PERBAIKAN_DARI_DINAS',
          notes: 'Dokumen SK Jabatan perlu diperbaiki format dan legalisir'
        }
      ]

      for (const [index, proposalData] of proposals.entries()) {
        const proposal = await prisma.promotionProposal.create({
          data: {
            periode: proposalData.periode,
            status: proposalData.status as any,
            notes: proposalData.notes,
            pegawaiId: pegawai.id,
            createdAt: new Date(Date.now() - (index * 90 * 24 * 60 * 60 * 1000)), // 90 days apart
            updatedAt: new Date(Date.now() - (index * 30 * 24 * 60 * 60 * 1000))   // 30 days apart
          }
        })

        // Create documents for each proposal
        for (const docReq of documentRequirements.slice(0, 4)) { // First 4 required docs
          const documentStatuses = ['DISETUJUI', 'MENUNGGU_VERIFIKASI', 'PERLU_PERBAIKAN', 'DITOLAK']
          let docStatus = 'MENUNGGU_VERIFIKASI'
          let docNotes = ''

          // Set different statuses based on proposal status
          if (proposalData.status === 'SELESAI') {
            docStatus = 'DISETUJUI'
          } else if (proposalData.status === 'PERLU_PERBAIKAN_DARI_DINAS') {
            if (docReq.code === 'sk-jabatan') {
              docStatus = 'PERLU_PERBAIKAN'
              docNotes = 'Format file tidak sesuai, mohon upload ulang dengan format PDF yang jelas dan sudah dilegalisir'
            } else {
              docStatus = Math.random() > 0.5 ? 'DISETUJUI' : 'MENUNGGU_VERIFIKASI'
            }
          } else {
            // Random status for active proposals
            docStatus = documentStatuses[Math.floor(Math.random() * documentStatuses.length)]
            if (docStatus === 'PERLU_PERBAIKAN') {
              docNotes = 'Dokumen kurang jelas, mohon upload ulang dengan kualitas yang lebih baik'
            } else if (docStatus === 'DITOLAK') {
              docNotes = 'Dokumen tidak sesuai dengan persyaratan yang diminta'
            }
          }

          await prisma.proposalDocument.create({
            data: {
              fileName: `${docReq.code}-${pegawai.nip}.pdf`,
              fileSize: Math.floor(Math.random() * 2000000) + 500000, // 500KB - 2.5MB
              fileUrl: `/uploads/documents/${docReq.code}-${pegawai.nip}.pdf`,
              status: docStatus as any,
              notes: docNotes,
              proposalId: proposal.id,
              documentRequirementId: docReq.id,
              uploadedAt: new Date(proposal.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Within 7 days of proposal
            }
          })
        }

        console.log(`Created proposal ${proposal.id} for pegawai ${pegawai.name}`)
      }
    }

    console.log('Proposal seeding completed successfully!')

  } catch (error) {
    console.error('Error seeding proposals:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedProposals()
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })
