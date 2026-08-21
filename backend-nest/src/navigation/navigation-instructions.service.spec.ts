import { strict as assert } from 'node:assert';
import { NavigationNodeType } from '@prisma/client';
import { NavigationInstructionsService } from './navigation-instructions.service';

const service = new NavigationInstructionsService();

function node(overrides: Record<string, any>) {
  return {
    code: overrides.code,
    label: overrides.label,
    type: overrides.type ?? NavigationNodeType.ROOM,
    floor: overrides.floor ?? 'Piso Terreo',
    z: overrides.z ?? 0,
    instruction: overrides.instruction ?? null,
  };
}

function edge(overrides: Record<string, any> = {}) {
  return {
    distanceMeters: overrides.distanceMeters ?? 10,
    instruction: overrides.instruction ?? null,
  };
}

function run() {
  const corridor = service.generateSteps(
    [
      node({ code: 'entry', label: 'Entrada', type: NavigationNodeType.ENTRANCE }),
      node({ code: 'corridor-a', label: 'Corredor A', type: NavigationNodeType.CORRIDOR }),
    ],
    [edge({ distanceMeters: 15 })],
  );
  assert.equal(corridor[0].instruction, 'Siga ate Corredor A.', 'corredor usa fallback especifico');
  assert.equal(corridor[0].type, NavigationNodeType.CORRIDOR);

  const explicitEdge = service.generateSteps(
    [
      node({ code: 'entry', label: 'Entrada' }),
      node({ code: 'reception', label: 'Recepcao', instruction: 'Instrucao do node.' }),
    ],
    [edge({ instruction: 'Instrucao da edge.' })],
  );
  assert.equal(explicitEdge[0].instruction, 'Instrucao da edge.', 'instrucao explicita da edge tem prioridade');

  const explicitNode = service.generateSteps(
    [
      node({ code: 'entry', label: 'Entrada' }),
      node({ code: 'reception', label: 'Recepcao', instruction: 'Instrucao do node.' }),
    ],
    [edge()],
  );
  assert.equal(explicitNode[0].instruction, 'Instrucao do node.', 'instrucao do node e segunda prioridade');

  const fallback = service.generateSteps(
    [
      node({ code: 'entry', label: 'Entrada' }),
      node({ code: 'room', label: 'Sala 1' }),
    ],
    [edge()],
  );
  assert.equal(fallback[0].instruction, 'Prossiga ate Sala 1.', 'edge sem texto usa fallback neutro');

  const floorChange = service.generateSteps(
    [
      node({ code: 'corridor', label: 'Corredor', floor: 'Piso Terreo', z: 0 }),
      node({ code: 'visit', label: 'Internacao', floor: '1o Andar', z: 1 }),
    ],
    [edge({ instruction: 'Use o elevador para acessar internacao.' })],
  );
  assert.equal(floorChange[0].type, 'FLOOR_CHANGE', 'mudanca de andar gera tipo especifico');
  assert.equal(floorChange[0].instruction, 'Use o elevador e suba ate 1o Andar.');

  assert.equal(fallback.at(-1)?.instruction, 'Voce chegou ao destino: Sala 1.', 'ultimo step e destino final');
  assert.equal(fallback.at(-1)?.type, 'ARRIVAL');

  const singleNode = service.generateSteps([node({ code: 'room', label: 'Sala 1' })], []);
  assert.equal(singleNode.length, 1, 'rota de um unico node gera apenas chegada');
  assert.equal(singleNode[0].instruction, 'Voce chegou ao destino: Sala 1.');

  console.log('navigation instructions tests passed');
}

run();
