import React from 'react';

export default function FeatureItem({ icon, title, description }) {
  const Icon = icon;
  return (
    <article className="login-feature">
      <span className="login-feature-icon">{Icon ? <Icon size={19} /> : null}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}
