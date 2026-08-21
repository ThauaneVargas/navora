import React from 'react';

export default function ReportModal({ report, onClose }) {
  if (!report) return null;

  const indicators = [
    ['Pessoas no hospital', report.total_people],
    ['Rotas ativas', report.active_routes],
    ['SOS ativos', report.active_sos],
    ['Pedidos de ajuda', report.help_requests],
    ['Beacons online', report.beacons_online],
    ['Beacons com atenção', report.beacons_attention],
    ['Tempo médio de rota', report.average_route_time],
    ['Resposta recepção', report.average_response_time],
  ];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="report-modal">
        <div className="modal-head">
          <div>
            <p>Relatório Administrativo</p>
            <h2>{report.title}</h2>
            <span>{report.generated_at}</span>
          </div>
          <button onClick={onClose} type="button" aria-label="Fechar">×</button>
        </div>

        <div className="report-indicators">
          {indicators.map(([label, value]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <div className="report-section-grid">
          <div>
            <h3>Resumo de movimentação</h3>
            <p>{report.movement_summary}</p>
            <p><strong>Setor mais movimentado:</strong> {report.busiest_sector}</p>
            <p><strong>Maior número de solicitações:</strong> {report.sector_with_most_calls}</p>
            <p><strong>Rotas acessíveis utilizadas:</strong> {report.accessible_routes_used}</p>
            <p><strong>Alertas críticos:</strong> {report.critical_alerts}</p>
          </div>

          <div>
            <h3>Recomendações operacionais</h3>
            <ul>
              {report.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose} type="button">Fechar</button>
          <button className="primary-inline" type="button">Exportar PDF</button>
        </div>
      </section>
    </div>
  );
}
