-- CreateIndex
CREATE UNIQUE INDEX "beacons_ibeacon_uuid_ibeacon_major_ibeacon_minor_key" ON "beacons"("ibeacon_uuid", "ibeacon_major", "ibeacon_minor");

