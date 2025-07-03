import { PrismaClient, StatusProposal, StatusDokumen } from "@prisma/client"

const prisma = new PrismaClient()

async function addSampleData() {
  console.log("Adding sample data...")

  // Get existing users
  const pegawai = await prisma.user.findFirst({ where: { role: "PEGAWAI" } })
  const operator = await prisma.user.findFirst({ where: { role: "OPERATOR" } })

  if (!pegawai || !operator) {
    console.log("No pegawai or operator found. Please run main seed first.")
    return
  }

  // Create sample proposals
  const proposal1 = await prisma.promotionProposal.create({
    data: {
      periode: "Agustus 2025",
      status: StatusProposal.DIAJUKAN,
      pegawaiId: pegawai.id,
      operatorId: operator.id,
      notes: "Usulan kenaikan pangkat reguler periode Agustus 2025",
    },
  })

  const proposal2 = await prisma.promotionProposal.create({
    data: {
      periode: "April 2025",
      status: StatusProposal.SELESAI,
      pegawaiId: pegawai.id,
      operatorId: operator.id,
      notes: "Usulan kenaikan pangkat periode April 2025 telah selesai",
    },
  })

  // Get document requirements
  const docRequirements = await prisma.documentRequirement.findMany()

  // Create sample documents for proposal1
  if (docRequirements.length > 0) {
    await prisma.proposalDocument.createMany({
      data: [
        {
          proposalId: proposal1.id,
          documentRequirementId: docRequirements[0].id,
          fileUrl: "/uploads/documents/sk-kenaikan-terakhir.pdf",
          fileName: "SK Kenaikan Pangkat Terakhir.pdf",
          fileSize: 2048576,
          status: StatusDokumen.DISETUJUI,
        },
        {
          proposalId: proposal1.id,
          documentRequirementId: docRequirements[1]?.id || docRequirements[0].id,
          fileUrl: "/uploads/documents/penilaian-kinerja-2023.pdf",
          fileName: "Penilaian Kinerja 2023.pdf",
          fileSize: 1024000,
          status: StatusDokumen.MENUNGGU_VERIFIKASI,
        },
        {
          proposalId: proposal1.id,
          documentRequirementId: docRequirements[2]?.id || docRequirements[0].id,
          fileUrl: "/uploads/documents/surat-pengantar.pdf",
          fileName: "Surat Pengantar Usulan.pdf",
          fileSize: 512000,
          status: StatusDokumen.PERLU_PERBAIKAN,
          notes: "Format file tidak sesuai, mohon gunakan PDF dengan resolusi tinggi",
        },
      ],
    })
  }

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        action: "Login ke sistem",
        details: { source: "dashboard" },
        userId: pegawai.id,
      },
      {
        action: "Upload dokumen SK Kenaikan Pangkat Terakhir",
        details: { fileName: "SK Kenaikan Pangkat Terakhir.pdf", fileSize: 2048576 },
        userId: pegawai.id,
      },
      {
        action: "Verifikasi dokumen pegawai",
        details: { proposalId: proposal1.id, status: "approved" },
        userId: operator.id,
      },
      {
        action: "Submit usulan kenaikan pangkat",
        details: { proposalId: proposal1.id, periode: "Agustus 2025" },
        userId: pegawai.id,
      },
    ],
  })

  console.log("Sample data added successfully!")
  console.log(`- Created ${2} proposals`)
  console.log(`- Created ${3} documents`)
  console.log(`- Created ${4} activity logs`)
}

addSampleData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
