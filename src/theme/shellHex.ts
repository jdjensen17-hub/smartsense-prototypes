/**
 * Shell hex constants — UA (Universal App) and SmartSense ONE
 * shell colors that have no @joltup/colors equivalent.
 * Source: ~/Projects/universal repo, validated May 2026.
 * Do not add values here without documenting the source.
 */
export const SHELL_HEX = {
  // UA blue500 — list header bg, primary interactive blue in
  // mobile chrome. Universal repo: theme.colors.blue500
  listHeaderBlue: '#0078C8',

  // SmartSense ONE shell — scraped from live app May 2026
  appName: '#35353B',
  structuralBorder: '#CCCDD0',
  mutedText: '#6B7280',
  lightText: '#9BA0B0',
  interactiveBorder: '#BABABA',
  navActive: '#5CA6D9',

  // Translucent white — hover/active on dark backgrounds
  // (PDF viewer header, find bar). No @joltup/colors equivalent.
  translucentWhiteHover: 'rgba(255,255,255,0.12)',
} as const;
