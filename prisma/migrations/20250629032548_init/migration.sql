-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PEGAWAI', 'OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusDokumen" AS ENUM ('MENUNGGU_VERIFIKASI', 'PERLU_PERBAIKAN', 'DISETUJUI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "StatusProposal" AS ENUM ('DRAFT', 'DIAJUKAN', 'DIPROSES_OPERATOR', 'DIKEMBALIKAN_OPERATOR', 'DISETUJUI_OPERATOR', 'DIPROSES_ADMIN', 'DIKEMBALIKAN_ADMIN', 'SELESAI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "Wilayah" AS ENUM ('BALIKPAPAN_PPU', 'KUTIM_BONTANG', 'KUKAR', 'KUBAR_MAHULU', 'PASER', 'BERAU', 'SAMARINDA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PEGAWAI',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "golongan" TEXT,
    "tmtGolongan" TIMESTAMP(3),
    "jabatan" TEXT,
    "jenisJabatan" TEXT,
    "unitKerja" TEXT,
    "wilayah" "Wilayah",
    "phone" TEXT,
    "address" TEXT,
    "profilePictureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionProposal" (
    "id" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "status" "StatusProposal" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "pegawaiId" TEXT NOT NULL,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequirement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "hasSimASN" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalDocument" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "documentRequirementId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "StatusDokumen" NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
    "notes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nip_key" ON "User"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequirement_code_key" ON "DocumentRequirement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalDocument_proposalId_documentRequirementId_key" ON "ProposalDocument"("proposalId", "documentRequirementId");

-- AddForeignKey
ALTER TABLE "PromotionProposal" ADD CONSTRAINT "PromotionProposal_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionProposal" ADD CONSTRAINT "PromotionProposal_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalDocument" ADD CONSTRAINT "ProposalDocument_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "PromotionProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalDocument" ADD CONSTRAINT "ProposalDocument_documentRequirementId_fkey" FOREIGN KEY ("documentRequirementId") REFERENCES "DocumentRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
