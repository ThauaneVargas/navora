-- Paciente logado que abriu o chamado (nulo = enviado sem conta, pelo
-- "Acesso rápido" ou por visitante). Ajuda a recepção a reconhecer trote.
-- Excluir a conta do paciente (LGPD) apaga o vínculo, não o chamado.
ALTER TABLE "call_requests" ADD COLUMN "user_id" INTEGER;
CREATE INDEX "call_requests_user_id_idx" ON "call_requests"("user_id");
ALTER TABLE "call_requests" ADD CONSTRAINT "call_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
