import React from 'react';

export default function StatCard({ label, value, detail, tone = 'positive', icon }) {
  return (
    <article className="metric-card">
      <span className="metric-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small className={tone}>{detail}</small>
      </div>
    </article>
  );
}
