export enum CallType {
  HELP = 'HELP',
  HELP_REQUEST = 'HELP_REQUEST',
  SOS = 'SOS',
  DOCTOR = 'DOCTOR',
  LOST = 'LOST',
  MOBILITY_HELP = 'MOBILITY_HELP',
  LOST_USER = 'LOST_USER',
}

export enum CallStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  TEAM_DISPATCHED = 'TEAM_DISPATCHED',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum VisitorAccessStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
  WAITING_AUTHORIZATION = 'WAITING_AUTHORIZATION',
  AUTHORIZED = 'AUTHORIZED',
  IN_ROUTE = 'IN_ROUTE',
  ARRIVED = 'ARRIVED',
  OFF_ROUTE = 'OFF_ROUTE',
  FINISHED = 'FINISHED',
}

export type CallRequest = {
  id: number;
  user_type: string;
  user_name: string;
  area: string;
  area_name: string;
  patient_name: string;
  call_type: CallType;
  reason: string;
  location: string;
  sector: string;
  beacon_code?: string | null;
  message?: string | null;
  status: CallStatus;
  priority: Priority;
  created_at: string;
  updated_at: string;
};

export type VisitorAccessRequest = {
  id: number;
  visitor_name: string;
  area: string;
  area_name: string;
  entrance: string;
  area_id: string;
  entry: string;
  current_location: string;
  current_beacon?: string | null;
  requested_destination: string;
  reason: string;
  accessibility: string;
  status: VisitorAccessStatus;
  beacon?: string | null;
  permission_minutes?: number | null;
  authorized_route?: string | null;
  denied_reason?: string | null;
  allowed_route?: string | null;
  allowed_time?: string | null;
  release_type?: string | null;
  denial_reason?: string | null;
  created_at: string;
  updated_at: string;
};

export type Beacon = {
  id: number;
  code: string;
  name: string;
  area: string;
  area_name: string;
  location: string;
  battery: number;
  sector: string;
  status: string;
  last_signal_at: string;
};
