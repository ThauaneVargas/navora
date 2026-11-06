-- LGPD (minimização): dados que o app não usa saem do banco, inclusive o que
-- já estava gravado. CPF, data de nascimento e observações (alergias) do
-- cadastro; "o que está acontecendo" informado depois do SOS.
ALTER TABLE "patient_profiles" DROP COLUMN IF EXISTS "patient_code";
ALTER TABLE "patient_profiles" DROP COLUMN IF EXISTS "birth_date";
ALTER TABLE "patient_profiles" DROP COLUMN IF EXISTS "notes";

ALTER TABLE "call_requests" DROP COLUMN IF EXISTS "problems";
ALTER TABLE "call_requests" DROP COLUMN IF EXISTS "problem_note";
