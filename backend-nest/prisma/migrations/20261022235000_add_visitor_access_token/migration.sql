-- Código secreto (só o hash) pra o visitante ler o próprio pedido sem conta.
ALTER TABLE "visitor_access_requests" ADD COLUMN "access_token_hash" TEXT;
