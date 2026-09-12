import React from 'react';
import { Bell, CalendarDays } from 'lucide-react';
import OperatorAvatar from './OperatorAvatar.jsx';

export default function AppTopbar({ role, currentUser, currentPageLabel, notificationCount, onEditProfile }) {
  const firstName = currentUser?.name?.split(' ')[0] || (role === 'admin' ? 'Admin' : 'Recepção');
  const isAdminDashboard = role === 'admin' && currentPageLabel === 'Dashboard';
  const title = isAdminDashboard ? `Olá, ${firstName}!` : currentPageLabel;
  const subtitle = isAdminDashboard
    ? 'Bem-vindo(a) ao painel administrativo do Navora.'
    : role === 'admin'
      ? 'Painel administrativo do Navora.'
      : 'Painel operacional da recepção.';

  return (
    <header className="topbar">
      <div>
        <small>{currentPageLabel}</small>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">
        <div className="operator-chip">
          <b>{currentUser?.roleLabel || (role === 'admin' ? 'Administrador' : 'Recepção')}</b>
          <span><CalendarDays size={14} />{new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <button title="Notificações" aria-label={`${notificationCount} notificações operacionais`}><Bell size={17} />{notificationCount}</button>
        <button className="profile-chip" onClick={onEditProfile} aria-label="Editar perfil do operador">
          <OperatorAvatar user={currentUser} size="sm" />
          <span><b>{currentUser?.name || 'Navora'}</b><small>{currentUser?.roleLabel || (role === 'admin' ? 'Administrador' : 'Recepção')}</small></span>
        </button>
      </div>
    </header>
  );
}
