-- Os beacons físicos são Feasycom FSC-BP104D: os códigos internos MBM04-xx
-- (de antes do hardware real) passam a ser FSC-xx. O corredor só simulado
-- vira SIM-20. Também grava a identidade iBeacon dos 4 aparelhos, pra a
-- detecção por uuid/major/minor funcionar sem precisar rodar o seed
-- (ex.: produção). Ver docs/beacons-configuracao.md.

UPDATE "beacons" SET "code" = 'FSC-01' WHERE "code" = 'MBM04-01';
UPDATE "beacons" SET "code" = 'FSC-02' WHERE "code" = 'MBM04-02';
UPDATE "beacons" SET "code" = 'FSC-10' WHERE "code" = 'MBM04-10';
UPDATE "beacons" SET "code" = 'FSC-11' WHERE "code" = 'MBM04-11';
UPDATE "beacons" SET "code" = 'SIM-20' WHERE "code" = 'MBM04-20';

UPDATE "beacons" SET "hardware_model" = 'Feasycom FSC-BP104D',
  "ibeacon_uuid" = '7f3c2a91-5b4e-4d8a-9c61-2e8b0d5f4a17', "ibeacon_major" = 1, "ibeacon_minor" = 10
  WHERE "code" = 'FSC-01' AND "ibeacon_uuid" IS NULL;
UPDATE "beacons" SET "hardware_model" = 'Feasycom FSC-BP104D',
  "ibeacon_uuid" = '7f3c2a91-5b4e-4d8a-9c61-2e8b0d5f4a17', "ibeacon_major" = 1, "ibeacon_minor" = 20
  WHERE "code" = 'FSC-02' AND "ibeacon_uuid" IS NULL;
UPDATE "beacons" SET "hardware_model" = 'Feasycom FSC-BP104D',
  "ibeacon_uuid" = '7f3c2a91-5b4e-4d8a-9c61-2e8b0d5f4a17', "ibeacon_major" = 2, "ibeacon_minor" = 10
  WHERE "code" = 'FSC-10' AND "ibeacon_uuid" IS NULL;
UPDATE "beacons" SET "hardware_model" = 'Feasycom FSC-BP104D',
  "ibeacon_uuid" = '7f3c2a91-5b4e-4d8a-9c61-2e8b0d5f4a17', "ibeacon_major" = 2, "ibeacon_minor" = 20
  WHERE "code" = 'FSC-11' AND "ibeacon_uuid" IS NULL;

-- Referências em texto (histórico de chamados e de visitas).
UPDATE "call_requests" SET "beacon_code" = CASE "beacon_code"
  WHEN 'MBM04-01' THEN 'FSC-01' WHEN 'MBM04-02' THEN 'FSC-02'
  WHEN 'MBM04-10' THEN 'FSC-10' WHEN 'MBM04-11' THEN 'FSC-11'
  WHEN 'MBM04-20' THEN 'SIM-20' END
  WHERE "beacon_code" IN ('MBM04-01', 'MBM04-02', 'MBM04-10', 'MBM04-11', 'MBM04-20');
UPDATE "visitor_access_requests" SET "current_beacon" = CASE "current_beacon"
  WHEN 'MBM04-01' THEN 'FSC-01' WHEN 'MBM04-02' THEN 'FSC-02'
  WHEN 'MBM04-10' THEN 'FSC-10' WHEN 'MBM04-11' THEN 'FSC-11'
  WHEN 'MBM04-20' THEN 'SIM-20' END
  WHERE "current_beacon" IN ('MBM04-01', 'MBM04-02', 'MBM04-10', 'MBM04-11', 'MBM04-20');
UPDATE "visitor_access_requests" SET "beacon" = CASE "beacon"
  WHEN 'MBM04-01' THEN 'FSC-01' WHEN 'MBM04-02' THEN 'FSC-02'
  WHEN 'MBM04-10' THEN 'FSC-10' WHEN 'MBM04-11' THEN 'FSC-11'
  WHEN 'MBM04-20' THEN 'SIM-20' END
  WHERE "beacon" IN ('MBM04-01', 'MBM04-02', 'MBM04-10', 'MBM04-11', 'MBM04-20');
