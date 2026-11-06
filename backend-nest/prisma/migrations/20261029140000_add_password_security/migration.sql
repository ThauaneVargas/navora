-- Momento da última troca de senha: tokens emitidos antes disso deixam de
-- valer (quem estava logado com a senha antiga é desconectado).
ALTER TABLE "users" ADD COLUMN "password_changed_at" TIMESTAMP(3),
-- Tentativas erradas do código de recuperação (6 dígitos): na 5ª o código é descartado.
ADD COLUMN "password_reset_attempts" INTEGER NOT NULL DEFAULT 0;
