// B1 — API keys list, plus the A2 download-locations, B2 add-key, and B3 copy-key dialogs.
// Every state in the reference mock is reachable with a query param, e.g. ?state=empty, ?modal=add, ?as=csm.

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Ban, Download, Key, Lock, Plus, RotateCw, ShieldCheck, TriangleAlert, Users } from 'lucide-react';
import { AddKeyModal } from '@/components/api-keys/AddKeyModal';
import { CopyKeyModal } from '@/components/api-keys/CopyKeyModal';
import { LocationsModal } from '@/components/api-keys/LocationsModal';
import { ConfirmDialog } from '@/components/api-keys/Modal';
import { ToastHost } from '@/components/api-keys/toast';
import { showToast } from '@/components/api-keys/toastStore';
import {
  Banner,
  Button,
  Crumbs,
  EmptyCard,
  LinkButton,
  PageHead,
  Pill,
  SupportBanner,
  TableCard,
  Th,
} from '@/components/api-keys/ui';
import { C } from '@/components/api-keys/tokens';
import { useApiKeyDeepLinks } from '@/components/api-keys/deepLinks';
import { ORG, allRejected, apiKeys, rejectedFor, useApiKeys, type ApiKey } from '@/data/apiKeys';

type Dialog =
  | { type: 'locations' }
  | { type: 'add'; name: string; notes: string; error: string | null; replacesKeyId?: string }
  | { type: 'token'; keyId: string; keyName: string; token: string; rotated: boolean; oldLast4?: string }
  | { type: 'rotate'; keyId: string }
  | { type: 'revoke'; keyId: string };

/** A query change is a new entry point, so the screen starts over from the URL. */
export default function ApiKeysPage() {
  const [params] = useSearchParams();
  return <ApiKeysScreen key={params.toString()} />;
}

/** Deep links from the reference mock: ?modal=locations | add | add-error | token (&name=…) */
function dialogFromParams(params: URLSearchParams): Dialog | null {
  switch (params.get('modal')) {
    case 'locations':
      return { type: 'locations' };
    case 'add':
      return { type: 'add', name: params.get('name') ?? '', notes: params.get('notes') ?? '', error: null };
    case 'add-error':
      return { type: 'add', name: 'StockWise Inventory', notes: '', error: 'A key with this name already exists.' };
    case 'token': {
      const { key, token } = apiKeys.ensureKey(params.get('name') ?? 'Exception Reporting (InsightBoard)');
      return { type: 'token', keyId: key.id, keyName: key.name, token, rotated: false };
    }
    default:
      return null;
  }
}

