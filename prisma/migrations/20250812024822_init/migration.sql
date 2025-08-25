-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PEGAWAI', 'OPERATOR', 'ADMIN', 'OPERATOR_SEKOLAH', 'OPERATOR_UNIT_KERJA');

-- CreateEnum
CREATE TYPE "StatusDokumen" AS ENUM ('MENUNGGU_VERIFIKASI', 'PERLU_PERBAIKAN', 'DISETUJUI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "StatusProposal" AS ENUM ('DRAFT', 'DIAJUKAN', 'DIPROSES_OPERATOR', 'DIKEMBALIKAN_OPERATOR', 'DISETUJUI_OPERATOR', 'DITERUSKAN_KE_PUSAT', 'DIPROSES_ADMIN', 'DIKEMBALIKAN_ADMIN', 'SELESAI', 'DITOLAK', 'DITARIK', 'MENUNGGU_VERIFIKASI_DINAS', 'MENUNGGU_VERIFIKASI_SEKOLAH', 'PERLU_PERBAIKAN_DARI_DINAS', 'PERLU_PERBAIKAN_DARI_SEKOLAH', 'DITOLAK_SEKOLAH', 'DITOLAK_DINAS', 'DITOLAK_ADMIN');

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
    "tmtJabatan" TIMESTAMP(3),
    "jabatan" TEXT,
    "jenisJabatan" TEXT,
    "unitKerjaId" TEXT,
    "wilayah" "Wilayah",
    "phone" TEXT,
    "address" TEXT,
    "profilePictureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitKerja" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "npsn" TEXT,
    "jenjang" TEXT NOT NULL,
    "alamat" TEXT,
    "kecamatan" TEXT,
    "wilayah" "Wilayah" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitKerja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionProposal" (
    "id" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "status" "StatusProposal" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "nomorSuratPengantar" TEXT,
    "tanggalSurat" TIMESTAMP(3),
    "fileSuratPengantar" TEXT,
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

-- CreateTable
CREATE TABLE "Timeline" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "jabatanType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "wilayah" "Wilayah",
    "createdBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailedDocumentInfo" (
    "id" TEXT NOT NULL,
    "documentReqId" TEXT NOT NULL,
    "purpose" TEXT,
    "obtainMethod" TEXT,
    "validityPeriod" TEXT,
    "legalBasis" TEXT,
    "templateUrl" TEXT,
    "sampleUrl" TEXT,
    "requirements" JSONB,
    "fillTips" TEXT,
    "commonMistakes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetailedDocumentInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "userId" TEXT,
    "userRole" "Role",
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "actionLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nip_key" ON "User"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UnitKerja_nama_key" ON "UnitKerja"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "UnitKerja_npsn_key" ON "UnitKerja"("npsn");

-- CreateIndex
CREATE INDEX "UnitKerja_wilayah_idx" ON "UnitKerja"("wilayah");

-- CreateIndex
CREATE INDEX "UnitKerja_jenjang_idx" ON "UnitKerja"("jenjang");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequirement_code_key" ON "DocumentRequirement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalDocument_proposalId_documentRequirementId_key" ON "ProposalDocument"("proposalId", "documentRequirementId");

-- CreateIndex
CREATE UNIQUE INDEX "DetailedDocumentInfo_documentReqId_key" ON "DetailedDocumentInfo"("documentReqId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unitKerjaId_fkey" FOREIGN KEY ("unitKerjaId") REFERENCES "UnitKerja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "DetailedDocumentInfo" ADD CONSTRAINT "DetailedDocumentInfo_documentReqId_fkey" FOREIGN KEY ("documentReqId") REFERENCES "DocumentRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
