-- Legacy foundation tables that predate the navigation foundation migration.
CREATE TYPE "CallType" AS ENUM (
  'HELP',
  'HELP_REQUEST',
  'SOS',
  'DOCTOR',
  'LOST',
  'MOBILITY_HELP',
  'LOST_USER'
);

CREATE TYPE "CallStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'TEAM_DISPATCHED',
  'IN_PROGRESS',
  'CLOSED',
  'CANCELED'
);

CREATE TYPE "Priority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "VisitorAccessStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'DENIED',
  'CANCELED',
  'EXPIRED',
  'WAITING_AUTHORIZATION',
  'AUTHORIZED',
  'IN_ROUTE',
  'ARRIVED',
  'OFF_ROUTE',
  'FINISHED'
);

CREATE TABLE "call_requests" (
  "id" SERIAL NOT NULL,
  "user_type" TEXT NOT NULL DEFAULT 'patient',
  "user_name" TEXT NOT NULL DEFAULT 'Paciente Navora',
  "area" TEXT NOT NULL DEFAULT 'private',
  "area_name" TEXT NOT NULL DEFAULT 'HMC Private',
  "patient_name" TEXT NOT NULL,
  "call_type" "CallType" NOT NULL,
  "reason" TEXT,
  "location" TEXT NOT NULL,
  "sector" TEXT NOT NULL,
  "beacon_code" TEXT,
  "message" TEXT,
  "status" "CallStatus" NOT NULL DEFAULT 'PENDING',
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "call_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "visitor_access_requests" (
  "id" SERIAL NOT NULL,
  "visitor_name" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "area_name" TEXT NOT NULL DEFAULT 'HMC Private',
  "entrance" TEXT NOT NULL DEFAULT 'Entrada pelos fundos',
  "area_id" TEXT NOT NULL,
  "entry" TEXT NOT NULL,
  "current_location" TEXT NOT NULL,
  "current_beacon" TEXT,
  "requested_destination" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "accessibility" TEXT NOT NULL DEFAULT 'Nao',
  "status" "VisitorAccessStatus" NOT NULL DEFAULT 'PENDING',
  "beacon" TEXT,
  "permission_minutes" INTEGER,
  "authorized_route" TEXT,
  "denied_reason" TEXT,
  "allowed_route" TEXT,
  "allowed_time" TEXT,
  "release_type" TEXT,
  "denial_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "visitor_access_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "beacons" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT '',
  "area" TEXT NOT NULL DEFAULT 'shared',
  "area_name" TEXT NOT NULL DEFAULT 'Compartilhado',
  "location" TEXT NOT NULL DEFAULT '',
  "battery" INTEGER NOT NULL DEFAULT 100,
  "sector" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Online',
  "last_signal_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "beacons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "beacons_code_key" ON "beacons"("code");
