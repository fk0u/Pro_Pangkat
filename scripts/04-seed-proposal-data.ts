import { PrismaClient } from "@prisma/client"
import { StatusProposal, StatusDokumen, Role } from "@prisma/client"

const prisma = new PrismaClient()

async function seedProposalData() {
  console.log("🌱 Seeding Promotion Proposal data...")

  try {
    // Get existing users for different roles and regions
    const pegawaiUsers = await prisma.user.findMany({
      where: { role: Role.PEGAWAI },
      take: 20
    })

    const operatorUsers = await prisma.user.findMany({
      where: { role: Role.OPERATOR },
      take: 5
    })

    // Get document requirements
    const documentRequirements = await prisma.documentRequirement.findMany()

    if (pegawaiUsers.length === 0) {
      console.log("❌ No pegawai users found. Please run user seeding first.")
      return
    }

    if (documentRequirements.length === 0) {
      console.log("❌ No document requirements found. Please seed document requirements first.")
      return
    }

    console.log(`📋 Found ${pegawaiUsers.length} pegawai users`)
    console.log(`🏢 Found ${operatorUsers.length} operator users`)
    console.log(`📄 Found ${documentRequirements.length} document requirements`)

    // Clear existing proposals
    await prisma.proposalDocument.deleteMany({})
    await prisma.promotionProposal.deleteMany({})
    console.log("✅ Cleared existing proposal data")

    // Helper function to get random element
    const getRandomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)]
    
    // Helper function to get random date within range
    const getRandomDate = (start: Date, end: Date) => {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    }

    // Create sample proposals
    const proposals = []
    const statusOptions = [
      StatusProposal.DRAFT,
      StatusProposal.DIAJUKAN,
      StatusProposal.DIPROSES_OPERATOR,
      StatusProposal.DIKEMBALIKAN_OPERATOR,
      StatusProposal.DISETUJUI_OPERATOR,
      StatusProposal.SELESAI,
      StatusProposal.DITOLAK
    ]

    // Create proposals for each pegawai
    for (let i = 0; i < pegawaiUsers.length; i++) {
      const pegawai = pegawaiUsers[i]
      const shouldCreateProposal = Math.random() > 0.3 // 70% chance to have proposal

      if (shouldCreateProposal) {
        const status = i < 3 ? StatusProposal.DIAJUKAN : // First 3 are submitted
                     i < 6 ? StatusProposal.DIPROSES_OPERATOR : // Next 3 are being processed
                     i < 9 ? StatusProposal.DISETUJUI_OPERATOR : // Next 3 are approved
                     i < 12 ? StatusProposal.DIKEMBALIKAN_OPERATOR : // Next 3 are returned
                     getRandomElement(statusOptions) // Rest are random

        const operatorId = status !== StatusProposal.DRAFT ? 
                          getRandomElement(operatorUsers)?.id : null

        const createdAt = getRandomDate(
          new Date("2025-07-15"), 
          new Date("2025-08-15")
        )

        const proposal = {
          periode: "Agustus 2025",
          status: status,
          notes: status === StatusProposal.DIKEMBALIKAN_OPERATOR ? 
                 "Dokumen SK pangkat terakhir belum lengkap, mohon diperbaiki" :
                 status === StatusProposal.DITOLAK ?
                 "Tidak memenuhi syarat masa kerja minimum" :
                 status === StatusProposal.DISETUJUI_OPERATOR ?
                 "Semua dokumen telah lengkap dan memenuhi syarat" :
                 null,
          nomorSuratPengantar: status !== StatusProposal.DRAFT ? 
                               `SP/${pegawai.wilayah}/${Math.floor(Math.random() * 999).toString().padStart(3, '0')}/2025` : 
                               null,
          tanggalSurat: status !== StatusProposal.DRAFT ? createdAt : null,
          pegawaiId: pegawai.id,
          operatorId: operatorId,
          createdAt: createdAt,
          updatedAt: new Date()
        }

        proposals.push(proposal)
      }
    }

    console.log(`📝 Creating ${proposals.length} proposals...`)

    // Insert proposals
    const createdProposals = await Promise.all(
      proposals.map(proposal => 
        prisma.promotionProposal.create({
          data: proposal
        })
      )
    )

    console.log(`✅ Created ${createdProposals.length} proposals`)

    // Create proposal documents for each proposal
    let totalDocuments = 0
    for (const proposal of createdProposals) {
      // Only draft proposals don't have documents yet
      if (proposal.status === StatusProposal.DRAFT) continue

      // Random number of documents (3-6 out of available requirements)
      const numDocuments = Math.min(
        3 + Math.floor(Math.random() * 4),
        documentRequirements.length
      )
      
      const selectedRequirements = documentRequirements
        .sort(() => 0.5 - Math.random())
        .slice(0, numDocuments)

      for (const docReq of selectedRequirements) {
        const documentStatus = proposal.status === StatusProposal.DIKEMBALIKAN_OPERATOR ? 
                              (Math.random() > 0.5 ? StatusDokumen.DIKEMBALIKAN : StatusDokumen.DISETUJUI) :
                              proposal.status === StatusProposal.DISETUJUI_OPERATOR ? 
                              StatusDokumen.DISETUJUI :
                              proposal.status === StatusProposal.DITOLAK ? 
                              StatusDokumen.DITOLAK :
                              Math.random() > 0.3 ? StatusDokumen.DISETUJUI : StatusDokumen.MENUNGGU_VERIFIKASI

        const docData = {
          proposalId: proposal.id,
          documentRequirementId: docReq.id,
          fileUrl: `/uploads/documents/${proposal.pegawaiId}/${docReq.code}_${Date.now()}.pdf`,
          fileName: `${docReq.name.replace(/\s+/g, '_')}.pdf`,
          fileSize: 1024000 + Math.floor(Math.random() * 4096000), // 1-5MB
          status: documentStatus,
          notes: documentStatus === StatusDokumen.DIKEMBALIKAN ? 
                 "File tidak jelas, mohon upload ulang dengan kualitas yang lebih baik" :
                 documentStatus === StatusDokumen.DITOLAK ?
                 "Dokumen tidak sesuai dengan persyaratan" :
                 null,
          uploadedAt: getRandomDate(proposal.createdAt, new Date())
        }

        await prisma.proposalDocument.create({ data: docData })
        totalDocuments++
      }
    }

    console.log(`📄 Created ${totalDocuments} proposal documents`)

    // Create activity logs for operators
    const activities = []
    for (const proposal of createdProposals) {
      if (proposal.operatorId && proposal.status !== StatusProposal.DRAFT) {
        const actions = [
          {
            action: "PROPOSAL_REVIEWED",
            details: { 
              proposalId: proposal.id, 
              action: "Meninjau proposal kenaikan pangkat",
              pegawaiName: pegawaiUsers.find(p => p.id === proposal.pegawaiId)?.name 
            }
          }
        ]

        if (proposal.status === StatusProposal.DISETUJUI_OPERATOR) {
          activities.push({
            action: "PROPOSAL_APPROVED",
            details: { 
              proposalId: proposal.id, 
              action: "Menyetujui proposal kenaikan pangkat",
              pegawaiName: pegawaiUsers.find(p => p.id === proposal.pegawaiId)?.name 
            },
            userId: proposal.operatorId,
            createdAt: getRandomDate(proposal.createdAt, new Date())
          })
        } else if (proposal.status === StatusProposal.DIKEMBALIKAN_OPERATOR) {
          activities.push({
            action: "PROPOSAL_RETURNED",
            details: { 
              proposalId: proposal.id, 
              action: "Mengembalikan proposal untuk perbaikan",
              reason: "Dokumen belum lengkap",
              pegawaiName: pegawaiUsers.find(p => p.id === proposal.pegawaiId)?.name 
            },
            userId: proposal.operatorId,
            createdAt: getRandomDate(proposal.createdAt, new Date())
          })
        }

        for (const activity of actions) {
          activities.push({
            ...activity,
            userId: proposal.operatorId,
            createdAt: getRandomDate(proposal.createdAt, new Date())
          })
        }
      }
    }

    if (activities.length > 0) {
      await Promise.all(
        activities.map(activity => 
          prisma.activityLog.create({ data: activity })
        )
      )
      console.log(`📊 Created ${activities.length} activity logs`)
    }

    // Final statistics
    const stats = await prisma.promotionProposal.groupBy({
      by: ["status"],
      _count: true
    })

    console.log(`📊 Proposal Statistics:`)
    stats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count}`)
    })

    console.log(`🎯 Sample data created successfully!`)
    console.log(`   Total Proposals: ${createdProposals.length}`)
    console.log(`   Total Documents: ${totalDocuments}`)
    console.log(`   Total Activities: ${activities.length}`)

  } catch (error) {
    console.error("❌ Error seeding proposal data:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedProposalData()
    .then(() => {
      console.log("🎉 Proposal seeding completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Proposal seeding failed:", error)
      process.exit(1)
    })
}

export default seedProposalData
