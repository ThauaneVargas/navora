import React from 'react';

export default function StatCard({ title, value, detail, tone = 'info', icon: Icon, onClick }) {
  return (
    <button className={`stat-card ${tone}`} onClick={onClick}>
      {Icon ? <span className="stat-icon" aria-hidden="true"><Icon size={20} /></span> : null}
      <span className="stat-label">{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </button>
  );
}
