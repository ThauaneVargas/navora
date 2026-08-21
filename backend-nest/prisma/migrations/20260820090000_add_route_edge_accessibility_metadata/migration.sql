CREATE TYPE "RouteType" AS ENUM (
  'CORRIDOR',
  'ELEVATOR',
  'RAMP',
  'STAIRS',
  'DOOR',
  'TRANSFER'
);

ALTER TABLE "route_edges"
  ADD COLUMN "route_type" "RouteType" NOT NULL DEFAULT 'CORRIDOR',
  ADD COLUMN "wheelchair_accessible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "stretcher_accessible" BOOLEAN NOT NULL DEFAULT true;
