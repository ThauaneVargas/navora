import React from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import NavoraBrand from '../branding/NavoraBrand.jsx';
import OperatorAvatar from './OperatorAvatar.jsx';

export default function AppSidebar({ role, currentUser, currentPage, navItems, onNavigate, onLogout, onEditProfile }) {
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate(role === 'admin' ? 'admin-dashboard' : 'reception-dashboard')} aria-label="Ir para o painel inicial">
        <NavoraBrand role={role} variant="sidebar" />
      </button>
      <nav>
        {navItems.map(([id, label, Icon]) => (
          <button key={id} className={currentPage === id ? 'active' : ''} onClick={() => onNavigate(id)} aria-current={currentPage === id ? 'page' : undefined}>
            <span aria-hidden="true"><Icon size={18} /></span>{label}
          </button>
        ))}
      </nav>
      <button className="side-profile" onClick={onEditProfile} aria-label="Editar meu perfil">
        <OperatorAvatar user={currentUser} />
        <div>
          <b>{currentUser?.name || (role === 'admin' ? 'Administrador Navora' : 'Recepcao Navora')}</b>
          <small>{currentUser?.roleLabel || (role === 'admin' ? 'Administrador' : 'Recepcao')}</small>
          <em className="online-dot">Online</em>
        </div>
      </button>
      <button className="logout" onClick={onLogout}><LogOut size={16} />Sair do sistema</button>
      <div className="secure-card">
        <ShieldCheck size={24} />
        <b>Sessao protegida</b>
        <small>Seus dados estao seguros nesta sessao.</small>
      </div>
    </aside>
  );
}
