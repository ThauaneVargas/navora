ALTER TABLE "beacons" ADD COLUMN "navigation_node_id" INTEGER;

ALTER TABLE "beacons"
ADD CONSTRAINT "beacons_navigation_node_id_fkey"
FOREIGN KEY ("navigation_node_id") REFERENCES "navigation_nodes"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
