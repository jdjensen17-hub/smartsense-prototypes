// B6 — rejected events across every key, filterable by key and by what the partner sent.

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Info, Search } from 'lucide-react';
import { ToastHost } from '@/components/api-keys/toast';
import { showToast } from '@/components/api-keys/toastStore';
import { useApiKeyDeepLinks } from '@/components/api-keys/deepLinks';
import {
  Banner,
  Button,
  Code,
  Crumbs,
  PageHead,
  Pill,
  SupportBanner,
  TableCard,
  Th,
} from '@/components/api-keys/ui';
import { C, inputStyle } from '@/components/api-keys/tokens';
import { ORG, REASONS, allRejected, downloadCsv, rejectedEventsCsv, useApiKeys } from '@/data/apiKeys';

/** A query change is a new entry point, so the filter starts over from the URL. */
export default function ApiKeyRejectedEventsPage() {
  const [params] = useSearchParams();
  return <RejectedEventsScreen key={params.toString()} />;
}

function RejectedEventsScreen() {
  const state = useApiKeys();
  const [params] = useSearchParams();
  const [keyFilter, setKeyFilter] = useState(params.get('key') ?? 'all');
  const [search, setSearch] = useState('');
  useApiKeyDeepLinks();

  const keyName = (keyId: string) => state.keys.find((key) => key.id === keyId)?.name ?? keyId;
  const empty = params.get('state') === 'empty';
  const rows = (empty ? [] : allRejected(state))
    .filter((row) => keyFilter === 'all' || row.key === keyFilter)
    .filter((row) => !search || (row.sent || '').toLowerCase().includes(search.toLowerCase()));

  const filteredKey = keyFilter !== 'all' ? state.keys.find((key) => key.id === keyFilter) : null;

  return (
    <div>
      <Crumbs items={[{ label: 'Settings' }, { label: 'API Keys', to: '/admin/api-keys' }, { label: 'Rejected events' }]} />
      <PageHead
        title="Rejected events"
        subtitle="These events were rejected because their location couldn't be matched to a location in your organization, or the key went over its rate limit. No Tasks were created."
        actions={
          <Button
            icon={<Download size={14} strokeWidth={1.8} />}
            disabled={rows.length === 0}
            onClick={() => {
              downloadCsv('rejected_events.csv', rejectedEventsCsv(rows, keyName));
              showToast('rejected_events.csv downloaded');
            }}
          >
            Download CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-3.5">
        <SupportBanner viewAs={state.viewAs} orgName={ORG.name} />
        <Banner icon={<Info size={17} strokeWidth={1.8} color={C.primary} />}>
          Fix the ID in the partner&apos;s system, then ask the partner to resend. For Rate limited, ask the partner to slow down and resend.
        </Banner>

        <div className="flex items-center gap-2">
          <select
            aria-label="Filter by API key"
            value={keyFilter}
            onChange={(e) => setKeyFilter(e.target.value)}
            style={{ ...inputStyle(), width: 280, cursor: 'pointer' }}
          >
            <option value="all">All keys</option>
            {state.keys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.name}{key.status === 'revoked' ? ' (revoked)' : ''}
              </option>
            ))}
          </select>
          {/* The date range is cosmetic in this prototype. */}
          <select aria-label="Date range" style={{ ...inputStyle(), width: 160, cursor: 'pointer' }} defaultValue="7">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <div className="relative flex-1">
            <Search size={15} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.text3 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by location sent"
              aria-label="Search by location sent"
              style={{ ...inputStyle(), paddingLeft: 34 }}
            />
          </div>
        </div>

        <TableCard>
          {rows.length === 0 ? (
            <div className="px-4 py-7 text-center text-sm" style={{ color: C.text2 }}>
              <span className="block font-semibold" style={{ color: C.text }}>
                {filteredKey ? `No rejected events for ${filteredKey.name}.` : 'No rejected events.'}
              </span>
              {search ? 'Try a different search.' : 'Every event in this date range landed at a location in your organization.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ borderBottom: `1px solid ${C.border}` }}>
                <tr>
                  <Th>Received</Th>
                  <Th>API key</Th>
                  <Th>Location sent</Th>
                  <Th>Title</Th>
                  <Th>Task type</Th>
                  <Th>Reason</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.key}-${row.at}-${index}`} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-3.5 py-2.5" style={{ color: C.text2, whiteSpace: 'nowrap' }}>{row.at}</td>
                    <td className="px-3.5 py-2.5">
                      <span
                        className="inline-flex items-center rounded px-2 text-xs font-semibold"
                        style={{ backgroundColor: C.primaryWeak, color: C.primaryText, border: '1px solid #B9D4F5', lineHeight: '20px', whiteSpace: 'nowrap' }}
                      >
                        {keyName(row.key)}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">{row.sent ? <Code>{row.sent}</Code> : <span style={{ color: C.text3 }}>(none)</span>}</td>
                    <td className="px-3.5 py-2.5" style={{ color: C.text }}>
                      {row.title}
                      {row.test && <span className="ml-1.5"><Pill tone="revoked">test</Pill></span>}
                    </td>
                    <td className="px-3.5 py-2.5"><Code>{row.type}</Code></td>
                    <td className="px-3.5 py-2.5"><Pill tone="danger">{REASONS[row.reason]}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableCard>

        {rows.length > 0 && (
          <p className="text-xs" style={{ color: C.text2 }}>
            {rows.length} rejected event{rows.length === 1 ? '' : 's'} in the last 7 days.
          </p>
        )}
      </div>
      <ToastHost />
    </div>
  );
}
