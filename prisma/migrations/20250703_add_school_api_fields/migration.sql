-- AlterTable
ALTER TABLE "UnitKerja" ADD COLUMN "kabupaten" TEXT,
                        ADD COLUMN "provinsi" TEXT,
                        ADD COLUMN "latitude" DOUBLE PRECISION,
                        ADD COLUMN "longitude" DOUBLE PRECISION,
                        ADD COLUMN "bentukSekolah" TEXT,
                        ADD COLUMN "statusSekolah" TEXT,
                        ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
