import React from 'react';

export default function FeatureItem({ icon, title, description }) {
  return (
    <article className="login-feature">
      <span className="login-feature-icon">{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}