function ApiKeysScreen() {
  const navigate = useNavigate();
  const state = useApiKeys();
  const [params] = useSearchParams();
  const [dialog, setDialog] = useState<Dialog | null>(() => dialogFromParams(params));
  useApiKeyDeepLinks();

  const demoState = params.get('state');
  const flagOff = demoState === 'flagoff';
  const noLocations = demoState === 'nolocations';
  const rows = demoState === 'empty' || noLocations ? [] : state.keys;
  const canManage = state.viewAs === 'admin';
  const rejectedCount = allRejected(state).length;

  function rotate(keyId: string) {
    const target = apiKeys.get(keyId);
    if (!target) return;
    const { token, oldLast4 } = apiKeys.rotate(keyId);
    setDialog({ type: 'token', keyId, keyName: target.name, token, rotated: true, oldLast4 });
  }

  function revoke(keyId: string) {
    const target = apiKeys.get(keyId);
    if (!target) return;
    apiKeys.revoke(keyId);
    setDialog(null);
    showToast(`${target.name} revoked. It stopped working immediately.`);
  }

  function finishToken(current: Extract<Dialog, { type: 'token' }>) {
    setDialog(null);
    if (current.rotated) {
      showToast('New key issued. The old key no longer works.');
      return;
    }
    navigate(`/admin/api-keys/${current.keyId}/test`);
  }

  const dialogKey = dialog && 'keyId' in dialog ? apiKeys.get(dialog.keyId) : null;

  return (
    <div>
      <Crumbs items={[{ label: 'Settings' }, { label: 'API Keys' }]} />
      <PageHead
        title="API keys"
        subtitle="Create a key for each system or partner that sends Tasks to Operate. Keys can only create Tasks. They can't read, change, or delete your data."
        actions={
          flagOff ? undefined : (
            <>
              <Button
                icon={<Download size={14} strokeWidth={1.8} />}
                disabled={noLocations}
                title={noLocations ? 'Your organization has no locations yet.' : undefined}
                onClick={() => setDialog({ type: 'locations' })}
              >
                Download locations
              </Button>
              {canManage && (
                <Button variant="primary" icon={<Plus size={14} strokeWidth={2} />} onClick={() => setDialog({ type: 'add', name: '', notes: '', error: null })}>
                  Add API key
                </Button>
              )}
            </>
          )
        }
      />

      <div className="flex flex-col gap-3.5">
        <SupportBanner viewAs={state.viewAs} orgName={ORG.name} />
        {!flagOff && (
          <Banner icon={<ShieldCheck size={17} strokeWidth={1.8} color={C.primary} />}>
            You decide who gets a key. Only share keys with partners you trust.
          </Banner>
        )}

        {flagOff ? (
          <EmptyCard
            tone="gray"
            icon={<Lock size={22} strokeWidth={1.6} />}
            title="API keys aren't turned on for your organization."
            body="Contact your SmartSense CSM."
          />
        ) : rows.length === 0 ? (
          <EmptyCard
            icon={<Key size={22} strokeWidth={1.6} />}
            title="No API keys yet."
            body="Create a key, name it after the partner or system that will use it, and send it to them with your locations list."
            action={
              canManage ? (
                <Button variant="primary" icon={<Plus size={14} strokeWidth={2} />} onClick={() => setDialog({ type: 'add', name: '', notes: '', error: null })}>
                  Add API key
                </Button>
              ) : undefined
            }
          />
        ) : (
          <TableCard>
            <table className="w-full text-sm">
              <thead style={{ borderBottom: `1px solid ${C.border}` }}>
                <tr>
                  <Th width="26%">Name</Th>
                  <Th>Created</Th>
                  <Th>Created by</Th>
                  <Th>Last used</Th>
                  <Th align="right">Events</Th>
                  <Th align="right">Rejected (7 days)</Th>
                  <Th>Status</Th>
                  {canManage && <Th align="right">Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((apiKey) => (
                  <KeyRow
                    key={apiKey.id}
                    apiKey={apiKey}
                    rejected={rejectedFor(state, apiKey.id).length}
                    canManage={canManage}
                    onOpen={() => navigate(`/admin/api-keys/${apiKey.id}`)}
                    onRotate={() => setDialog({ type: 'rotate', keyId: apiKey.id })}
                    onRevoke={() => setDialog({ type: 'revoke', keyId: apiKey.id })}
                    onReplace={() => setDialog({ type: 'add', name: apiKey.name, notes: apiKey.notes, error: null, replacesKeyId: apiKey.id })}
                    onRejected={() => navigate(`/admin/api-keys/rejected?key=${apiKey.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {!flagOff && (
          <div className="flex items-center gap-3.5 text-sm">
            <LinkButton icon={<TriangleAlert size={14} strokeWidth={1.8} />} onClick={() => navigate('/admin/api-keys/rejected')}>
              Rejected events{rows.length > 0 ? ` (${rejectedCount})` : ''}
            </LinkButton>
            <span style={{ color: C.border }}>|</span>
            <LinkButton icon={<Users size={14} strokeWidth={1.8} />} onClick={() => navigate('/admin/api-keys/role-check')}>
              Role check
            </LinkButton>
          </div>
        )}
      </div>

      {dialog?.type === 'locations' && <LocationsModal onClose={() => setDialog(null)} />}
      {dialog?.type === 'add' && (
        <AddKeyModal
          initialName={dialog.name}
          initialNotes={dialog.notes}
          initialError={dialog.error}
          replaces={dialog.replacesKeyId ? apiKeys.get(dialog.replacesKeyId) : null}
          onClose={() => setDialog(null)}
          onCreated={({ key, token }) => setDialog({ type: 'token', keyId: key.id, keyName: key.name, token, rotated: false })}
        />
      )}
      {dialog?.type === 'token' && (
        <CopyKeyModal
          keyName={dialog.keyName}
          token={dialog.token}
          rotated={dialog.rotated}
          oldLast4={dialog.oldLast4}
          onDone={() => finishToken(dialog)}
        />
      )}
      {dialog?.type === 'rotate' && dialogKey && (
        <ConfirmDialog
          tone="warn"
          icon={<RotateCw size={18} strokeWidth={1.8} />}
          title={`Rotate the key for ${dialogKey.name}?`}
          body={`The current key stops working right away. You'll get a new key to send to ${dialogKey.name}. ${dialogKey.name} stops sending events until they enter the new key. History stays the same.`}
          confirmLabel="Rotate key"
          onConfirm={() => rotate(dialogKey.id)}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'revoke' && dialogKey && (
        <ConfirmDialog
          tone="danger"
          icon={<Ban size={18} strokeWidth={1.8} />}
          title={`Revoke ${dialogKey.name}?`}
          body="This key stops working right away and can't be restored. Existing Tasks stay on To-Dos until completed."
          confirmLabel="Revoke key"
          confirmVariant="danger"
          onConfirm={() => revoke(dialogKey.id)}
          onCancel={() => setDialog(null)}
        />
      )}
      <ToastHost />
    </div>
  );
}

function KeyRow({
  apiKey,
  rejected,
  canManage,
  onOpen,
  onRotate,
  onRevoke,
  onReplace,
  onRejected,
}: {
  apiKey: ApiKey;
  rejected: number;
  canManage: boolean;
  onOpen: () => void;
  onRotate: () => void;
  onRevoke: () => void;
  onReplace: () => void;
  onRejected: () => void;
}) {
  const revoked = apiKey.status === 'revoked';
  return (
    <tr
      className="cursor-pointer"
      style={{ borderTop: `1px solid ${C.border}` }}
      onClick={onOpen}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAFBFC'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
    >
      <td className="px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded"
            style={{ backgroundColor: revoked ? C.inset : C.primaryWeak, color: revoked ? C.text3 : C.primary }}
          >
            <Key size={14} strokeWidth={1.8} />
          </span>
          <span>
            <span className="block font-semibold" style={{ color: revoked ? C.text2 : C.text }}>{apiKey.name}</span>
            <span className="block text-xs" style={{ color: C.text3, fontFamily: 'var(--ss-font-mono)' }}>•••• {apiKey.last4}</span>
          </span>
        </div>
      </td>
      <td className="px-3.5 py-2.5" style={{ color: revoked ? C.text3 : C.text2 }}>{apiKey.created}</td>
      <td className="px-3.5 py-2.5" style={{ color: revoked ? C.text3 : C.text2 }}>{apiKey.createdBy}</td>
      <td className="px-3.5 py-2.5" style={{ color: C.text3 }}>{apiKey.lastUsed ?? 'Never'}</td>
      <td className="px-3.5 py-2.5 text-right" style={{ color: revoked ? C.text3 : C.text2 }}>{apiKey.events.toLocaleString('en-US')}</td>
      <td className="px-3.5 py-2.5 text-right">
        {rejected > 0 ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRejected(); }}
            className="text-sm font-bold hover:underline"
            style={{ color: C.primary, background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {rejected}
          </button>
        ) : (
          <span style={{ color: C.text3 }}>0</span>
        )}
      </td>
      <td className="px-3.5 py-2.5">{revoked ? <Pill tone="revoked">Revoked</Pill> : <Pill tone="active">Active</Pill>}</td>
      {canManage && (
        <td className="px-3.5 py-2.5 text-right" style={{ whiteSpace: 'nowrap' }}>
          {revoked ? (
            <span className="flex items-center justify-end gap-3.5">
              <span style={{ color: C.text3 }}>Revoked {apiKey.revokedOn}</span>
              <LinkButton icon={<Plus size={13} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); onReplace(); }}>Replace</LinkButton>
            </span>
          ) : (
            <span className="flex justify-end gap-3.5">
              <LinkButton icon={<RotateCw size={13} strokeWidth={1.8} />} onClick={(e) => { e.stopPropagation(); onRotate(); }}>Rotate</LinkButton>
              <LinkButton danger icon={<Ban size={13} strokeWidth={1.8} />} onClick={(e) => { e.stopPropagation(); onRevoke(); }}>Revoke</LinkButton>
            </span>
          )}
        </td>
      )}
    </tr>
  );
}
