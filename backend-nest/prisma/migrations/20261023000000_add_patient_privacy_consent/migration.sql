-- LGPD: registro do consentimento do paciente (data + versão da política).
ALTER TABLE "patient_profiles" ADD COLUMN "privacy_consent_at" TIMESTAMP(3),
ADD COLUMN "privacy_policy_version" TEXT;
