import React from 'react';

export default function Sidebar({ mode, items, activeView, onChangeView, user, role }) {
  return (
    <aside className="sidebar">
      <button className="brand-word" onClick={() => onChangeView(mode)} type="button">
        NAVORA
      </button>

      <nav className="nav-list" aria-label="Áreas do painel">
        {items.map((item, index) => (
          <button
            key={item}
            className={`nav-button ${index === 0 ? 'active' : ''}`}
            onClick={() => {
              if (item === 'Visão Geral') onChangeView('admin');
              if (item === 'Painel Recepção') onChangeView('reception');
            }}
            type="button"
          >
            <span className="nav-glyph">{index + 1}</span>
            {item}
          </button>
        ))}
      </nav>

      <div className="sidebar-switch">
        <button
          className={activeView === 'admin' ? 'active' : ''}
          onClick={() => onChangeView('admin')}
          type="button"
        >
          Administrador
        </button>
        <button
          className={activeView === 'reception' ? 'active' : ''}
          onClick={() => onChangeView('reception')}
          type="button"
        >
          Recepção
        </button>
      </div>

      <div className="profile-chip">
        <span className="avatar">{user.slice(0, 1)}</span>
        <div>
          <strong>{user}</strong>
          <small>{role}</small>
        </div>
      </div>
    </aside>
  );
}
