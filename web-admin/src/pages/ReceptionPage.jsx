import React from 'react';
import StatCard from '../components/StatCard.jsx';

const metrics = [
  { label: 'Check-ins Hoje', value: '56', detail: '+18% vs ontem', icon: 'C' },
  { label: 'Pacientes Esperando', value: '12', detail: 'Na recepção', icon: 'P' },
  { label: 'Pedidos de Ajuda', value: '8', detail: 'Aguardando atendimento', icon: 'A' },
  { label: 'SOS Ativos', value: '3', detail: '2 críticos', tone: 'danger', icon: 'S' },
];

const calls = [
  {
    type: 'SOS Emergência',
    patient: 'Maria Oliveira',
    location: 'Setor de Imagem — Corredor Principal',
    time: '14:32',
    priority: 'Alta',
    priorityTone: 'alta',
    status: 'Pendente',
  },
  {
    type: 'Pedido de Ajuda',
    patient: 'João Santos',
    location: 'Recepção — Entrada Principal',
    time: '14:20',
    priority: 'Média',
    priorityTone: 'media',
    status: 'Em análise',
  },
  {
    type: 'Ajuda de Locomoção',
    patient: 'Ana Costa',
    location: 'Ultrassonografia 01 — Ala B',
    time: '13:58',
    priority: 'Média',
    priorityTone: 'media',
    status: 'Aguardando equipe',
  },
];

const appointments = [
  { patient: 'Carlos Eduardo', sector: 'Ortopedia', status: 'Em consulta' },
  { patient: 'Fernanda Costa', sector: 'Dermatologia', status: 'Em atendimento' },
  { patient: 'Lucas Martins', sector: 'Clínico Geral', status: 'Aguardando retorno' },
];

export default function ReceptionPage() {
  return (
    <div className="dashboard-stack">
      <section className="metric-grid">
        {metrics.map((metric) => (
          <StatCard key={metric.label} tone="positive" {...metric} />
        ))}
      </section>

      <section className="reception-main-grid">
        <article className="panel-card calls-panel">
          <div className="panel-title-row">
            <h2>Chamados Recebidos</h2>
            <button className="select-button" type="button">Prioridade</button>
          </div>

          <div className="calls-table">
            {calls.map((call) => (
              <article className="call-row reception-call-row" key={`${call.type}-${call.patient}`}>
                <div>
                  <span className="call-type">{call.type}</span>
                  <strong>{call.patient}</strong>
                </div>
                <div>
                  <small>Localização</small>
                  <span>{call.location}</span>
                </div>
                <div>
                  <small>Horário</small>
                  <span>{call.time}</span>
                </div>
                <div>
                  <small>Prioridade</small>
                  <em className={`priority-${call.priorityTone}`}>{call.priority}</em>
                </div>
                <div>
                  <small>Status</small>
                  <span>{call.status}</span>
                </div>
                <div className="call-actions">
                  <button type="button">Aceitar</button>
                  <button type="button">Acionar equipe</button>
                  <button type="button" className="ghost-button">Encerrar</button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="side-stack">
          <article className="panel-card appointment-panel">
            <h2>Atendimentos em Andamento</h2>
            {appointments.map((item) => (
              <div className="appointment-row" key={item.patient}>
                <span className="appointment-icon">P</span>
                <div>
                  <strong>{item.patient}</strong>
                  <small>{item.sector}</small>
                </div>
                <em>{item.status}</em>
              </div>
            ))}
          </article>

          <article className="panel-card flow-panel">
            <h2>Fluxo da Recepção</h2>
            <div className="flow-status">
              <span>Status atual</span>
              <strong>Médio</strong>
            </div>
            <div className="flow-status">
              <span>Tempo médio de espera</span>
              <strong>15 min</strong>
            </div>
            <div className="flow-meter" aria-label="Indicador visual de fluxo médio">
              <span />
              <span className="active" />
              <span />
            </div>
            <div className="flow-labels">
              <small>baixo</small>
              <small>médio</small>
              <small>alto</small>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
