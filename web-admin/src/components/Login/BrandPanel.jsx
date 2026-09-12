import React from 'react';
import { BarChart3, HeartPulse, MapPinned, Sparkles } from 'lucide-react';
import NavoraBrand from '../branding/NavoraBrand.jsx';
import FeatureItem from './FeatureItem.jsx';

const features = [
  {
    icon: MapPinned,
    title: 'Navegação inteligente',
    description: 'Rotas otimizadas em tempo real dentro do hospital.',
  },
  {
    icon: HeartPulse,
    title: 'SOS em tempo real',
    description: 'Alertas instantâneos e localização precisa para emergências.',
  },
  {
    icon: BarChart3,
    title: 'Gestão e relatórios',
    description: 'Dashboards completos para decisões rápidas e estratégicas.',
  },
  {
    icon: Sparkles,
    title: 'Experiência integrada',
    description: 'Recepção, pacientes e administração em um só fluxo.',
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
            Inteligência que guia.
            <br />
            Tecnologia que cuida.
          </h1>
          <p>
            Plataforma inteligente de navegação indoor, assistência e gestão hospitalar.
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
