import React, { useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import ReportModal from '../components/ReportModal.jsx';

const metrics = [
  { label: 'Pessoas no Hospital', value: '1.248', detail: '+12% em relação a hoje cedo', tone: 'positive', icon: 'P' },
  { label: 'Alertas SOS Ativos', value: '3', detail: '2 críticos', tone: 'danger', icon: 'S' },
  { label: 'Rotas Ativas', value: '86', detail: '+8% em relação a ontem', tone: 'positive', icon: 'R' },
  { label: 'Beacons Online', value: '142', detail: '98% da rede ativa', tone: 'positive', icon: 'B' },
];

const alerts = [
  { title: 'SOS Crítico', local: 'Setor de Imagem • 1º Andar', time: '2 min atrás', tone: 'critical' },
  { title: 'SOS Moderado', local: 'Laboratório • Térreo', time: '8 min atrás', tone: 'moderate' },
  { title: 'SOS Crítico', local: 'Elevador • 2º Andar', time: '15 min atrás', tone: 'critical' },
];

export default function AdminPage() {
  const [report, setReport] = useState(null);

  const generateAdminReport = () => {
    setReport({
      title: 'Relatório Operacional Navora',
      generated_at: new Date().toLocaleString('pt-BR'),
      total_people: '1.248',
      active_routes: '86',
      active_sos: '3',
      help_requests: '8',
      beacons_online: '142',
      beacons_attention: '1',
      busiest_sector: 'Recepção Principal',
      sector_with_most_calls: 'Setor de Imagem',
      average_route_time: '3 min',
      average_response_time: '4 min',
      accessible_routes_used: '37',
      critical_alerts: '2',
      movement_summary:
        'Fluxo elevado na recepção e concentração de deslocamentos no Setor de Imagem entre 14h e 16h.',
      recommendations: [
        'Reforçar equipe no Setor de Imagem.',
        'Verificar beacon MBM04-03 com instabilidade.',
        'Sugerir rota alternativa para Recepção Principal em horários de pico.',
        'Monitorar chamados de locomoção.',
        'Revisar tempo médio de resposta para SOS crítico.',
      ],
    });
  };

  return (
    <div className="dashboard-stack">
      <section className="metric-grid admin-metrics">
        {metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel-card heatmap-panel">
          <div className="panel-title-row">
            <h2>Mapa de Calor (Movimentação)</h2>
            <button className="select-button" type="button">1º Andar</button>
          </div>

          <div className="heatmap-wrap">
            <div className="scale">
              <span>Alta</span>
              <i />
              <span>Baixa</span>
            </div>
            <div className="floor-map">
              {Array.from({ length: 30 }).map((_, index) => (
                <span key={index} className="room-cell" />
              ))}
              <span className="heat heat-one" />
              <span className="heat heat-two" />
              <span className="heat heat-three" />
              <span className="heat heat-four" />
              <span className="heat heat-five" />
            </div>
          </div>

          <p className="live-note">Dados atualizados em tempo real</p>
        </article>

        <article className="panel-card alerts-panel">
          <div className="panel-title-row">
            <h2>Alertas SOS Recentes</h2>
            <button className="link-button" type="button">Ver todos</button>
          </div>

          <div className="alert-list">
            {alerts.map((alert) => (
              <div className={`alert-row ${alert.tone}`} key={`${alert.title}-${alert.time}`}>
                <span className="alert-icon">SOS</span>
                <div>
                  <strong>{alert.title}</strong>
                  <small>{alert.local}</small>
                </div>
                <time>{alert.time}</time>
              </div>
            ))}
          </div>

          <button className="primary-wide" type="button">Ver todos os alertas</button>
        </article>
      </section>

      <section className="panel-card report-panel">
        <div>
          <h2>Relatório Administrativo</h2>
          <p>Gere uma visão operacional consolidada para gestão hospitalar, beacons, rotas e chamados.</p>
        </div>
        <button className="primary-inline" type="button" onClick={generateAdminReport}>
          Gerar relatório
        </button>
      </section>

      <ReportModal report={report} onClose={() => setReport(null)} />
    </div>
  );
}
