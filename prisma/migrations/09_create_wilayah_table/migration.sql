-- CreateTable: Tabel WilayahMaster
CREATE TABLE "WilayahMaster" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "ibukota" TEXT,
    "koordinat" TEXT,
    "luasWilayah" INTEGER,
    "jumlahKecamatan" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WilayahMaster_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "WilayahMaster_kode_key" ON "WilayahMaster"("kode");

-- Insert data wilayah
INSERT INTO "WilayahMaster" ("id", "kode", "nama", "namaLengkap", "ibukota", "koordinat", "luasWilayah", "jumlahKecamatan", "isActive") VALUES
('wilayah_balikpapan_ppu', 'BALIKPAPAN_PPU', 'Balikpapan & PPU', 'Kota Balikpapan dan Kabupaten Penajam Paser Utara', 'Balikpapan', '-1.2379,116.8529', 30325, 14, true),
('wilayah_kutim_bontang', 'KUTIM_BONTANG', 'Kutai Timur & Bontang', 'Kabupaten Kutai Timur dan Kota Bontang', 'Sangatta', '0.4037,117.4953', 36450, 21, true),
('wilayah_kukar', 'KUKAR', 'Kutai Kartanegara', 'Kabupaten Kutai Kartanegara', 'Tenggarong', '-0.4174,117.3752', 27263, 18, true),
('wilayah_kubar_mahulu', 'KUBAR_MAHULU', 'Kutai Barat & Mahakam Ulu', 'Kabupaten Kutai Barat dan Kabupaten Mahakam Ulu', 'Sendawar', '0.4836,115.7817', 35825, 23, true),
('wilayah_paser', 'PASER', 'Paser', 'Kabupaten Paser', 'Tanah Grogot', '-1.8894,115.9993', 11603, 10, true),
('wilayah_berau', 'BERAU', 'Berau', 'Kabupaten Berau', 'Tanjung Redeb', '2.0397,117.4653', 21000, 13, true),
('wilayah_samarinda', 'SAMARINDA', 'Samarinda', 'Kota Samarinda', 'Samarinda', '-0.4950,117.1436', 78225, 10, true);

-- Add wilayahId column to UnitKerja table
ALTER TABLE "UnitKerja" ADD COLUMN "wilayahId" TEXT;

-- Update UnitKerja with wilayahId based on existing wilayah enum
UPDATE "UnitKerja" SET "wilayahId" = 'wilayah_balikpapan_ppu' WHERE "wilayah" = 'BALIKPAPAN_PPU';
UPDATE "UnitKerja" SET "wilayahId" = 'wilayah_kutim_bontang' WHERE "wilayah" = 'KUTIM_BONTANG';
UPDATE "UnitKerja" SET "wilayahId" = 'wilayah_kukar' WHERE "wilayah" = 'KUKAR';
UPDATE "UnitKerja" SET "wilayahId" = 'wilayah_kubar_mahulu' WHERE "wilayah" = 'KUBAR_MAHULU';
UPDATE "UnitKerja" SET "wilayahId" = 'wilayah_paser' WHERE "wilayah" = 'PASER';
UPDATE "UnitKerja" SET "wilayahId" = 'wilayah_berau' WHERE "wilayah" = 'BERAU';
UPDATE "UnitKerja" SET "wilayahId" = 'wilayah_samarinda' WHERE "wilayah" = 'SAMARINDA';

-- Add foreign key constraint
ALTER TABLE "UnitKerja" ADD CONSTRAINT "UnitKerja_wilayahId_fkey" FOREIGN KEY ("wilayahId") REFERENCES "WilayahMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add wilayahId column to User table for operators
ALTER TABLE "User" ADD COLUMN "wilayahId" TEXT;

-- Update User with wilayahId based on existing wilayah enum
UPDATE "User" SET "wilayahId" = 'wilayah_balikpapan_ppu' WHERE "wilayah" = 'BALIKPAPAN_PPU';
UPDATE "User" SET "wilayahId" = 'wilayah_kutim_bontang' WHERE "wilayah" = 'KUTIM_BONTANG';
UPDATE "User" SET "wilayahId" = 'wilayah_kukar' WHERE "wilayah" = 'KUKAR';
UPDATE "User" SET "wilayahId" = 'wilayah_kubar_mahulu' WHERE "wilayah" = 'KUBAR_MAHULU';
UPDATE "User" SET "wilayahId" = 'wilayah_paser' WHERE "wilayah" = 'PASER';
UPDATE "User" SET "wilayahId" = 'wilayah_berau' WHERE "wilayah" = 'BERAU';
UPDATE "User" SET "wilayahId" = 'wilayah_samarinda' WHERE "wilayah" = 'SAMARINDA';

-- Add foreign key constraint for User
ALTER TABLE "User" ADD CONSTRAINT "User_wilayahId_fkey" FOREIGN KEY ("wilayahId") REFERENCES "WilayahMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add wilayahId column to Timeline table
ALTER TABLE "Timeline" ADD COLUMN "wilayahId" TEXT;

-- Update Timeline with wilayahId based on existing wilayah enum
UPDATE "Timeline" SET "wilayahId" = 'wilayah_balikpapan_ppu' WHERE "wilayah" = 'BALIKPAPAN_PPU';
UPDATE "Timeline" SET "wilayahId" = 'wilayah_kutim_bontang' WHERE "wilayah" = 'KUTIM_BONTANG';
UPDATE "Timeline" SET "wilayahId" = 'wilayah_kukar' WHERE "wilayah" = 'KUKAR';
UPDATE "Timeline" SET "wilayahId" = 'wilayah_kubar_mahulu' WHERE "wilayah" = 'KUBAR_MAHULU';
UPDATE "Timeline" SET "wilayahId" = 'wilayah_paser' WHERE "wilayah" = 'PASER';
UPDATE "Timeline" SET "wilayahId" = 'wilayah_berau' WHERE "wilayah" = 'BERAU';
UPDATE "Timeline" SET "wilayahId" = 'wilayah_samarinda' WHERE "wilayah" = 'SAMARINDA';

-- Add foreign key constraint for Timeline
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_wilayahId_fkey" FOREIGN KEY ("wilayahId") REFERENCES "WilayahMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "UnitKerja_wilayahId_idx" ON "UnitKerja"("wilayahId");
CREATE INDEX "User_wilayahId_idx" ON "User"("wilayahId");
CREATE INDEX "Timeline_wilayahId_idx" ON "Timeline"("wilayahId");
