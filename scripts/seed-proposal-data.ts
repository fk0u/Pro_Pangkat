import { PrismaClient, StatusProposal, StatusDokumen } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding proposal data')

  // Get all operators in the system to assign proposals
  const operators = await prisma.user.findMany({
    where: { role: "OPERATOR" },
    select: { id: true, wilayah: true, wilayahId: true }
  })

  // If no operators, we can't continue
  if (!operators || operators.length === 0) {
    console.log('No operators found. Please seed operator data first.')
    return
  }

  // Get all document requirements
  const documentRequirements = await prisma.documentRequirement.findMany()
  
  if (!documentRequirements || documentRequirements.length === 0) {
    console.log('No document requirements found. Please seed document requirements first.')
    return
  }

  // Get all employees (pegawai)
  const pegawai = await prisma.user.findMany({
    where: { role: "PEGAWAI" },
    include: { unitKerja: true }
  })

  if (!pegawai || pegawai.length === 0) {
    console.log('No pegawai found. Please seed pegawai data first.')
    return
  }

  // Sample proposal data
  const periodes = ["April 2025", "Oktober 2024", "April 2024"]
  const statusOptions = [
    StatusProposal.DRAFT,
    StatusProposal.DIAJUKAN,
    StatusProposal.DIPROSES_OPERATOR,
    StatusProposal.DISETUJUI_OPERATOR,
    StatusProposal.DIKEMBALIKAN_OPERATOR
  ]
  
  const documentStatusOptions = [
    StatusDokumen.MENUNGGU_VERIFIKASI,
    StatusDokumen.DISETUJUI,
    StatusDokumen.DITOLAK,
    StatusDokumen.PERLU_PERBAIKAN
  ]

  // Create proposals for each pegawai
  let totalProposals = 0
  let totalDocuments = 0

  for (const employee of pegawai) {
    // Assign appropriate operator based on wilayah
    const matchingOperator = operators.find(op => 
      (employee.wilayah && op.wilayah === employee.wilayah) || 
      (employee.wilayahId && op.wilayahId === employee.wilayahId) ||
      operators[0] // Fallback to first operator if no match
    )
    
    if (!matchingOperator) continue
    
    // Create 1-3 proposals per employee with random status
    const proposalCount = Math.floor(Math.random() * 3) + 1
    
    for (let i = 0; i < proposalCount; i++) {
      const periode = periodes[Math.floor(Math.random() * periodes.length)]
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)]
      
      // If we want more DIAJUKAN status (needs verification)
      const biasedStatus = i === 0 && Math.random() > 0.7 
        ? StatusProposal.DIAJUKAN 
        : status
      
      // Create the proposal
      const proposal = await prisma.promotionProposal.create({
        data: {
          periode: periode,
          status: biasedStatus,
          notes: `Usulan kenaikan pangkat periode ${periode}`,
          pegawaiId: employee.id,
          operatorId: biasedStatus !== StatusProposal.DRAFT ? matchingOperator.id : null
        }
      })
      
      // Add documents to the proposal
      // Use a subset of document requirements (4-8 documents)
      const docCount = Math.floor(Math.random() * 5) + 4
      const selectedDocs = documentRequirements
        .sort(() => 0.5 - Math.random())
        .slice(0, docCount)
      
      for (const doc of selectedDocs) {
        // For DIAJUKAN status, all documents should be waiting for verification
        // For other statuses, mix of different document statuses
        let docStatus = StatusDokumen.MENUNGGU_VERIFIKASI
        
        if (biasedStatus !== StatusProposal.DIAJUKAN && biasedStatus !== StatusProposal.DRAFT) {
          docStatus = documentStatusOptions[Math.floor(Math.random() * documentStatusOptions.length)]
        }
        
        await prisma.proposalDocument.create({
          data: {
            proposalId: proposal.id,
            documentRequirementId: doc.id,
            fileUrl: `/uploads/documents/sample-${doc.code}.pdf`,
            fileName: `${doc.code}.pdf`,
            originalName: `${doc.name}.pdf`,
            fileSize: 1024 * 1024 * (Math.floor(Math.random() * 4) + 1), // 1-5 MB
            status: docStatus,
            catatan: docStatus === StatusDokumen.DITOLAK || docStatus === StatusDokumen.PERLU_PERBAIKAN 
              ? "Dokumen perlu diperbaiki karena kurang jelas/lengkap" 
              : null,
            uploadedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            verifiedAt: docStatus !== StatusDokumen.MENUNGGU_VERIFIKASI 
              ? new Date() 
              : null
          }
        })
        
        totalDocuments++
      }
      
      totalProposals++
      console.log(`Created proposal ${totalProposals} for ${employee.name} with status ${biasedStatus}`)
    }
  }

  console.log(`Proposal data seeding completed. Created ${totalProposals} proposals with ${totalDocuments} documents.`)
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
