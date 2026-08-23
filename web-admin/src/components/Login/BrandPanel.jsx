import React from 'react';
import { BarChart3, HeartPulse, MapPinned, Sparkles } from 'lucide-react';
import NavoraBrand from '../branding/NavoraBrand.jsx';
import FeatureItem from './FeatureItem.jsx';

const features = [
  {
    icon: MapPinned,
    title: 'Navegacao inteligente',
    description: 'Rotas otimizadas em tempo real dentro do hospital.',
  },
  {
    icon: HeartPulse,
    title: 'SOS em tempo real',
    description: 'Alertas instantaneos e localizacao precisa para emergencias.',
  },
  {
    icon: BarChart3,
    title: 'Gestao e relatorios',
    description: 'Dashboards completos para decisoes rapidas e estrategicas.',
  },
  {
    icon: Sparkles,
    title: 'Experiencia integrada',
    description: 'Recepcao, pacientes e administracao em um so fluxo.',
  },
];

export default function BrandPanel() {
  return (
    <section className="brand-panel" aria-label="Apresentacao Navora">
      <div className="brand-route" />
      <div className="brand-orbit orbit-one" />
      <div className="brand-orbit orbit-two" />

      <div className="brand-panel-content">
        <NavoraBrand variant="login" tone="light" showRole={false} />

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
      </div>
    </section>
  );
}
