-- CreateTable
CREATE TABLE "operational_messages" (
    "id" SERIAL NOT NULL,
    "recipient" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Media',
    "direction" TEXT NOT NULL DEFAULT 'Enviada',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_messages_pkey" PRIMARY KEY ("id")
);
