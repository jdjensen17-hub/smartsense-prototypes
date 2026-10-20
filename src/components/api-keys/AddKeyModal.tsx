import { useState } from 'react';
import { Info, Key } from 'lucide-react';
import { NAME_MAX, apiKeys, partnerTag, type ApiKey } from '@/data/apiKeys';
import { IconBadge, Modal } from './Modal';
import { Button, Code, FieldError, FieldLabel, Help, KindChip, SourcePill } from './ui';
import { C, inputStyle } from './tokens';

/** B2 — name the key, preview the Task source and tag, then create it. */
export function AddKeyModal({
  initialName = '',
  initialNotes = '',
  initialError = null,
  replaces = null,
  onClose,
  onCreated,
}: {
  initialName?: string;
  initialNotes?: string;
  initialError?: string | null;
  /** Set when this key reconnects a partner whose key was revoked. */
  replaces?: ApiKey | null;
  onClose: () => void;
  onCreated: (result: { key: ApiKey; token: string }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(initialError);

  function create() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a key name.');
      return;
    }
    if (trimmed.length > NAME_MAX) {
      setError(`Use ${NAME_MAX} characters or fewer.`);
      return;
    }
    if (apiKeys.nameTaken(trimmed)) {
      setError('A key with this name already exists.');
      return;
    }
    onCreated(apiKeys.create({ name: trimmed, notes, replacesKeyId: replaces?.id }));
  }

  return (
    <Modal
      icon={<IconBadge tone="info"><Key size={18} strokeWidth={1.8} /></IconBadge>}
      title={replaces ? 'Create replacement key' : 'Add API key'}
      subtitle={
        replaces
          ? `Reconnect ${replaces.name} with a new key. The revoked key keeps its own history.`
          : 'Name it after the partner or system that will use it.'
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={create}>Create key</Button>
        </>
      }
    >
      {replaces && (
        <p className="mb-3.5 flex items-start gap-1.5 rounded px-2.5 py-2 text-xs" style={{ backgroundColor: '#F2F7FE', border: '1px solid #B9D4F5' }}>
          <Info size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" color={C.primary} />
          <span>
            Replaces <b>{replaces.name}</b>, revoked {replaces.revokedOn}. Send the new key to the partner so they can reconnect.
          </span>
        </p>
      )}
      <div className="mb-3.5">
        <FieldLabel htmlFor="api-key-name" counter={`${name.length}/${NAME_MAX}`}>
          Key name <span style={{ color: C.danger }}>*</span>
        </FieldLabel>
        <input
          id="api-key-name"
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
          placeholder="e.g. Pump vendor, StockWise, Camera system"
          style={inputStyle(Boolean(error))}
        />
        {error && <FieldError>{error}</FieldError>}
        <Help>This name shows on every Task the key creates and in the audit trail. It can&apos;t be changed later.</Help>
        <div className="mt-2.5 rounded text-xs" style={{ border: `1px solid ${C.border}`, backgroundColor: '#FAFBFC' }}>
          <div className="flex items-center gap-2 px-2.5 py-2">
            <span style={{ color: C.text2, width: 118 }}>Shown on Tasks as</span>
            <KindChip />
            <SourcePill>{name || 'Key name'}</SourcePill>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.text2, width: 118 }}>Tag on every Task</span>
            <Code>{partnerTag(name)}</Code>
          </div>
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="api-key-notes">Notes (optional)</FieldLabel>
        <textarea
          id="api-key-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Partner contact, ticket number, etc."
          className="w-full rounded px-2.5 py-2 text-sm"
          style={{ border: `1px solid ${C.border}`, color: C.text, resize: 'none', outline: 'none' }}
        />
      </div>
    </Modal>
  );
}
