-- Separacao por hospital (multi-hospital) + registro de auditoria da equipe.
--
-- Tudo o que ja existe no banco e do HMC: a migration cria o hospital "hmc",
-- liga todos os registros a ele e so depois torna hospital_id obrigatorio.
-- Codigos (beacon, setor, destino...) passam a ser unicos POR hospital.

-- 1. Hospitais
CREATE TABLE "hospitals" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hospitals_code_key" ON "hospitals"("code");

INSERT INTO "hospitals" ("code", "name") VALUES ('hmc', 'Hospital Marco Capute');
-- O Prisma preenche updated_at sozinho; o DEFAULT so serviu para o INSERT acima.
ALTER TABLE "hospitals" ALTER COLUMN "updated_at" DROP DEFAULT;

-- 2. Coluna hospital_id: cria vazia, preenche com o HMC, torna obrigatoria.
ALTER TABLE "users" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "call_requests" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "visitor_access_requests" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "check_ins" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "operational_messages" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "beacons" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "hospital_areas" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "entrances" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "sectors" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "navigation_nodes" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "destinations" ADD COLUMN "hospital_id" INTEGER;
ALTER TABLE "access_rules" ADD COLUMN "hospital_id" INTEGER;

UPDATE "users" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "call_requests" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "visitor_access_requests" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "check_ins" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "operational_messages" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "beacons" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "hospital_areas" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "entrances" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "sectors" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "navigation_nodes" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "destinations" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');
UPDATE "access_rules" SET "hospital_id" = (SELECT "id" FROM "hospitals" WHERE "code" = 'hmc');

ALTER TABLE "call_requests" ALTER COLUMN "hospital_id" SET NOT NULL;
ALTER TABLE "visitor_access_requests" ALTER COLUMN "hospital_id" SET NOT NULL;
ALTER TABLE "check_ins" ALTER COLUMN "hospital_id" SET NOT NULL;
ALTER TABLE "operational_messages" ALTER COLUMN "hospital_id" SET NOT NULL;
ALTER TABLE "beacons" ALTER COLUMN "hospital_id" SET NOT NULL;
ALTER TABLE "hospital_areas" ALTER COLUMN "hospital_id" SET NOT NULL;
ALTER TABLE "entrances" ALTER COLUMN "hospital_id" SET NOT NULL;
ALTER TABLE "sectors" ALTER COLUMN "hospital_id" SET NOT NULL;
ALTER TABLE "navigation_nodes" ALTER COLUMN "hospital_id" SET NOT NULL;
ALTER TABLE "destinations" ALTER COLUMN "hospital_id" SET NOT NULL;
ALTER TABLE "access_rules" ALTER COLUMN "hospital_id" SET NOT NULL;

-- Funcionario sem hospital veria... nada, mas nao deve nem existir.
ALTER TABLE "users" ADD CONSTRAINT "users_staff_requires_hospital"
    CHECK ("role" = 'PATIENT' OR "hospital_id" IS NOT NULL);

-- 3. Chaves estrangeiras
ALTER TABLE "users" ADD CONSTRAINT "users_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "call_requests" ADD CONSTRAINT "call_requests_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "visitor_access_requests" ADD CONSTRAINT "visitor_access_requests_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "operational_messages" ADD CONSTRAINT "operational_messages_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "beacons" ADD CONSTRAINT "beacons_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hospital_areas" ADD CONSTRAINT "hospital_areas_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entrances" ADD CONSTRAINT "entrances_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "navigation_nodes" ADD CONSTRAINT "navigation_nodes_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "access_rules" ADD CONSTRAINT "access_rules_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Codigos unicos por hospital (antes: unicos no banco inteiro)
DROP INDEX "beacons_code_key";
DROP INDEX "beacons_ibeacon_uuid_ibeacon_major_ibeacon_minor_key";
DROP INDEX "hospital_areas_code_key";
DROP INDEX "entrances_code_key";
DROP INDEX "sectors_code_key";
DROP INDEX "navigation_nodes_code_key";
DROP INDEX "destinations_code_key";
DROP INDEX "access_rules_code_key";

CREATE UNIQUE INDEX "beacons_hospital_id_code_key" ON "beacons"("hospital_id", "code");
CREATE UNIQUE INDEX "beacons_hospital_id_ibeacon_uuid_ibeacon_major_ibeacon_mino_key" ON "beacons"("hospital_id", "ibeacon_uuid", "ibeacon_major", "ibeacon_minor");
CREATE UNIQUE INDEX "hospital_areas_hospital_id_code_key" ON "hospital_areas"("hospital_id", "code");
CREATE UNIQUE INDEX "entrances_hospital_id_code_key" ON "entrances"("hospital_id", "code");
CREATE UNIQUE INDEX "sectors_hospital_id_code_key" ON "sectors"("hospital_id", "code");
CREATE UNIQUE INDEX "navigation_nodes_hospital_id_code_key" ON "navigation_nodes"("hospital_id", "code");
CREATE UNIQUE INDEX "destinations_hospital_id_code_key" ON "destinations"("hospital_id", "code");
CREATE UNIQUE INDEX "access_rules_hospital_id_code_key" ON "access_rules"("hospital_id", "code");

-- 5. Indices de consulta (o painel sempre filtra pelo hospital)
DROP INDEX "call_requests_updated_at_idx";
CREATE INDEX "call_requests_hospital_id_updated_at_idx" ON "call_requests"("hospital_id", "updated_at");
CREATE INDEX "users_hospital_id_idx" ON "users"("hospital_id");
CREATE INDEX "visitor_access_requests_hospital_id_created_at_idx" ON "visitor_access_requests"("hospital_id", "created_at");
CREATE INDEX "check_ins_hospital_id_created_at_idx" ON "check_ins"("hospital_id", "created_at");
CREATE INDEX "operational_messages_hospital_id_created_at_idx" ON "operational_messages"("hospital_id", "created_at");

-- 6. Auditoria das acoes da equipe (LGPD art. 37)
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_hospital_id_created_at_idx" ON "audit_logs"("hospital_id", "created_at");
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Registro de auditoria nao se edita: nem a API nem um SQL manual reescrevem
-- o que alguem fez. (DELETE continua possivel, para o prazo de guarda.)
CREATE OR REPLACE FUNCTION navora_prevent_audit_update() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Registros de auditoria nao podem ser alterados (registro %).', OLD."id"
        USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_logs_prevent_update"
    BEFORE UPDATE ON "audit_logs"
    FOR EACH ROW EXECUTE FUNCTION navora_prevent_audit_update();
