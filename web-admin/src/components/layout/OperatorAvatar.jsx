import React from 'react';

function getInitials(name = 'Navora') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'NV';
}

export default function OperatorAvatar({ user, size = 'md' }) {
  const initials = getInitials(user?.name || 'Navora');

  return (
    <span className={`operator-avatar ${size}`} aria-label={`Usuario ${user?.name || 'Navora'}`}>
      {user?.avatarDataUrl ? <img src={user.avatarDataUrl} alt="" /> : initials}
    </span>
  );
}
