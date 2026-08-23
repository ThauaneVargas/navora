import React from 'react';
import { HeartPulse, HelpCircle, Search, UserCheck } from 'lucide-react';

function AlertBadge({ value, tone }) {
  return <em className={`status-badge ${tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'neutral'}`}>{value}</em>;
}

function EmptyState({ text }) {
  return <div className="empty-state"><Search size={20} /><span>{text}</span></div>;
}

export default function RecentAlerts({ visitors, calls }) {
  const visitorAlerts = visitors
    .filter((visitor) => visitor.status === 'Aguardando autorizacao')
    .slice(0, 3)
    .map((visitor) => ({
      id: `visitor-${visitor.id}`,
      type: 'Visitante aguardando',
      person: visitor.name,
      location: visitor.requestedDestination,
      time: visitor.onlineTime,
      status: visitor.status,
      tone: 'info',
      Icon: UserCheck,
    }));
  const callAlerts = calls.slice(0, 5).map((call) => ({
    id: `call-${call.id}`,
    type: call.type,
    person: call.patient,
    location: call.location,
    time: call.createdAt,
    status: call.priority,
    tone: call.type === 'SOS Emergencia' || call.priority === 'Critica' ? 'danger' : 'warning',
    Icon: call.type === 'SOS Emergencia' ? HeartPulse : HelpCircle,
  }));
  const items = [...callAlerts, ...visitorAlerts].slice(0, 6);

  if (!items.length) return <EmptyState text="Nenhum alerta recente." />;

  return (
    <div className="alert-list">
      {items.map(({ id, type, person, location, time, status, tone, Icon }) => (
        <article className={`recent-alert ${tone}`} key={id}>
          <span className="alert-icon"><Icon size={18} /></span>
          <div>
            <b>{type}</b>
            <strong>{person}</strong>
            <small>{location} - {time}</small>
          </div>
          <AlertBadge value={status} tone={tone} />
        </article>
      ))}
    </div>
  );
}
