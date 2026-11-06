import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Ícones próprios do cabeçalho e das abas (viewBox 24x24, traço arredondado).
// Abas: inativa = só contorno; ativa = sólido na cor da aba, com os detalhes
// internos "vazados" na cor de fundo (detailColor).

const STROKE = 1.8;

export function MenuIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 7h15" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M4.5 12h10" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M4.5 17h15" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function BellIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.6a5.4 5.4 0 0 0-5.4 5.4v3.3c0 .9-.3 1.7-.9 2.4l-.8.9c-.6.7-.1 1.7.8 1.7h12.6c.9 0 1.4-1 .8-1.7l-.8-.9c-.6-.7-.9-1.5-.9-2.4V9A5.4 5.4 0 0 0 12 3.6Z"
        fill={color}
        fillOpacity={0.14}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path d="M9.9 19.6a2.3 2.3 0 0 0 4.2 0" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

const solid = (active, color) => (active ? color : 'none');

function HomeIcon({ color, active, detailColor }) {
  return (
    <>
      <Path
        d="M4 10.4 12 4l8 6.4V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19v-8.6Z"
        fill={solid(active, color)}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path
        d="M9.6 20.6v-4.8a1 1 0 0 1 1-1h2.8a1 1 0 0 1 1 1v4.8"
        stroke={active ? detailColor : color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function NavigateIcon({ color, active }) {
  return (
    <Path
      d="M12 3.4 19.3 19.6a.6.6 0 0 1-.8.8L12 17l-6.5 3.4a.6.6 0 0 1-.8-.8L12 3.4Z"
      fill={solid(active, color)}
      stroke={color}
      strokeWidth={STROKE}
      strokeLinejoin="round"
    />
  );
}

function AssistantIcon({ color, active }) {
  return (
    <>
      <Path
        d="M11 3.5c.7 4.6 2.6 6.5 7.2 7.2-4.6.7-6.5 2.6-7.2 7.2-.7-4.6-2.6-6.5-7.2-7.2 4.6-.7 6.5-2.6 7.2-7.2Z"
        fill={solid(active, color)}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <Path
        d="M18.6 15.4c.25 1.4.9 2 2.3 2.3-1.4.25-2.05.9-2.3 2.3-.25-1.4-.9-2.05-2.3-2.3 1.4-.3 2.05-.9 2.3-2.3Z"
        fill={solid(active, color)}
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </>
  );
}

function HelpIcon({ color, active, detailColor }) {
  const inner = active ? detailColor : color;
  return (
    <>
      <Circle cx={12} cy={12} r={8.4} fill={solid(active, color)} stroke={color} strokeWidth={STROKE} />
      <Circle cx={12} cy={12} r={3.4} fill={active ? detailColor : 'none'} stroke={inner} strokeWidth={STROKE} />
      <Path
        d="M6.1 6.1l3.5 3.5M14.4 9.6l3.5-3.5M14.4 14.4l3.5 3.5M9.6 14.4l-3.5 3.5"
        stroke={inner}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </>
  );
}

function ProfileIcon({ color, active }) {
  return (
    <>
      <Circle cx={12} cy={8.4} r={3.9} fill={solid(active, color)} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M4.6 19.7c.8-3.6 3.8-5.6 7.4-5.6s6.6 2 7.4 5.6a.9.9 0 0 1-.9 1.1H5.5a.9.9 0 0 1-.9-1.1Z"
        fill={solid(active, color)}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </>
  );
}

const TAB_ICONS = {
  home: HomeIcon,
  navigate: NavigateIcon,
  assistant: AssistantIcon,
  help: HelpIcon,
  profile: ProfileIcon,
};

export function TabIcon({ name, color, active = false, detailColor = '#FFFFFF', size = 22 }) {
  const Icon = TAB_ICONS[name] || HomeIcon;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Icon color={color} active={active} detailColor={detailColor} />
    </Svg>
  );
}
