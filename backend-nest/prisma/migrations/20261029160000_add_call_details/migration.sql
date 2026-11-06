-- SOS mais completo: telefone de quem pediu, necessidades de acessibilidade
-- (cadeira de rodas, maca...), problemas marcados depois do envio (dor no
-- peito, queda...) e o código secreto (só o hash) com que o celular acompanha
-- o andamento sem precisar de conta.
ALTER TABLE "call_requests" ADD COLUMN "caller_phone" TEXT,
ADD COLUMN "needs" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "problems" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "problem_note" TEXT,
ADD COLUMN "access_token_hash" TEXT;

-- Busca incremental do painel (chamados alterados desde a última consulta).
CREATE INDEX "call_requests_updated_at_idx" ON "call_requests"("updated_at");
