-- Add forgot password and Google login fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" TEXT UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token" TEXT UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_expires" TIMESTAMP(3);
