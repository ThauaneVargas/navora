-- Additive migration for navigation structural data.
CREATE TYPE "NavigationNodeType" AS ENUM (
  'ENTRANCE',
  'RECEPTION',
  'ROOM',
  'CORRIDOR',
  'ELEVATOR',
  'BATHROOM',
  'EXIT',
  'OTHER'
);

CREATE TABLE "hospital_areas" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "label" TEXT,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "hospital_areas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "entrances" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "entry_key" TEXT,
  "area_id" INTEGER NOT NULL,
  "navigation_node_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "entrances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sectors" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "floor" TEXT,
  "service_type" TEXT,
  "area_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "navigation_nodes" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "type" "NavigationNodeType" NOT NULL DEFAULT 'OTHER',
  "floor" TEXT,
  "x" DOUBLE PRECISION,
  "y" DOUBLE PRECISION,
  "z" DOUBLE PRECISION,
  "instruction" TEXT,
  "area_id" INTEGER,
  "sector_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "navigation_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "route_edges" (
  "id" SERIAL NOT NULL,
  "from_node_id" INTEGER NOT NULL,
  "to_node_id" INTEGER NOT NULL,
  "distance_meters" DOUBLE PRECISION NOT NULL,
  "accessible" BOOLEAN NOT NULL DEFAULT false,
  "bidirectional" BOOLEAN NOT NULL DEFAULT true,
  "instruction" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "route_edges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "destinations" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "icon" TEXT,
  "category" TEXT NOT NULL,
  "floor" TEXT,
  "distance_label" TEXT,
  "time_label" TEXT,
  "access_level" TEXT NOT NULL DEFAULT 'public',
  "area_id" INTEGER,
  "sector_id" INTEGER,
  "navigation_node_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hospital_areas_code_key" ON "hospital_areas"("code");
CREATE UNIQUE INDEX "entrances_code_key" ON "entrances"("code");
CREATE UNIQUE INDEX "sectors_code_key" ON "sectors"("code");
CREATE UNIQUE INDEX "navigation_nodes_code_key" ON "navigation_nodes"("code");
CREATE UNIQUE INDEX "route_edges_from_node_id_to_node_id_key" ON "route_edges"("from_node_id", "to_node_id");
CREATE UNIQUE INDEX "destinations_code_key" ON "destinations"("code");

ALTER TABLE "entrances" ADD CONSTRAINT "entrances_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "hospital_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entrances" ADD CONSTRAINT "entrances_navigation_node_id_fkey" FOREIGN KEY ("navigation_node_id") REFERENCES "navigation_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "hospital_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "navigation_nodes" ADD CONSTRAINT "navigation_nodes_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "hospital_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "navigation_nodes" ADD CONSTRAINT "navigation_nodes_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "route_edges" ADD CONSTRAINT "route_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "navigation_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "route_edges" ADD CONSTRAINT "route_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "navigation_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "hospital_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_navigation_node_id_fkey" FOREIGN KEY ("navigation_node_id") REFERENCES "navigation_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
