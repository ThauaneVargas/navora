-- Regra de seguranca do Web Admin:
-- Funcionarios (usuarios RECEPTION/ADMIN) NUNCA sao excluidos do sistema.
-- Eles sao apenas desativados (users.active = false), o que bloqueia o acesso
-- a plataforma mas preserva o historico do que fizeram (autorizacoes,
-- recusas de visitantes, ativacoes/desativacoes de outros usuarios etc.).

-- CreateEnum
CREATE TYPE "UserStatusAction" AS ENUM ('DEACTIVATED', 'REACTIVATED');

-- AlterTable: dados da desativacao atual do usuario
ALTER TABLE "users" ADD COLUMN "deactivated_at" TIMESTAMP(3),
ADD COLUMN "deactivated_by_id" INTEGER;

-- AlterTable: quem decidiu (autorizou/negou) cada solicitacao de visitante
ALTER TABLE "visitor_access_requests" ADD COLUMN "decided_at" TIMESTAMP(3),
ADD COLUMN "decided_by_id" INTEGER;

-- CreateTable: historico de ativacoes/desativacoes
CREATE TABLE "user_status_changes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" "UserStatusAction" NOT NULL,
    "reason" TEXT,
    "performed_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_status_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_status_changes_user_id_idx" ON "user_status_changes"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deactivated_by_id_fkey" FOREIGN KEY ("deactivated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_status_changes" ADD CONSTRAINT "user_status_changes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_status_changes" ADD CONSTRAINT "user_status_changes_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_access_requests" ADD CONSTRAINT "visitor_access_requests_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Protecao no banco: bloqueia DELETE de funcionarios, mesmo fora da API
-- (Prisma Studio, scripts, SQL manual).
CREATE OR REPLACE FUNCTION navora_prevent_staff_user_delete() RETURNS trigger AS $$
BEGIN
    IF OLD."role" IN ('RECEPTION', 'ADMIN') THEN
        RAISE EXCEPTION 'Funcionarios nao podem ser excluidos (usuario %). Desative o usuario (active = false).', OLD."id"
            USING ERRCODE = 'P0001';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "users_prevent_staff_delete"
    BEFORE DELETE ON "users"
    FOR EACH ROW EXECUTE FUNCTION navora_prevent_staff_user_delete();

-- Impede contornar a regra rebaixando um funcionario para PATIENT e depois excluindo.
CREATE OR REPLACE FUNCTION navora_prevent_staff_role_downgrade() RETURNS trigger AS $$
BEGIN
    IF OLD."role" IN ('RECEPTION', 'ADMIN') AND NEW."role" NOT IN ('RECEPTION', 'ADMIN') THEN
        RAISE EXCEPTION 'Funcionarios nao podem virar pacientes (usuario %). Desative o usuario (active = false).', OLD."id"
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "users_prevent_staff_role_downgrade"
    BEFORE UPDATE OF "role" ON "users"
    FOR EACH ROW EXECUTE FUNCTION navora_prevent_staff_role_downgrade();

-- O perfil profissional (cargo, setor) tambem faz parte do historico.
CREATE OR REPLACE FUNCTION navora_prevent_staff_profile_delete() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Perfis de funcionarios nao podem ser excluidos (perfil %). Desative o usuario.', OLD."id"
        USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "staff_profiles_prevent_delete"
    BEFORE DELETE ON "staff_profiles"
    FOR EACH ROW EXECUTE FUNCTION navora_prevent_staff_profile_delete();
