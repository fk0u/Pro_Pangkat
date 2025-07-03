-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusProposal" ADD VALUE 'DITARIK';
ALTER TYPE "StatusProposal" ADD VALUE 'MENUNGGU_VERIFIKASI_DINAS';
ALTER TYPE "StatusProposal" ADD VALUE 'MENUNGGU_VERIFIKASI_SEKOLAH';
ALTER TYPE "StatusProposal" ADD VALUE 'PERLU_PERBAIKAN_DARI_DINAS';
ALTER TYPE "StatusProposal" ADD VALUE 'PERLU_PERBAIKAN_DARI_SEKOLAH';

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

-- CreateIndex
CREATE UNIQUE INDEX "DetailedDocumentInfo_documentReqId_key" ON "DetailedDocumentInfo"("documentReqId");

-- AddForeignKey
ALTER TABLE "DetailedDocumentInfo" ADD CONSTRAINT "DetailedDocumentInfo_documentReqId_fkey" FOREIGN KEY ("documentReqId") REFERENCES "DocumentRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
