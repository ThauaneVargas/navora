-- AlterTable
ALTER TABLE "beacons" ADD COLUMN     "hardware_model" TEXT,
ADD COLUMN     "ibeacon_major" INTEGER,
ADD COLUMN     "ibeacon_minor" INTEGER,
ADD COLUMN     "ibeacon_uuid" TEXT,
ADD COLUMN     "measured_power" INTEGER;
