import { Injectable } from '@nestjs/common';

type InstructionNode = {
  code: string;
  label: string;
  type: string;
  floor: string | null;
  z: number | null;
  instruction: string | null;
};

type InstructionEdge = {
  distanceMeters?: number | null;
  instruction: string | null;
};

@Injectable()
export class NavigationInstructionsService {
  generateSteps(nodes: InstructionNode[], edges: InstructionEdge[]) {
    if (nodes.length === 0) return [];

    if (nodes.length === 1) {
      return [this.arrivalStep(1, nodes[0])];
    }

    const steps = edges.map((edge, index) => {
      const fromNode = nodes[index];
      const toNode = nodes[index + 1];
      const floorChanged = this.floorChanged(fromNode, toNode);

      return {
        index: index + 1,
        instruction: floorChanged
          ? this.floorChangeInstruction(fromNode, toNode, edge)
          : this.movementInstruction(toNode, edge),
        distance: edge.distanceMeters ?? 0,
        floor: toNode.floor,
        node_code: toNode.code,
        type: floorChanged ? 'FLOOR_CHANGE' : toNode.type,
      };
    });

    steps.push(this.arrivalStep(steps.length + 1, nodes[nodes.length - 1]));
    return steps;
  }

  private movementInstruction(toNode: InstructionNode, edge: InstructionEdge) {
    if (edge.instruction?.trim()) return edge.instruction.trim();
    if (toNode.instruction?.trim()) return toNode.instruction.trim();

    if (toNode.type === 'CORRIDOR') {
      return `Siga ate ${toNode.label}.`;
    }

    return `Prossiga ate ${toNode.label}.`;
  }

  private floorChangeInstruction(fromNode: InstructionNode, toNode: InstructionNode, edge: InstructionEdge) {
    const direction = (toNode.z ?? 0) > (fromNode.z ?? 0) ? 'Suba' : 'Desca';
    const targetFloor = toNode.floor ?? 'o proximo piso';
    const sourceInstruction = edge.instruction ?? toNode.instruction ?? '';
    const usesElevator = sourceInstruction.toLowerCase().includes('elevador') || toNode.type === 'ELEVATOR';

    if (usesElevator) {
      return `Use o elevador e ${direction.toLowerCase()} ate ${targetFloor}.`;
    }

    return `${direction} ate ${targetFloor}.`;
  }

  private arrivalStep(index: number, node: InstructionNode) {
    return {
      index,
      instruction: `Voce chegou ao destino: ${node.label}.`,
      distance: 0,
      floor: node.floor,
      node_code: node.code,
      type: 'ARRIVAL',
    };
  }

  private floorChanged(fromNode: InstructionNode, toNode: InstructionNode) {
    if (fromNode.floor !== toNode.floor) return true;
    return (fromNode.z ?? null) !== (toNode.z ?? null);
  }
}
