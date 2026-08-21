import { Injectable } from '@nestjs/common';
import {
  Beacon,
  CallRequest,
  CallStatus,
  CallType,
  Priority,
  VisitorAccessRequest,
  VisitorAccessStatus,
} from '../common/domain';

@Injectable()
export class MemoryStoreService {
  private callId = 2;
  private visitorAccessId = 2;

  readonly calls: CallRequest[] = [
    {
      id: 1,
      user_type: 'patient',
      user_name: 'Mariana Souza',
      area: 'private',
      area_name: 'HMC Private',
      patient_name: 'Mariana Souza',
      call_type: CallType.SOS,
      reason: 'SOS paciente Private pendente',
      location: 'Recepcao Private',
      sector: 'Recepcao Private',
      beacon_code: 'MBM04-02',
      message: 'SOS paciente Private pendente',
      priority: Priority.CRITICAL,
      status: CallStatus.PENDING,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_type: 'visitor',
      user_name: 'Visitante SUS',
      area: 'sus',
      area_name: 'Hospital Marco Capute',
      patient_name: 'Visitante SUS',
      call_type: CallType.HELP,
      reason: 'Pedido de ajuda visitante SUS pendente',
      location: 'Recepcao Hospital Marco Capute',
      sector: 'Recepcao Hospital Marco Capute',
      beacon_code: 'MBM04-11',
      message: 'Pedido de ajuda visitante SUS pendente',
      priority: Priority.MEDIUM,
      status: CallStatus.PENDING,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  readonly visitorAccessRequests: VisitorAccessRequest[] = [
    {
      id: 1,
      visitor_name: 'Maria Souza',
      area_id: 'private',
      area: 'HMC Private',
      area_name: 'HMC Private',
      entrance: 'Entrada pelos fundos',
      entry: 'Entrada pelos fundos',
      current_location: 'Entrada Private',
      current_beacon: 'MBM04-01',
      requested_destination: 'Visita / Internacao Private',
      reason: 'Visitar paciente',
      accessibility: 'Nao',
      status: VisitorAccessStatus.PENDING,
      beacon: 'MBM04-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      visitor_name: 'Joao Lima',
      area_id: 'sus',
      area: 'Hospital Marco Capute',
      area_name: 'Hospital Marco Capute',
      entrance: 'Entrada pela frente',
      entry: 'Entrada pela frente',
      current_location: 'Recepcao Hospital Marco Capute',
      current_beacon: 'MBM04-11',
      requested_destination: 'Visita / Internacao Hospital Marco Capute',
      reason: 'Acompanhar paciente',
      accessibility: 'Sim',
      status: VisitorAccessStatus.APPROVED,
      beacon: 'MBM04-11',
      permission_minutes: 30,
      authorized_route: 'Recepcao Hospital Marco Capute -> rota autorizada -> destino',
      allowed_route: 'Recepcao Hospital Marco Capute -> rota autorizada -> destino',
      allowed_time: '30 minutos',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  readonly beacons: Beacon[] = [
    this.beacon(1, 'MBM04-01', 'Entrada Private', 'private', 'HMC Private', 'Entrada pelos fundos', 'Entrada Private', 92),
    this.beacon(2, 'MBM04-02', 'Recepcao Private', 'private', 'HMC Private', 'Recepcao Private', 'Recepcao Private', 88),
    this.beacon(3, 'MBM04-10', 'Entrada Hospital Marco Capute', 'sus', 'Hospital Marco Capute', 'Entrada pela frente', 'Entrada Hospital Marco Capute', 90),
    this.beacon(4, 'MBM04-11', 'Recepcao Hospital Marco Capute', 'sus', 'Hospital Marco Capute', 'Recepcao Hospital Marco Capute', 'Recepcao Hospital Marco Capute', 84),
    this.beacon(5, 'MBM04-20', 'Corredor compartilhado', 'shared', 'Compartilhado', 'Corredor compartilhado', 'Corredor compartilhado', 70),
  ];

  nextCallId() {
    this.callId += 1;
    return this.callId;
  }

  nextVisitorAccessId() {
    this.visitorAccessId += 1;
    return this.visitorAccessId;
  }

  private beacon(id: number, code: string, name: string, area: string, areaName: string, location: string, sector: string, battery: number): Beacon {
    return {
      id,
      code,
      name,
      area,
      area_name: areaName,
      location,
      sector,
      battery,
      status: 'Online',
      last_signal_at: new Date().toISOString(),
    };
  }
}
