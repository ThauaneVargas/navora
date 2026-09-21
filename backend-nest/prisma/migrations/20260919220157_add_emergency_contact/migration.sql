-- DropForeignKey
ALTER TABLE "access_windows" DROP CONSTRAINT "access_windows_rule_id_fkey";

-- DropIndex
DROP INDEX "access_rules_access_level_idx";

-- DropIndex
DROP INDEX "access_rules_area_id_idx";

-- DropIndex
DROP INDEX "access_rules_category_idx";

-- DropIndex
DROP INDEX "access_rules_destination_id_idx";

-- DropIndex
DROP INDEX "access_rules_enabled_subject_idx";

-- DropIndex
DROP INDEX "access_rules_scope_priority_idx";

-- DropIndex
DROP INDEX "access_rules_sector_id_idx";

-- DropIndex
DROP INDEX "access_windows_rule_id_idx";

-- DropIndex
DROP INDEX "visitor_access_requests_destination_id_idx";

-- DropIndex
DROP INDEX "visitor_access_requests_status_expires_at_idx";

-- AlterTable
ALTER TABLE "call_requests" ADD COLUMN     "emergency_contact" TEXT;

-- AlterTable
ALTER TABLE "patient_profiles" ADD COLUMN     "emergency_contact" TEXT;

-- AddForeignKey
ALTER TABLE "access_windows" ADD CONSTRAINT "access_windows_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "access_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
