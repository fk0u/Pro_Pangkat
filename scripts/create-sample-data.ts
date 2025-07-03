import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating sample data for testing...')

  // Create a test pegawai user
  const hashedPassword = await hash('123456', 12)
  
  let testPegawai = await prisma.user.upsert({
    where: { nip: '196508121990031004' },
    update: {},
    create: {
      nip: '196508121990031004',
      name: 'Dr. Ahmad Wijaya, S.Pd',
      email: 'ahmad.wijaya@example.com',
      password: hashedPassword,
      role: 'PEGAWAI',
      mustChangePassword: false,
      golongan: 'III/c',
      tmtGolongan: new Date('2020-01-01'),
      jabatan: 'Guru Matematika',
      jenisJabatan: 'Guru',
      unitKerja: 'SMAN 1 Jakarta',
      phone: '081234567890',
      address: 'Jakarta',
    },
  })

  // Create document requirements
  const documentRequirements = [
    {
      code: 'SK_PANGKAT',
      name: 'SK Pangkat Terakhir',
      description: 'Surat Keputusan Pangkat Terakhir',
      isRequired: true,
    },
    {
      code: 'IJAZAH_S1',
      name: 'Ijazah S1',
      description: 'Ijazah Sarjana',
      isRequired: true,
    },
    {
      code: 'IJAZAH_S2',
      name: 'Ijazah S2',
      description: 'Ijazah Magister (jika ada)',
      isRequired: false,
    },
    {
      code: 'SERTIFIKAT_PENDIDIK',
      name: 'Sertifikat Pendidik',
      description: 'Sertifikat Pendidik Profesional',
      isRequired: true,
    },
    {
      code: 'SKP',
      name: 'SKP 2 Tahun Terakhir',
      description: 'Sasaran Kerja Pegawai 2 tahun terakhir',
      isRequired: true,
    },
  ]

  for (const req of documentRequirements) {
    await prisma.documentRequirement.upsert({
      where: { code: req.code },
      update: {},
      create: req,
    })
  }

  // Get all document requirements
  const allDocReqs = await prisma.documentRequirement.findMany()

  // Create sample proposals with different statuses
  const proposals = [
    {
      id: 'proposal-draft-001',
      periode: '2024',
      status: 'DRAFT' as const,
      notes: 'Usulan dibuat oleh operator sekolah untuk melengkapi berkas',
    },
    {
      id: 'proposal-pending-001',
      periode: '2024',
      status: 'MENUNGGU_VERIFIKASI_DINAS' as const,
      notes: 'Usulan telah disubmit dan menunggu verifikasi dinas',
    },
    {
      id: 'proposal-revision-001',
      periode: '2024',
      status: 'PERLU_PERBAIKAN_DARI_DINAS' as const,
      notes: 'Dokumen ijazah perlu diperbaiki sesuai ketentuan terbaru',
    },
    {
      id: 'proposal-completed-001',
      periode: '2023',
      status: 'SELESAI' as const,
      notes: 'Proposal telah selesai diproses',
    },
  ]

  for (const proposal of proposals) {
    const existingProposal = await prisma.promotionProposal.findFirst({
      where: { id: proposal.id }
    })

    if (!existingProposal) {
      await prisma.promotionProposal.create({
        data: {
          ...proposal,
          pegawaiId: testPegawai.id,
        },
      })
    }
  }

  // Add sample documents for some proposals
  const proposalWithDocs = await prisma.promotionProposal.findFirst({
    where: { status: 'MENUNGGU_VERIFIKASI_DINAS' }
  })

  if (proposalWithDocs) {
    const skPangkatReq = allDocReqs.find(req => req.code === 'SK_PANGKAT')
    const ijazahReq = allDocReqs.find(req => req.code === 'IJAZAH_S1')

    if (skPangkatReq) {
      await prisma.proposalDocument.upsert({
        where: { id: 'doc-sk-pangkat-001' },
        update: {},
        create: {
          id: 'doc-sk-pangkat-001',
          fileName: 'SK_Pangkat_Terakhir.pdf',
          fileSize: 2048000,
          fileUrl: '/uploads/documents/sk-pangkat.pdf',
          status: 'DISETUJUI',
          notes: 'Dokumen valid dan lengkap',
          proposalId: proposalWithDocs.id,
          documentRequirementId: skPangkatReq.id,
        },
      })
    }

    if (ijazahReq) {
      await prisma.proposalDocument.upsert({
        where: { id: 'doc-ijazah-001' },
        update: {},
        create: {
          id: 'doc-ijazah-001',
          fileName: 'Ijazah_S1.pdf',
          fileSize: 1536000,
          fileUrl: '/uploads/documents/ijazah-s1.pdf',
          status: 'MENUNGGU_VERIFIKASI',
          proposalId: proposalWithDocs.id,
          documentRequirementId: ijazahReq.id,
        },
      })
    }
  }

  // Add sample documents for revision proposal
  const revisionProposal = await prisma.promotionProposal.findFirst({
    where: { status: 'PERLU_PERBAIKAN_DARI_DINAS' }
  })

  if (revisionProposal) {
    const ijazahReq = allDocReqs.find(req => req.code === 'IJAZAH_S1')

    if (ijazahReq) {
      await prisma.proposalDocument.upsert({
        where: { id: 'doc-ijazah-revision-001' },
        update: {},
        create: {
          id: 'doc-ijazah-revision-001',
          fileName: 'Ijazah_S1_Lama.pdf',
          fileSize: 1024000,
          fileUrl: '/uploads/documents/ijazah-s1-lama.pdf',
          status: 'PERLU_PERBAIKAN',
          notes: 'Scan kurang jelas, perlu scan ulang dengan resolusi tinggi',
          proposalId: revisionProposal.id,
          documentRequirementId: ijazahReq.id,
        },
      })
    }
  }

  // Add complete documents for completed proposal
  const completedProposal = await prisma.promotionProposal.findFirst({
    where: { status: 'SELESAI' }
  })

  if (completedProposal) {
    for (let i = 0; i < Math.min(allDocReqs.length, 3); i++) {
      const req = allDocReqs[i]
      await prisma.proposalDocument.upsert({
        where: { id: `doc-completed-${i + 1}` },
        update: {},
        create: {
          id: `doc-completed-${i + 1}`,
          fileName: `${req.name.replace(/\s+/g, '_')}.pdf`,
          fileSize: 2048000 + (i * 512000),
          fileUrl: `/uploads/documents/${req.code.toLowerCase()}.pdf`,
          status: 'DISETUJUI',
          notes: 'Dokumen telah diverifikasi dan disetujui',
          proposalId: completedProposal.id,
          documentRequirementId: req.id,
        },
      })
    }
  }

  console.log('Sample data created successfully!')
  console.log('Test user credentials:')
  console.log('NIP: 196508121990031004')
  console.log('Password: 123456')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
