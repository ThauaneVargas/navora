import React from 'react';

const profiles = [
  { key: 'admin', label: 'Administrador' },
  { key: 'reception', label: 'Recepção' },
];

export default function ProfileSwitch({ value, onChange }) {
  return (
    <div className="profile-switch" role="tablist" aria-label="Perfil de acesso">
      {profiles.map((profile) => (
        <button
          key={profile.key}
          type="button"
          role="tab"
          aria-selected={value === profile.key}
          className={value === profile.key ? 'active' : ''}
          onClick={() => onChange(profile.key)}
        >
          {profile.label}
        </button>
      ))}
    </div>
  );
}
