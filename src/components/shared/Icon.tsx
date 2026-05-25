import React from 'react';

export function Icon({ path, size = 20, color = 'currentColor' }: {
  path: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d={path} />
    </svg>
  );
}
