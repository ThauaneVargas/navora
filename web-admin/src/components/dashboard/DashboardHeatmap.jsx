import React from 'react';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function heatLevel(count) {
  if (count <= 5) return 'very-low';
  if (count >= 75) return 'critical';
  if (count >= 45) return 'high';
  if (count >= 18) return 'medium';
  return 'low';
}

export default function DashboardHeatmap({ sectors, nodes = [], floor, onSelect }) {
  const matchesSector = (value, sector) => {
    const target = normalizeText(value);
    return Boolean(target && [sector.code, sector.name, sector.areaName].some((item) => normalizeText(item) === target));
  };
  const sectorNodes = (sector) => {
    const embeddedNodes = (sector.navigationNodes || []).filter((node) => Number.isFinite(Number(node.x)) && Number.isFinite(Number(node.y)));
    const mapNodes = nodes.filter((node) => {
      const nodeSector = node.sector || {};
      return (
        Number.isFinite(Number(node.x)) &&
        Number.isFinite(Number(node.y)) &&
        (nodeSector.id === sector.id || nodeSector.code === sector.code || matchesSector(nodeSector.name || nodeSector.code, sector))
      );
    });
    return [...embeddedNodes, ...mapNodes].filter((node, index, all) => {
      const key = node.id || node.code || `${node.x}-${node.y}-${index}`;
      return all.findIndex((candidate) => (candidate.id || candidate.code || `${candidate.x}-${candidate.y}-${index}`) === key) === index;
    });
  };
  const blockPositionFromNodes = (sectorNodeList) => {
    if (!sectorNodeList.length) return null;
    const xs = sectorNodeList.map((node) => Number(node.x));
    const ys = sectorNodeList.map((node) => Number(node.y));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const w = Math.max(12, Math.min(26, maxX - minX + 12));
    const h = Math.max(12, Math.min(22, maxY - minY + 12));
    return {
      x: Math.max(3, Math.min(95 - w, centerX - w / 2)),
      y: Math.max(5, Math.min(94 - h, centerY - h / 2)),
      w,
      h,
    };
  };
  const mappedSectors = sectors
    .map((sector) => ({ sector, nodes: sectorNodes(sector) }))
    .map((item) => ({ ...item, position: blockPositionFromNodes(item.nodes) }))
    .filter((item) => item.position);
  const hasMappedFloor = sectors.length > 0 && mappedSectors.length > 0;

  return (
    <div className="heatmap">
      <header className="heatmap-head">
        <div>
          <span>Mapa de calor</span>
          <b>Movimentacao por setor</b>
          {floor?.title ? <small className="heatmap-floor-name">{floor.title}</small> : null}
        </div>
        <em>{sectors.reduce((total, sector) => total + sector.peopleCount, 0)} pessoas monitoradas</em>
      </header>
      <div className={`hospital-map schematic-map ${hasMappedFloor ? '' : 'unmapped'}`}>
        <div className="flow-legend" aria-label="Legenda de fluxo de pessoas">
          <b>Fluxo de pessoas</b>
          <span><i className="critical" />Muito alto</span>
          <span><i className="high" />Alto</span>
          <span><i className="medium" />Medio</span>
          <span><i className="low" />Baixo</span>
          <span><i className="very-low" />Muito baixo</span>
        </div>
        {hasMappedFloor ? (
          <>
            <div className="map-corridor corridor-main" />
            <div className="map-corridor corridor-cross-a" />
            <div className="map-corridor corridor-cross-b" />
            {mappedSectors.map(({ sector, position }) => {
              const level = heatLevel(sector.peopleCount);
              return (
                <button
                  key={sector.id}
                  className={`map-sector-block ${level}`}
                  style={{
                    '--x': `${position.x}%`,
                    '--y': `${position.y}%`,
                    '--w': `${position.w}%`,
                    '--h': `${position.h}%`,
                    '--heat-size': `${Math.max(70, Math.min(142, 56 + sector.peopleCount * 0.9))}px`,
                  }}
                  onClick={() => onSelect(sector)}
                  aria-label={`${sector.name}, ${sector.peopleCount} pessoas, fluxo ${sector.flow}`}
                >
                  <span className="sector-glow" />
                  <span className="sector-copy">
                    <b>{sector.name}</b>
                    <small>{sector.peopleCount} pessoas</small>
                  </span>
                </button>
              );
            })}
          </>
        ) : (
          <div className="floor-empty-state compact">
            <h3>Mapeamento deste andar ainda não disponível.</h3>
            <p>Os setores serão exibidos após a configuração estrutural.</p>
          </div>
        )}
      </div>
      <div className="heatmap-legend">
        <span><i className="low" />Pouco fluxo</span>
        <span><i className="medium" />Fluxo medio</span>
        <span><i className="high" />Fluxo alto</span>
        <span><i className="critical" />Lotacao critica</span>
        <span><i className="very-low" />Muito baixo</span>
      </div>
    </div>
  );
}
