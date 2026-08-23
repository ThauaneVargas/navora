import React from 'react';
import navoraSymbol from '../../assets/navora_symbol.png';

const roleLabels = {
  admin: 'Administracao',
  reception: 'Recepcao',
};

export default function NavoraBrand({
  role = 'admin',
  variant = 'sidebar',
  tone = 'dark',
  showRole = true,
  showName = true,
  className = '',
}) {
  const roleLabel = roleLabels[role] || roleLabels.admin;
  const label = showRole ? `Navora ${roleLabel}` : 'Navora';

  return (
    <span className={`navora-brand navora-brand--${variant} navora-brand--${tone} ${className}`.trim()} aria-label={label}>
      <span className="navora-brand__mark" aria-hidden="true">
        <img src={navoraSymbol} alt="" />
      </span>
      {showName ? (
        <span className="navora-brand__copy">
          <span className="navora-brand__name">NAVORA</span>
          {showRole ? <span className="navora-brand__role">{roleLabel}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
