// Admin palette used by the API Keys screens, matching the other admin pages in this repo.

import type { CSSProperties } from 'react';

export const C = {
  text: '#35353B',
  text2: '#757677',
  text3: '#9BA0B0',
  border: '#CCCDD0',
  borderSoft: '#E0E1E3',
  surface: '#ffffff',
  app: '#F7F7FA',
  inset: '#F1F2F4',
  primary: '#5CA6D9',
  primaryHover: '#2C82BD',
  primaryWeak: '#E9F6FF',
  primaryText: '#1F6FA8',
  danger: '#D64545',
  dangerHover: '#B42323',
  dangerBg: '#FBE7E7',
  dangerText: '#A82E2E',
  successBg: '#E3F5EA',
  successText: '#1F7A45',
  warnBg: '#FDF3DC',
  warnText: '#8A5A00',
  supportBg: '#EFEAFB',
  supportText: '#5B3FB0',
  supportBorder: '#D8CDF3',
};

export const inputStyle = (invalid?: boolean): CSSProperties => ({
  height: 36,
  width: '100%',
  borderRadius: 4,
  border: `1px solid ${invalid ? C.danger : C.border}`,
  padding: '0 10px',
  color: C.text,
  backgroundColor: C.surface,
  outline: 'none',
});
