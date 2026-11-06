-- Dados do grupo que o app do visitante já coletava (acompanhantes, total de
-- pessoas, código da visita, pedido de assistência). Antes o backend recusava
-- esses campos (400) e o pedido nunca chegava à recepção.
ALTER TABLE "visitor_access_requests" ADD COLUMN "companions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "group_total" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "visit_code" TEXT,
ADD COLUMN "assistance_request" TEXT;
