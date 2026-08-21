-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('WAITING', 'IN_ROUTE', 'IN_SERVICE', 'FINISHED', 'CANCELED');

-- CreateTable
CREATE TABLE "check_ins" (
    "id" SERIAL NOT NULL,
    "patient_name" TEXT NOT NULL,
    "document" TEXT,
    "destination_label" TEXT NOT NULL,
    "accessibility" TEXT NOT NULL DEFAULT 'Nao',
    "observations" TEXT,
    "status" "CheckInStatus" NOT NULL DEFAULT 'WAITING',
    "user_id" INTEGER,
    "destination_id" INTEGER,
    "sector_id" INTEGER,
    "visitor_access_request_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_visitor_access_request_id_fkey" FOREIGN KEY ("visitor_access_request_id") REFERENCES "visitor_access_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
