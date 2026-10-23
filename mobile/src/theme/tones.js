// Cores de destaque por item (Home, Menu, Ajuda): fundo suave + ícone colorido,
// pra as listas de atalhos não ficarem todas iguais. "wine" (ou tom
// desconhecido) usa o bordô do tema. SOS não entra aqui: usa appColors.danger.

const TONES = {
  blue: { light: '#2768B7', dark: '#7FB2FF' },
  teal: { light: '#0F7F7B', dark: '#5ED3CD' },
  amber: { light: '#A85F00', dark: '#F6B93B' },
  violet: { light: '#6247B0', dark: '#B8A4FF' },
  green: { light: '#167A45', dark: '#5BD691' },
};

export function toneColors(tone, appColors, isDark) {
  const palette = TONES[tone];
  if (!palette) {
    return { fg: appColors.primary, bg: appColors.iconBg, ring: appColors.border };
  }
  const fg = isDark ? palette.dark : palette.light;
  // Sufixo hex = transparência (1F ≈ 12%, 33 ≈ 20%).
  return { fg, bg: `${fg}1F`, ring: `${fg}33` };
}
