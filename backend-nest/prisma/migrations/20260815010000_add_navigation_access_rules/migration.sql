-- Navigation access decision rules.
CREATE TYPE "AccessSubject" AS ENUM (
  'PATIENT',
  'VISITOR',
  'EXTERNAL_PATIENT'
);

CREATE TYPE "AccessDecision" AS ENUM (
  'ALLOW',
  'BLOCK',
  'REQUIRE_AUTHORIZATION',
  'REDIRECT_TO_RECEPTION'
);

CREATE TYPE "AccessRuleScope" AS ENUM (
  'GLOBAL',
  'AREA',
  'SECTOR',
  'DESTINATION',
  'CATEGORY',
  'ACCESS_LEVEL'
);

ALTER TABLE "visitor_access_requests"
  ADD COLUMN "destination_id" INTEGER,
  ADD COLUMN "authorized_at" TIMESTAMP(3),
  ADD COLUMN "expires_at" TIMESTAMP(3),
  ADD COLUMN "finished_at" TIMESTAMP(3);

CREATE TABLE "access_rules" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "subject" "AccessSubject" NOT NULL,
  "scope" "AccessRuleScope" NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "area_id" INTEGER,
  "sector_id" INTEGER,
  "destination_id" INTEGER,
  "category" TEXT,
  "access_level" TEXT,
  "decision" "AccessDecision",
  "message" TEXT,
  "fallback_destination_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "access_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "access_windows" (
  "id" SERIAL NOT NULL,
  "rule_id" INTEGER NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  "days_of_week" INTEGER[] NOT NULL,
  "inside_decision" "AccessDecision" NOT NULL,
  "outside_decision" "AccessDecision" NOT NULL,
  "inside_message" TEXT,
  "outside_message" TEXT,
  "fallback_destination_id" INTEGER,

  CONSTRAINT "access_windows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "access_rules_code_key" ON "access_rules"("code");
CREATE INDEX "access_rules_enabled_subject_idx" ON "access_rules"("enabled", "subject");
CREATE INDEX "access_rules_scope_priority_idx" ON "access_rules"("scope", "priority");
CREATE INDEX "access_rules_area_id_idx" ON "access_rules"("area_id");
CREATE INDEX "access_rules_sector_id_idx" ON "access_rules"("sector_id");
CREATE INDEX "access_rules_destination_id_idx" ON "access_rules"("destination_id");
CREATE INDEX "access_rules_category_idx" ON "access_rules"("category");
CREATE INDEX "access_rules_access_level_idx" ON "access_rules"("access_level");
CREATE INDEX "access_windows_rule_id_idx" ON "access_windows"("rule_id");
CREATE INDEX "visitor_access_requests_destination_id_idx" ON "visitor_access_requests"("destination_id");
CREATE INDEX "visitor_access_requests_status_expires_at_idx" ON "visitor_access_requests"("status", "expires_at");

ALTER TABLE "visitor_access_requests" ADD CONSTRAINT "visitor_access_requests_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_rules" ADD CONSTRAINT "access_rules_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "hospital_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_rules" ADD CONSTRAINT "access_rules_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_rules" ADD CONSTRAINT "access_rules_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_rules" ADD CONSTRAINT "access_rules_fallback_destination_id_fkey" FOREIGN KEY ("fallback_destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_windows" ADD CONSTRAINT "access_windows_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "access_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_windows" ADD CONSTRAINT "access_windows_fallback_destination_id_fkey" FOREIGN KEY ("fallback_destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
