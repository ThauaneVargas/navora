CREATE TABLE "patient_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "patient_code" TEXT,
    "birth_date" TIMESTAMP(3),
    "accessibility" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "patient_profiles_user_id_key" ON "patient_profiles"("user_id");

CREATE UNIQUE INDEX "patient_profiles_patient_code_key" ON "patient_profiles"("patient_code");

ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
