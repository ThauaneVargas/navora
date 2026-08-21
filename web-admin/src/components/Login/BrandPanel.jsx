import React from 'react';
import FeatureItem from './FeatureItem.jsx';

const features = [
  {
    icon: 'R',
    title: 'Navegacao inteligente',
    description: 'Rotas otimizadas em tempo real dentro do hospital.',
  },
  {
    icon: 'S',
    title: 'SOS em tempo real',
    description: 'Alertas instantaneos e localizacao precisa para emergencias.',
  },
  {
    icon: 'D',
    title: 'Gestao e relatorios',
    description: 'Dashboards completos para decisoes rapidas e estrategicas.',
  },
  {
    icon: 'I',
    title: 'Experiencia humanizada',
    description: 'Tecnologia a servico de pacientes, familiares e equipes.',
  },
];

export default function BrandPanel() {
  return (
    <section className="brand-panel" aria-label="Apresentacao Navora">
      <div className="brand-route" />
      <div className="brand-orbit orbit-one" />
      <div className="brand-orbit orbit-two" />

      <div className="brand-panel-content">
        <div className="brand-logo">NAVORA</div>

        <div className="brand-copy">
          <h1>
            Inteligencia que guia.
            <br />
            Tecnologia que cuida.
          </h1>
          <p>
            Plataforma inteligente de navegacao indoor, assistencia e gestao hospitalar.
          </p>
        </div>

        <div className="feature-list">
          {features.map((feature) => (
            <FeatureItem key={feature.title} {...feature} />
          ))}
        </div>

        <div className="ai-card">
          <span>IA</span>
          <div>
            <strong>IA Navora</strong>
            <small>Sempre com voce</small>
          </div>
        </div>
      </div>
    </section>
  );
}
