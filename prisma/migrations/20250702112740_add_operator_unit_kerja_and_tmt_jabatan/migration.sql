/*
  Warnings:

  - You are about to drop the column `unitKerja` on the `User` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'OPERATOR_SEKOLAH';
ALTER TYPE "Role" ADD VALUE 'OPERATOR_UNIT_KERJA';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusProposal" ADD VALUE 'DITOLAK_SEKOLAH';
ALTER TYPE "StatusProposal" ADD VALUE 'DITOLAK_DINAS';
ALTER TYPE "StatusProposal" ADD VALUE 'DITOLAK_ADMIN';

-- AlterTable
ALTER TABLE "PromotionProposal" ADD COLUMN     "fileSuratPengantar" TEXT,
ADD COLUMN     "nomorSuratPengantar" TEXT,
ADD COLUMN     "tanggalSurat" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "unitKerja",
ADD COLUMN     "tmtJabatan" TIMESTAMP(3),
ADD COLUMN     "unitKerjaId" TEXT;

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
CREATE UNIQUE INDEX "UnitKerja_nama_key" ON "UnitKerja"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "UnitKerja_npsn_key" ON "UnitKerja"("npsn");

-- CreateIndex
CREATE INDEX "UnitKerja_wilayah_idx" ON "UnitKerja"("wilayah");

-- CreateIndex
CREATE INDEX "UnitKerja_jenjang_idx" ON "UnitKerja"("jenjang");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unitKerjaId_fkey" FOREIGN KEY ("unitKerjaId") REFERENCES "UnitKerja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
