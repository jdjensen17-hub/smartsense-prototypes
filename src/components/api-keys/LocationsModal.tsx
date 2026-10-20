import { Download, FileText, Info, TriangleAlert } from 'lucide-react';
import { ACTIVE_LOCATIONS, LOCATIONS, ORG, storeNumberCounts } from '@/data/apiKeys';
import { IconBadge, Modal } from './Modal';
import { downloadLocationsCsv } from './downloads';
import { Button, Code, Pill, Th } from './ui';
import { C } from './tokens';

/** A2 — preview of the locations CSV before the download. */
export function LocationsModal({ onClose }: { onClose: () => void }) {
  const counts = storeNumberCounts();
  const shared = ACTIVE_LOCATIONS.filter((location) => counts[location.store] > 1);
  const inactive = LOCATIONS.length - ACTIVE_LOCATIONS.length;

  return (
    <Modal
      width={980}
      icon={<IconBadge tone="info"><Download size={18} strokeWidth={1.8} /></IconBadge>}
      title="Download locations"
      subtitle="Send this file to each partner you give a key to. Partners include the SmartSense location ID with every event so Tasks land at the right store."
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={<Download size={14} strokeWidth={1.8} />} onClick={() => { downloadLocationsCsv(); onClose(); }}>
            Download CSV
          </Button>
        </>
      }
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-semibold">{ORG.file}_locations.csv</span>
        <span className="text-xs" style={{ color: C.text3 }}>
          {ACTIVE_LOCATIONS.length} active locations{inactive > 0 ? ` · ${inactive} inactive location${inactive > 1 ? 's' : ''} not included` : ''} · preview
        </span>
      </div>
      <div className="overflow-x-auto" style={{ border: `1px solid ${C.border}`, borderRadius: 4 }}>
        <table className="w-full text-xs">
          <thead style={{ backgroundColor: C.app, borderBottom: `1px solid ${C.border}` }}>
            <tr>
              <Th>Location name</Th>
              <Th>Store number</Th>
              <Th>Address</Th>
              <th className="px-3.5 text-xs font-semibold" style={{ color: C.primaryText, backgroundColor: C.primaryWeak, height: 34, textAlign: 'left', whiteSpace: 'nowrap' }}>
                SmartSense location ID
              </th>
              <Th>Note</Th>
            </tr>
          </thead>
          <tbody>
            {ACTIVE_LOCATIONS.map((location) => {
              const isShared = counts[location.store] > 1;
              return (
                <tr key={location.id} style={{ borderTop: `1px solid ${C.border}`, backgroundColor: isShared ? '#FFFAF0' : undefined }}>
                  <td className="px-3.5 py-1.5" style={{ whiteSpace: 'nowrap' }}>{location.name}</td>
                  <td className="px-3.5 py-1.5">{location.store}</td>
                  <td className="px-3.5 py-1.5" style={{ color: location.address ? C.text : C.text3, whiteSpace: 'nowrap' }}>
                    {location.address || '(none on file)'}
                  </td>
                  <td className="px-3.5 py-1.5" style={{ backgroundColor: '#F5F9FE', fontFamily: 'var(--ss-font-mono)' }}>{location.id}</td>
                  <td className="px-3.5 py-1.5">{isShared && <Pill tone="warn">Shared store number</Pill>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-xs" style={{ color: C.text2 }}>
        <Info size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
        <span>
          The partner sends the <b>SmartSense location ID</b> as <Code>smartsense_location_id</Code>. A store number works only when it&apos;s unique in your organization.
        </span>
      </p>
      <p className="mt-1 flex items-start gap-1.5 text-xs" style={{ color: C.text2 }}>
        <FileText size={13} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
        Downloads are recorded in the audit log.
      </p>
      {shared.length > 0 && (
        <div className="mt-2.5 flex items-start gap-2 rounded px-2.5 py-2 text-xs" style={{ backgroundColor: C.warnBg, border: '1px solid #F5D48F', color: C.warnText }}>
          <TriangleAlert size={14} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
          <span>
            {shared.length} locations share store number {shared[0].store}. Events for these stores must use the SmartSense location ID, or they&apos;ll be rejected.
          </span>
        </div>
      )}
    </Modal>
  );
}
