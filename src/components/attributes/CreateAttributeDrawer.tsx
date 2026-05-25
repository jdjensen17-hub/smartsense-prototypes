import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AttributeDef, AttributeType, ValueType } from '@/data/attributes';

// ── Icons ─────────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M11.782 4.032a.575.575 0 1 0-.813-.813L7.5 6.687 4.031 3.22a.575.575 0 0 0-.813.813L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .813.813L7.5 8.313l3.469 3.468a.575.575 0 0 0 .813-.813L8.313 7.5l3.469-3.468Z" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
      <path d="M8 2.75a.5.5 0 0 0-1 0V7H2.75a.5.5 0 0 0 0 1H7v4.25a.5.5 0 0 0 1 0V8h4.25a.5.5 0 0 0 0-1H8V2.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  editingAttr: AttributeDef | null;
  onClose: () => void;
  onSave: (attr: Omit<AttributeDef, 'id' | 'lastModified'>) => void;
};

// ── Colour swatches for Item Group ────────────────────────────────────────────

const SWATCHES = [
  '#C62828', '#AD1457', '#6A1B9A', '#283593',
  '#1565C0', '#00695C', '#2E7D32', '#E65100',
  '#BF360C', '#4E342E', '#37474F', '#000000',
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateAttributeDrawer({ open, editingAttr, onClose, onSave }: Props) {
  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');
  const [tagType, setTagType]       = useState<AttributeType>('Location Attribute');
  const [valueType, setValueType]   = useState<ValueType>('Boolean');
  const [enumValues, setEnumValues] = useState<string[]>([]);
  const [enumInput, setEnumInput]   = useState('');
  const [color, setColor]           = useState(SWATCHES[4]);
  const [icon, setIcon]             = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (editingAttr) {
      setName(editingAttr.name);
      setDescription(editingAttr.description);
      setTagType(editingAttr.tagType);
      setValueType(editingAttr.valueType);
      setEnumValues(editingAttr.enumValues ?? []);
      setColor(editingAttr.color ?? SWATCHES[4]);
      setIcon(editingAttr.icon ?? '');
    } else {
      setName('');
      setDescription('');
      setTagType('Location Attribute');
      setValueType('Boolean');
      setEnumValues([]);
      setEnumInput('');
      setColor(SWATCHES[4]);
      setIcon('');
    }
    setErrors({});
  }, [editingAttr, open]);

  // Close on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  function addEnumValue() {
    const v = enumInput.trim();
    if (!v || enumValues.includes(v)) return;
    setEnumValues((prev) => [...prev, v]);
    setEnumInput('');
  }

  function removeEnumValue(val: string) {
    setEnumValues((prev) => prev.filter((v) => v !== val));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required.';
    if (valueType === 'Enum' && enumValues.length === 0)
      errs.enum = 'Add at least one allowed value.';
    return errs;
  }

  function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave({
      name: name.trim(),
      description: description.trim(),
      tagType,
      valueType,
      enumValues: valueType === 'Enum' ? enumValues : undefined,
      color: tagType === 'Item Group' ? color : undefined,
      icon: tagType === 'Item Group' ? icon : undefined,
    });
    onClose();
  }

  const isEdit = !!editingAttr;

  const drawer = (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ pointerEvents: open ? 'auto' : 'none' }}>
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(53,53,59,0.2)',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative flex flex-col bg-white"
        style={{
          width: '400px',
          height: '100%',
          borderLeft: '1px solid #CCCDD0',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: '1px solid #CCCDD0' }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: '#35353B' }}>
              {isEdit ? 'Edit attribute' : 'New attribute'}
            </div>
            <div className="mt-0.5 text-xs" style={{ color: '#9BA0B0' }}>
              {isEdit ? 'Update this attribute definition.' : 'Define name, type, and allowed values.'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded transition-colors"
            style={{ color: '#9BA0B0', border: 'none', background: 'transparent', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>
              Name <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
              placeholder="e.g. Full Kitchen"
              className="rounded py-2 px-3 text-sm focus:outline-none"
              style={{
                border: `1px solid ${errors.name ? '#E24B4A' : '#CCCDD0'}`,
                color: '#35353B',
                borderRadius: '12px',
              }}
              onFocus={e => { if (!errors.name) e.currentTarget.style.borderColor = '#9BA0B0'; }}
              onBlur={e => { if (!errors.name) e.currentTarget.style.borderColor = '#CCCDD0'; }}
            />
            {errors.name && <p className="text-xs" style={{ color: '#E24B4A' }}>{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>
              Description
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description for admins"
              className="rounded py-2 px-3 text-sm focus:outline-none"
              style={{ border: '1px solid #CCCDD0', color: '#35353B', borderRadius: '12px' }}
              onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'}
              onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'}
            />
          </div>

          {/* Tag type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>
              Tag type
            </label>
            <select
              value={tagType}
              onChange={e => setTagType(e.target.value as AttributeType)}
              className="rounded py-2 px-3 text-sm focus:outline-none"
              style={{ border: '1px solid #CCCDD0', color: '#35353B', borderRadius: '12px', background: '#fff' }}
            >
              <option value="Location Attribute">Location Attribute</option>
              <option value="Item Group">Item Group</option>
            </select>
          </div>

          {/* ── Location Attribute fields ── */}
          {tagType === 'Location Attribute' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>
                  Value type
                </label>
                <select
                  value={valueType}
                  onChange={e => { setValueType(e.target.value as ValueType); setEnumValues([]); }}
                  className="rounded py-2 px-3 text-sm focus:outline-none"
                  style={{ border: '1px solid #CCCDD0', color: '#35353B', borderRadius: '12px', background: '#fff' }}
                >
                  <option value="Boolean">Boolean (Yes / No)</option>
                  <option value="Numeric">Numeric (whole number)</option>
                  <option value="Enum">Enum (pick from list)</option>
                </select>
              </div>

              {valueType === 'Enum' && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>
                    Allowed values <span style={{ color: '#E24B4A' }}>*</span>
                  </label>

                  {/* Existing enum tags */}
                  {enumValues.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {enumValues.map((v) => (
                        <span
                          key={v}
                          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                          style={{ background: '#F7F7FA', border: '1px solid #CCCDD0', color: '#757677' }}
                        >
                          {v}
                          <button
                            onClick={() => removeEnumValue(v)}
                            style={{ color: '#9BA0B0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#757677'}
                            onMouseLeave={e => e.currentTarget.style.color = '#9BA0B0'}
                          >
                            <XIcon />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add value input */}
                  <div className="flex gap-2">
                    <input
                      value={enumInput}
                      onChange={e => { setEnumInput(e.target.value); setErrors(p => ({ ...p, enum: '' })); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEnumValue(); } }}
                      placeholder="Add a value…"
                      className="flex-1 rounded py-2 px-3 text-sm focus:outline-none"
                      style={{ border: '1px solid #CCCDD0', color: '#35353B', borderRadius: '12px' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'}
                      onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'}
                    />
                    <button
                      onClick={addEnumValue}
                      className="flex items-center gap-1 rounded px-3 py-2 text-xs font-bold transition-colors"
                      style={{ border: '1px solid #5CA6D9', color: '#5CA6D9', background: 'transparent', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#E9F6FF'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <PlusIcon /> Add
                    </button>
                  </div>
                  {errors.enum && <p className="text-xs" style={{ color: '#E24B4A' }}>{errors.enum}</p>}
                </div>
              )}
            </>
          )}

          {/* ── Item Group fields ── */}
          {tagType === 'Item Group' && (
            <>
              {/* Color */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {SWATCHES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setColor(s)}
                      className="h-7 w-7 rounded transition-all"
                      style={{
                        backgroundColor: s,
                        border: color === s ? '3px solid #35353B' : '2px solid transparent',
                        cursor: 'pointer',
                        outline: color === s ? '2px solid #fff' : 'none',
                        outlineOffset: '-4px',
                      }}
                      title={s}
                    />
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9BA0B0' }}>
                  Icon <span className="normal-case font-normal" style={{ color: '#CCCDD0' }}>(emoji)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    placeholder="Paste an emoji, e.g. 🧹"
                    className="flex-1 rounded py-2 px-3 text-sm focus:outline-none"
                    style={{ border: '1px solid #CCCDD0', color: '#35353B', borderRadius: '12px' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#9BA0B0'}
                    onBlur={e => e.currentTarget.style.borderColor = '#CCCDD0'}
                  />
                  {icon && (
                    <span className="flex h-9 w-9 items-center justify-center rounded text-xl" style={{ backgroundColor: color }}>
                      {icon}
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: '#9BA0B0' }}>
                  Shown alongside this tag in checklists.
                </p>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: '1px solid #CCCDD0' }}>
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-bold transition-colors"
            style={{ border: '1px solid #CCCDD0', color: '#9BA0B0', background: 'transparent', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F7FA'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded px-4 py-2 text-sm font-bold text-white transition-colors"
            style={{ backgroundColor: '#5CA6D9', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2C82BD'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#5CA6D9'}
          >
            {isEdit ? 'Save changes' : 'Create attribute'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}
