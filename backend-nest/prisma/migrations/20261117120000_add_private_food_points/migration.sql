-- Lanchonete e ponto de café do HMC Private (planta enviada pela usuária em
-- 17/11/2026): lanchonete de comida fresca ao lado da recepção principal e
-- ponto de autoatendimento (geladeira com lanches e café) perto da recepção do
-- lado direito. Igual ao prisma/seed.ts, para entrar na produção sem rodar o
-- seed. Idempotente: não duplica se o seed já tiver criado. Posições e
-- distâncias são estimativas — conferir no hospital.

INSERT INTO "navigation_nodes" ("code", "label", "type", "floor", "x", "y", "z", "instruction", "area_id", "sector_id", "updated_at")
SELECT v.code, v.label, 'ROOM'::"NavigationNodeType", 'Piso Terreo', v.x, v.y, 0, v.instruction,
       (SELECT "id" FROM "hospital_areas" WHERE "code" = 'private'),
       (SELECT "id" FROM "sectors" WHERE "code" = 'private-services'),
       CURRENT_TIMESTAMP
FROM (VALUES
  ('private-lanchonete', 'Lanchonete', 28::double precision, 64::double precision, 'A lanchonete fica ao lado da recepcao principal.'),
  ('private-cafe', 'Cafe e lanches (autoatendimento)', 70::double precision, 74::double precision, 'O ponto de cafe fica perto da recepcao do lado direito.')
) AS v(code, label, x, y, instruction)
WHERE EXISTS (SELECT 1 FROM "hospital_areas" WHERE "code" = 'private')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "route_edges" ("from_node_id", "to_node_id", "distance_meters", "accessible", "route_type", "wheelchair_accessible", "stretcher_accessible", "bidirectional", "instruction", "updated_at")
SELECT f."id", t."id", v.distance, true, 'CORRIDOR'::"RouteType", true, true, true, v.instruction, CURRENT_TIMESTAMP
FROM (VALUES
  ('private-reception', 'private-lanchonete', 15::double precision, 'A lanchonete fica ao lado da recepcao principal.'),
  ('corridor-a', 'private-cafe', 25::double precision, 'Siga pelo corredor principal ate a recepcao do lado direito.')
) AS v(from_code, to_code, distance, instruction)
JOIN "navigation_nodes" f ON f."code" = v.from_code
JOIN "navigation_nodes" t ON t."code" = v.to_code
ON CONFLICT ("from_node_id", "to_node_id") DO NOTHING;

INSERT INTO "destinations" ("code", "name", "icon", "category", "floor", "distance_label", "time_label", "access_level", "area_id", "sector_id", "navigation_node_id", "updated_at")
SELECT v.code, v.name, v.icon, 'Alimentacao', 'Piso Terreo', v.distance_label, '1 min', 'public',
       (SELECT "id" FROM "hospital_areas" WHERE "code" = 'private'),
       (SELECT "id" FROM "sectors" WHERE "code" = 'private-services'),
       n."id",
       CURRENT_TIMESTAMP
FROM (VALUES
  ('private-lanchonete', 'Lanchonete', 'food-outline', '15 m'),
  ('private-cafe', 'Café e lanches (autoatendimento)', 'coffee-outline', '45 m')
) AS v(code, name, icon, distance_label)
JOIN "navigation_nodes" n ON n."code" = v.code
ON CONFLICT ("code") DO NOTHING;
