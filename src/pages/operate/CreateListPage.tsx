import React from 'react';

export default function CreateListPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <i className="ti ti-clipboard-check" style={{ fontSize: 64, color: '#5CA6D9' }} />
      <p style={{ fontSize: 32, fontWeight: 700, color: '#5CA6D9', margin: 0 }}>Create a New List Here</p>
    </div>
  );
}
