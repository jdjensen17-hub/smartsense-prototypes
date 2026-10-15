import { plural, statusSets, useStatusSets } from '@/data/statusSets';
import { DangerButton, PrimaryButton, SecondaryButton } from '@/components/statuses/buttons';
import { IconBadge, Modal } from '@/components/statuses/Modal';

export function DeleteSetDialog({ setId, onClose, onFinished }: { setId: string; onClose: () => void; onFinished: () => void }) {
  const snapshot = useStatusSets();
  const set = snapshot.find((item) => item.id === setId) ?? null;
  if (!set) return null;

  if (set.usedBy.length > 0) {
    return (
      <Modal
        title={`Can't delete '${set.name}'`}
        subtitle={`Used by ${plural(set.usedBy.length, 'template')}`}
        icon={<IconBadge tone="warn"><LockIcon /></IconBadge>}
        onClose={onClose}
        footer={(
          <>
            <SecondaryButton onClick={onClose}>Close</SecondaryButton>
            <PrimaryButton onClick={() => { statusSets.archive(set.id); onFinished(); }}>Archive instead</PrimaryButton>
          </>
        )}
      >
        <p>Switch these templates to another set first, or archive this set. An archived set keeps working on these templates, but new templates can't pick it.</p>
        <div className="mt-3 overflow-hidden rounded" style={{ border: '1px solid #CCCDD0' }}>
          {set.usedBy.map((template, index) => (
            <div
              key={template.id}
              className="flex items-center gap-2 px-3 py-2"
              style={{ borderTop: index === 0 ? 'none' : '1px solid #CCCDD0' }}
            >
              <DocIcon />
              <span className="min-w-0 flex-1">{template.name}</span>
              <span className="text-xs font-medium tracking-wide" style={{ color: '#9BA0B0' }}>{template.type.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Delete '${set.name}'?`}
      icon={<IconBadge tone="danger"><TrashIcon /></IconBadge>}
      onClose={onClose}
      footer={(
        <>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <DangerButton onClick={() => { statusSets.remove(set.id); onFinished(); }}>Delete</DangerButton>
        </>
      )}
    >
      <p>No templates use this set. You can't undo this.</p>
    </Modal>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 5h9M6.5 5V3.5h3V5M5 5l.5 8h5L11 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden style={{ color: '#9BA0B0', flexShrink: 0 }}>
      <path d="M4.5 2.5h5L12 5v8.5h-7.5v-11Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9.5 2.5V5H12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
