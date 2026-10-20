import { useState } from 'react';
import { Check, Copy, Download, ExternalLink, Key, MapPin, TriangleAlert } from 'lucide-react';
import { RATE_LIMIT } from '@/data/apiKeys';
import { ConfirmDialog, IconBadge, Modal } from './Modal';
import { downloadLocationsCsv } from './downloads';
import { showToast } from './toastStore';
import { Button, Code, FieldLabel } from './ui';
import { C } from './tokens';

/**
 * B3 — the one time the key is readable. The dialog can't be dismissed with the backdrop or Escape;
 * Done is always enabled and asks for a confirm when nothing was copied.
 */
export function CopyKeyModal({
  keyName,
  token,
  rotated = false,
  oldLast4,
  onDone,
}: {
  keyName: string;
  token: string;
  rotated?: boolean;
  oldLast4?: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(token).catch(() => {});
    setCopied(true);
    showToast('Key copied to clipboard');
  }

  return (
    <>
      <Modal
        width={600}
        dismissable={false}
        icon={<IconBadge tone="ok"><Key size={18} strokeWidth={1.8} /></IconBadge>}
        title={`${rotated ? 'Copy your new API key for' : 'Copy your API key for'} ${keyName}`}
        subtitle={`This is the only time you'll see this key. Store it securely and send it to ${keyName}.`}
        footer={
          <>
            <label className="mr-auto flex cursor-pointer items-center gap-2 text-sm" style={{ color: C.text }}>
              <input type="checkbox" checked={copied} onChange={(e) => setCopied(e.target.checked)} />
              I&apos;ve copied this key
            </label>
            <Button variant="primary" onClick={() => (copied ? onDone() : setConfirming(true))}>Done</Button>
          </>
        }
      >
        {rotated && (
          <div className="mb-3 flex items-start gap-2 rounded px-2.5 py-2 text-xs" style={{ backgroundColor: C.warnBg, border: '1px solid #F5D48F', color: C.warnText }}>
            <TriangleAlert size={14} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
            <span>The old key ending in {oldLast4} has stopped working. Send this new key to {keyName}.</span>
          </div>
        )}
        <FieldLabel>API key</FieldLabel>
        <div className="flex items-center gap-2 rounded py-1.5 pl-3 pr-1.5" style={{ border: `1px solid ${C.border}`, backgroundColor: C.app }}>
          <span className="flex-1 break-all text-xs" style={{ fontFamily: 'var(--ss-font-mono)', color: '#1F2328' }}>{token}</span>
          <Button
            small
            variant={copied ? 'default' : 'primary'}
            icon={copied ? <Check size={13} strokeWidth={2.2} /> : <Copy size={13} strokeWidth={1.8} />}
            onClick={copy}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <div className="mt-3 rounded text-sm" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span style={{ color: C.text3, width: 90 }}>Endpoint</span>
            <span className="flex-1"><Code>POST /v1/events</Code></span>
            <button
              type="button"
              onClick={() => showToast('Opens the public Events API docs (not in this prototype)')}
              className="inline-flex items-center gap-1 text-sm font-bold"
              style={{ color: C.primary, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              View API docs <ExternalLink size={13} strokeWidth={1.8} />
            </button>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.text3, width: 90 }}>Can do</span>
            <span className="font-semibold">Create Tasks only</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <span style={{ color: C.text3, width: 90 }}>Rate limit</span>
            <span className="font-semibold">{RATE_LIMIT}</span>
          </div>
        </div>

        {!rotated && (
          <div className="mt-3 flex items-center gap-2.5 rounded px-3 py-2.5 text-sm" style={{ backgroundColor: '#F2F7FE', border: '1px solid #B9D4F5' }}>
            <MapPin size={18} strokeWidth={1.8} color={C.primary} className="flex-shrink-0" />
            <span className="flex-1">
              <b>Next step:</b> Send {keyName} your locations list too, so it can include the SmartSense location ID with each event.
            </span>
            <Button small icon={<Download size={13} strokeWidth={1.8} />} onClick={downloadLocationsCsv}>Download locations</Button>
          </div>
        )}
      </Modal>

      {confirming && (
        <ConfirmDialog
          layer="top"
          tone="warn"
          icon={<TriangleAlert size={18} strokeWidth={1.8} />}
          title="Close without copying?"
          body="You won't be able to see this key again. If you lose it, rotate it to get a new one."
          confirmLabel="Close"
          cancelLabel="Go back"
          onConfirm={onDone}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
