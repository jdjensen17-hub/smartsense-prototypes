import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { TreeItemIndex, TreeItem } from 'react-complex-tree';
import { Icon } from '@/components/shared/Icon';
import {
  mdiChevronDown,
  mdiClose,
  mdiCheck,
  mdiStore,
} from '@/icons/mdi';

// ── Icon paths ────────────────────────────────────────────────────────────────
const mdiCloudUploadOutline = 'M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z';
const mdiFileUploadOutline = 'M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M12,12L16,16H13.5V19H10.5V16H8L12,12Z';
const mdiAlertCircleOutline = 'M11 15H13V17H11V15M11 7H13V13H11V7M12 2C6.47 2 2 6.5 2 12A10 10 0 0 0 12 22A10 10 0 0 0 22 12A10 10 0 0 0 12 2M12 20A8 8 0 0 1 4 12A8 8 0 0 1 12 4A8 8 0 0 1 20 12A8 8 0 0 1 12 20Z';
const mdiDragVertical = 'M9,3H11V5H9V3M13,3H15V5H13V3M9,7H11V9H9V7M13,7H15V9H13V7M9,11H11V13H9V11M13,11H15V13H13V11M9,15H11V17H9V15M13,15H15V17H13V15M9,19H11V21H9V19M13,19H15V21H13V19Z';
const mdiChevronRight = 'M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.42z';
const mdiPencil = 'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z';

// ── Types ─────────────────────────────────────────────────────────────────────
interface NodeData {
  name: string;
  isLocation: boolean;
  storeNumber?: string;
  cityState?: string;
  isRoot?: boolean;
}
type OrgTreeItem = TreeItem<NodeData>;
type ItemRecord = Record<TreeItemIndex, OrgTreeItem>;

interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

interface HierarchyLevel {
  id: string;
  column: string;
  label: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

// ── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSV(text: string): ParsedCSV {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const vals = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  });
  return { headers, rows };
}

function distinctValues(rows: Record<string, string>[], column: string): Map<string, number> {
  const map = new Map<string, number>();
  rows.forEach(row => {
    const v = row[column] ?? '';
    map.set(v, (map.get(v) ?? 0) + 1);
  });
  return map;
}

function buildTreeItems(
  rows: Record<string, string>[],
  hierarchyLevels: HierarchyLevel[],
  externalIdCol: string,
  nameCol: string
): { items: ItemRecord; ungroupedIds: string[] } {
  const items: ItemRecord = {
    root: { index: 'root', isFolder: true, data: { name: 'Wingstop', isLocation: false, isRoot: true }, children: [] },
  };
  const ungroupedIds: string[] = [];

  rows.forEach(row => {
    const extId = row[externalIdCol]?.trim() || '';
    const locName = row[nameCol]?.trim() || extId;
    if (!extId) return;

    const hasBlankLevel = hierarchyLevels.some(lvl => !(row[lvl.column]?.trim()));
    if (hasBlankLevel || hierarchyLevels.length === 0) {
      const locId = `loc_${extId}`;
      if (!items[locId]) {
        items[locId] = { index: locId, isFolder: false, data: { name: locName, isLocation: true, storeNumber: extId }, children: [] };
        ungroupedIds.push(locId);
      }
      return;
    }

    let parentId = 'root';
    for (let i = 0; i < hierarchyLevels.length; i++) {
      const lvl = hierarchyLevels[i];
      const val = row[lvl.column]?.trim() || '';
      const nodeId = `level_${i}_${val}`;
      if (!items[nodeId]) {
        items[nodeId] = { index: nodeId, isFolder: true, data: { name: val, isLocation: false }, children: [] };
      }
      const parent = items[parentId];
      if (parent && !parent.children?.includes(nodeId)) {
        parent.children = [...(parent.children ?? []), nodeId];
      }
      parentId = nodeId;
    }

    const locId = `loc_${extId}`;
    if (!items[locId]) {
      items[locId] = { index: locId, isFolder: false, data: { name: locName, isLocation: true, storeNumber: extId }, children: [] };
      const parent = items[parentId];
      if (parent && !parent.children?.includes(locId)) {
        parent.children = [...(parent.children ?? []), locId];
      }
    }
  });

  return { items, ungroupedIds };
}

// ── Step navigator ────────────────────────────────────────────────────────────
const STEP_LABELS = ['Upload File', 'Map Location Fields', 'Define Hierarchy Levels', 'Location Attributes', 'Preview & Commit'];

function StepNav({ current, maxReached, onNavigate }: { current: WizardStep; maxReached: WizardStep; onNavigate: (s: WizardStep) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {STEP_LABELS.map((label, i) => {
        const step = (i + 1) as WizardStep;
        const isActive = step === current;
        const isCompleted = step < current || (step <= maxReached && step !== current);
        const isLocked = step > maxReached && step !== current;
        const clickable = isCompleted && step <= maxReached;

        return (
          <button key={step}
            onClick={() => clickable ? onNavigate(step) : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 4, border: 'none',
              background: isActive ? '#E1F5FF' : 'transparent',
              cursor: clickable ? 'pointer' : 'default',
              textAlign: 'left', width: '100%', fontFamily: 'Open Sans, sans-serif',
            }}
            onMouseEnter={e => { if (clickable) e.currentTarget.style.backgroundColor = isActive ? '#E1F5FF' : '#F7F7FA'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? '#E1F5FF' : 'transparent'; }}
          >
            {/* Circle indicator */}
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isCompleted ? '#27B872' : isActive ? '#1678C2' : '#fff',
              border: isLocked || (!isActive && !isCompleted) ? '1.5px solid #1678C2' : 'none',
              boxSizing: 'border-box',
            }}>
              {isCompleted
                ? <Icon path={mdiCheck} size={13} color="#fff" />
                : <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? '#fff' : '#1678C2' }}>{step}</span>
              }
            </div>
            <span style={{
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              color: isActive ? '#181D1F' : isLocked ? '#9BA0B0' : '#555555',
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Preview tree (inner) — remounted via key on each Preview click ────────────
function TreeNode({ itemId, items, expanded, onToggle, depth }: {
  itemId: TreeItemIndex;
  items: ItemRecord;
  expanded: Set<TreeItemIndex>;
  onToggle: (id: TreeItemIndex) => void;
  depth: number;
}) {
  const item = items[itemId];
  if (!item) return null;
  const isExpanded = expanded.has(itemId);
  const padLeft = 8 + depth * 16;
  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', minHeight: 28, paddingLeft: padLeft, paddingRight: 6, cursor: item.isFolder ? 'pointer' : 'default' }}
        onClick={item.isFolder ? () => onToggle(itemId) : undefined}
      >
        {item.isFolder && (
          <span style={{ display: 'flex', flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
            <Icon path={mdiChevronRight} size={14} color="#9BA0B0" />
          </span>
        )}
        {item.data.isLocation && <span style={{ marginLeft: 2 }}><Icon path={mdiStore} size={12} color="#9BA0B0" /></span>}
        <span style={{ marginLeft: 4, fontSize: 12, color: item.data.isRoot ? '#181D1F' : item.data.isLocation ? '#6B7280' : '#555555', fontWeight: item.data.isRoot ? 600 : 400 }}>
          {item.data.name}
        </span>
      </div>
      {isExpanded && item.children?.map(childId => (
        <TreeNode key={childId} itemId={childId} items={items} expanded={expanded} onToggle={onToggle} depth={depth + 1} />
      ))}
    </div>
  );
}

function PreviewTree({ previewItems }: { previewItems: ItemRecord }) {
  const [expanded, setExpanded] = useState<Set<TreeItemIndex>>(() => {
    const allFolderIds = Object.keys(previewItems).filter(k => !previewItems[k].data.isLocation);
    const bottomFolderIds = new Set(
      allFolderIds.filter(k => {
        const children = previewItems[k].children ?? [];
        return children.length === 0 || children.every(c => previewItems[c]?.data.isLocation);
      })
    );
    return new Set(allFolderIds.filter(k => !bottomFolderIds.has(k)));
  });

  const handleToggle = useCallback((id: TreeItemIndex) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const root = previewItems['root'];
  if (!root) return null;

  return (
    <div>
      {root.children?.map(childId => (
        <TreeNode key={childId} itemId={childId} items={previewItems} expanded={expanded} onToggle={handleToggle} depth={0} />
      ))}
    </div>
  );
}

// ── Hierarchy preview panel ───────────────────────────────────────────────────
function HierarchyPreviewPanel({ previewItems, showPanel, hasPreview, mappingChanged, onPreview, levelsCount }: {
  previewItems: ItemRecord; showPanel: boolean; hasPreview: boolean; mappingChanged: boolean; onPreview: () => void; levelsCount: number;
}) {
  const [previewKey, setPreviewKey] = useState(0);

  if (!showPanel) return null;

  return (
    <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ background: '#fff', border: '1px solid #DBDBDB', borderRadius: 4, overflow: 'hidden', flex: 1 }}>
        <div style={{ padding: '0 14px', borderBottom: '1px solid #DBDBDB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#181D1F' }}>Hierarchy Preview</span>
          <button
            onClick={levelsCount > 0 ? () => { onPreview(); setPreviewKey(k => k + 1); } : undefined}
            disabled={levelsCount === 0}
            style={{
              background: '#fff', color: levelsCount === 0 ? 'rgba(0,0,0,0.38)' : '#1678C2',
              border: `1px solid ${levelsCount === 0 ? '#DBDBDB' : '#1678C2'}`,
              borderRadius: 4, padding: '6px 14px', fontSize: 12, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              cursor: levelsCount === 0 ? 'default' : 'pointer',
              fontFamily: 'Open Sans, sans-serif',
            }}
          >
            {hasPreview ? 'UPDATE' : 'PREVIEW'}
          </button>
        </div>

        {mappingChanged && hasPreview && (
          <div style={{ padding: '8px 14px', background: '#FFFBEB', borderBottom: '1px solid #F59E0B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon path={mdiAlertCircleOutline} size={14} color="#92400E" />
            <span style={{ fontSize: 12, color: '#92400E' }}>Mapping changed — click Update Preview</span>
          </div>
        )}

        <div style={{ padding: 12 }}>
          {!hasPreview ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 4, background: '#F9FAFB', marginBottom: 8 }}>
                <Icon path={mdiStore} size={14} color="#9BA0B0" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#181D1F' }}>Wingstop</span>
              </div>
              <p style={{ fontSize: 12, color: '#9BA0B0', textAlign: 'center', margin: '16px 0' }}>Map your hierarchy levels and click Preview</p>
            </div>
          ) : (
            <PreviewTree key={previewKey} previewItems={previewItems} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1 — Upload File ──────────────────────────────────────────────────────
function Step1({ csv, onFileLoad, inputRef }: { csv: ParsedCSV | null; onFileLoad: (csv: ParsedCSV, name: string, rowCount: number) => void; inputRef: React.RefObject<HTMLInputElement> }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setFileName(file.name);
      setRowCount(parsed.rows.length);
      onFileLoad(parsed, file.name, parsed.rows.length);
    };
    reader.readAsText(file);
  }, [onFileLoad]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div
          onClick={() => !csv && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? '#1678C2' : '#DBDBDB'}`,
            borderRadius: 8, background: dragging ? '#E1F5FF' : '#FAFBFC',
            padding: '48px 24px', textAlign: 'center',
            cursor: csv ? 'default' : 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          {csv ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <Icon path={mdiFileUploadOutline} size={40} color="#1678C2" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#181D1F', marginBottom: 4 }}>{fileName}</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                {rowCount.toLocaleString()} rows · {csv.headers.length} columns
              </div>
              <button
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1358A0', fontSize: 13, textTransform: 'uppercase', letterSpacing: '1.25px', padding: '4px 8px', borderRadius: 4, fontFamily: 'Open Sans, sans-serif' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E1F5FF')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >Replace file</button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <Icon path={mdiCloudUploadOutline} size={40} color="#9BA0B0" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#555555', marginBottom: 4 }}>Drop your CSV file here</div>
              <div style={{ fontSize: 13, color: '#9BA0B0' }}>or click to browse</div>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {csv && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Detected Columns</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {csv.headers.map(h => (
              <span key={h} style={{ border: '1px solid #DBDBDB', borderRadius: 12, padding: '3px 10px', fontSize: 12, color: '#555555', background: '#fff' }}>{h}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 2 — Map Location Fields ──────────────────────────────────────────────
const SYSTEM_FIELDS = [
  { key: 'externalId', label: 'External ID', required: true, matchHints: ['storeid', 'storeno', 'externalid', 'locationid', 'id'] },
  { key: 'locationName', label: 'Location Name', required: true, matchHints: ['locationname', 'storename', 'name'] },
  { key: 'address', label: 'Address', required: false, matchHints: ['address', 'street', 'addr'] },
  { key: 'city', label: 'City', required: false, matchHints: ['city'] },
  { key: 'state', label: 'State', required: false, matchHints: ['state', 'province'] },
  { key: 'postalCode', label: 'Postal Code', required: false, matchHints: ['zip', 'postal', 'postalcode', 'zipcode'] },
  { key: 'phone', label: 'Phone', required: false, matchHints: ['phone', 'phonenumber', 'tel'] },
  { key: 'timezone', label: 'Timezone', required: false, matchHints: ['timezone', 'tz'] },
  { key: 'status', label: 'Status', required: false, matchHints: ['status', 'active'] },
];

function autoMatch(headers: string[], hints: string[]): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const h of headers) {
    if (hints.some(hint => norm(h).includes(norm(hint)) || norm(hint).includes(norm(h)))) return h;
  }
  return '';
}

interface FieldMapping { [key: string]: string }

// ── Custom select ─────────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string }

function CustomSelect({ value, options, onChange, maxWidth = 300, height = 36, fontSize = 14 }: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  maxWidth?: number;
  height?: number;
  fontSize?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center',
          width: '100%', height, padding: '0 32px 0 12px',
          border: `1px solid ${open ? '#1678C2' : '#BABABA'}`,
          borderRadius: 4, background: '#fff',
          fontSize, color: selected?.value ? '#555555' : '#9BA0B0',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'Open Sans, sans-serif',
          boxSizing: 'border-box', outline: 'none',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : '— Not mapped —'}
        </span>
      </button>
      <span style={{ position: 'absolute', right: 8, top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, pointerEvents: 'none', transition: 'transform 0.15s', display: 'flex' }}>
        <Icon path={mdiChevronDown} size={16} color="#6B7280" />
      </span>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, background: '#fff', border: '1px solid #BABABA', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 220, overflowY: 'auto', width: '100%', marginTop: 2 }}>
          {options.map(opt => {
            const isSel = opt.value === value;
            return (
              <div
                key={opt.value}
                onMouseDown={() => { onChange(opt.value); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', fontSize, cursor: 'pointer', color: isSel ? '#1678C2' : '#555555', background: isSel ? '#E1F5FF' : '#fff', fontFamily: 'Open Sans, sans-serif' }}
                onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSel ? '#E1F5FF' : '#fff'; }}
              >
                <span>{opt.label}</span>
                {isSel && <Icon path={mdiCheck} size={14} color="#1678C2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Step2({ csv, mapping, onMappingChange }: {
  csv: ParsedCSV;
  mapping: FieldMapping;
  onMappingChange: (m: FieldMapping) => void;
}) {
  const statusCol = mapping['status'];
  const statusValues = statusCol ? distinctValues(csv.rows, statusCol) : new Map<string, number>();

  const [statusMapping, setStatusMapping] = useState<Record<string, 'Active' | 'Inactive'>>(() => {
    const m: Record<string, 'Active' | 'Inactive'> = {};
    statusValues.forEach((_, v) => {
      const norm = v.toLowerCase();
      m[v] = (norm === 'closed' || norm === 'inactive' || norm.includes('closed')) ? 'Inactive' : 'Active';
    });
    return m;
  });

  const required = SYSTEM_FIELDS.filter(f => f.required);
  const optional = SYSTEM_FIELDS.filter(f => !f.required);

  const renderField = (field: typeof SYSTEM_FIELDS[0]) => (
    <div key={field.key} style={{ display: 'flex', alignItems: 'center', minHeight: 44, borderBottom: '1px solid #F3F3F4', padding: '8px 0' }}>
      <div style={{ flex: '0 0 200px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, color: '#181D1F' }}>{field.label}</span>
        {field.required
          ? <span style={{ fontSize: 10, fontWeight: 500, background: '#FEF2F2', color: '#E53935', border: '1px solid #FECACA', borderRadius: 4, padding: '2px 6px' }}>REQUIRED</span>
          : <span style={{ fontSize: 10, fontWeight: 500, background: '#F9FAFB', color: '#6B7280', border: '1px solid #DBDBDB', borderRadius: 4, padding: '2px 6px' }}>OPTIONAL</span>
        }
      </div>
      <div style={{ flex: 1 }}>
        <CustomSelect
          value={mapping[field.key] ?? ''}
          options={[{ value: '', label: '— Not mapped —' }, ...csv.headers.map(h => ({ value: h, label: h }))]}
          onChange={v => onMappingChange({ ...mapping, [field.key]: v })}
        />
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Required Fields</div>
        <div>{required.map(renderField)}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Optional Fields</div>
        <div>{optional.map(renderField)}</div>
      </div>

      {statusCol && statusValues.size > 0 && (
        <div style={{ background: '#F9FAFB', border: '1px solid #DBDBDB', borderRadius: 4, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Status Value Mapping</div>
          {Array.from(statusValues.entries()).map(([val, count]) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#181D1F', flex: '0 0 160px' }}>{val || '(blank)'}</span>
              <span style={{ fontSize: 12, color: '#9BA0B0', flex: '0 0 80px' }}>{count.toLocaleString()} rows</span>
              <CustomSelect
                value={statusMapping[val] ?? 'Active'}
                options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
                onChange={v => setStatusMapping(prev => ({ ...prev, [val]: v as 'Active' | 'Inactive' }))}
                maxWidth={140}
                height={32}
                fontSize={13}
              />
              {!['active', 'inactive', 'closed'].includes(val.toLowerCase()) && val && (
                <Icon path={mdiAlertCircleOutline} size={14} color="#F59E0B" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 3 — Define Hierarchy Levels ─────────────────────────────────────────
function Step3({ csv, mapping, hierarchyLevels, onLevelsChange }: {
  csv: ParsedCSV;
  mapping: FieldMapping;
  hierarchyLevels: HierarchyLevel[];
  onLevelsChange: (levels: HierarchyLevel[]) => void;
}) {
  const [expandedValues, setExpandedValues] = useState<Set<string>>(new Set());
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [emptyZoneDragOver, setEmptyZoneDragOver] = useState(false);
  const [hoveredLevelId, setHoveredLevelId] = useState<string | null>(null);

  const mappedCols = new Set(Object.values(mapping).filter(Boolean));
  const available = csv.headers.filter(h => !mappedCols.has(h) && !hierarchyLevels.some(l => l.column === h));

  const handleDragStartAvail = (e: React.DragEvent, col: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'available', col }));
  };

  const handleDragStartLevel = (e: React.DragEvent, id: string, fromIndex: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'level', id, fromIndex }));
  };

  const handleDropOnLevels = (e: React.DragEvent, toIndex?: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    const data = JSON.parse(raw);

    if (data.type === 'available') {
      const newLevel: HierarchyLevel = { id: `lvl_${Date.now()}`, column: data.col, label: data.col };
      const next = [...hierarchyLevels];
      next.splice(toIndex ?? next.length, 0, newLevel);
      onLevelsChange(next);
    } else if (data.type === 'level') {
      const from = data.fromIndex as number;
      const to = toIndex ?? hierarchyLevels.length;
      if (from === to) return;
      const next = [...hierarchyLevels];
      const [moved] = next.splice(from, 1);
      next.splice(to > from ? to - 1 : to, 0, moved);
      onLevelsChange(next);
    }
  };

  const handleDropOnAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.type === 'level') {
      onLevelsChange(hierarchyLevels.filter((_, i) => i !== data.fromIndex));
    }
  };

  const removeLevel = (id: string) => {
    onLevelsChange(hierarchyLevels.filter(l => l.id !== id));
  };

  const addLevelFromAvailable = (col: string) => {
    const newLevel: HierarchyLevel = { id: `lvl_${Date.now()}`, column: col, label: col };
    onLevelsChange([...hierarchyLevels, newLevel]);
  };

  const updateLabel = (id: string, label: string) => {
    onLevelsChange(hierarchyLevels.map(l => l.id === id ? { ...l, label } : l));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Available columns */}
        <div
          style={{ flex: '0 0 40%', minHeight: 200 }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDropOnAvailable}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Available Columns</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {available.length === 0 && (
              <div style={{ fontSize: 13, color: '#9BA0B0', padding: '16px 12px', textAlign: 'center' }}>All columns assigned</div>
            )}
            {available.map(col => (
              <div
                key={col}
                draggable
                onDragStart={e => handleDragStartAvail(e, col)}
                onClick={() => addLevelFromAvailable(col)}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #DBDBDB', borderRadius: 4, padding: '10px 12px', background: '#fff', cursor: 'grab' }}
                title="Drag to hierarchy or click to add"
              >
                <Icon path={mdiDragVertical} size={16} color="#9BA0B0" />
                <span style={{ fontSize: 14, color: '#181D1F' }}>{col}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hierarchy levels */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Hierarchy Levels (drag to reorder)</div>

          <div
            onDragEnter={() => { if (hierarchyLevels.length === 0) setEmptyZoneDragOver(true); }}
            onDragOver={e => { e.preventDefault(); setDragOverIndex(hierarchyLevels.length); if (hierarchyLevels.length === 0) setEmptyZoneDragOver(true); }}
            onDragLeave={() => { setDragOverIndex(null); setEmptyZoneDragOver(false); }}
            onDrop={e => { setEmptyZoneDragOver(false); handleDropOnLevels(e); }}
            style={{
              minHeight: hierarchyLevels.length === 0 ? 120 : undefined,
              border: hierarchyLevels.length === 0 ? `2px ${emptyZoneDragOver ? 'solid' : 'dashed'} ${emptyZoneDragOver ? '#1678C2' : '#DBDBDB'}` : 'none',
              borderRadius: 4,
              padding: hierarchyLevels.length === 0 ? 24 : 0,
              paddingBottom: hierarchyLevels.length > 0 ? 48 : undefined,
              display: 'flex', flexDirection: 'column', gap: 6,
              alignItems: hierarchyLevels.length === 0 ? 'center' : 'stretch',
              justifyContent: hierarchyLevels.length === 0 ? 'center' : 'flex-start',
            }}
          >
            {hierarchyLevels.length === 0 && (
              <span style={{ fontSize: 13, color: emptyZoneDragOver ? '#1678C2' : '#9BA0B0' }}>Drag columns here to define your hierarchy levels</span>
            )}

            {hierarchyLevels.map((lvl, i) => {
              const indentLeft = i * 20;
              const vals = distinctValues(csv.rows, lvl.column);
              const isExpanded = expandedValues.has(lvl.id);
              const isEditing = editingLabelId === lvl.id;

              return (
                <div key={lvl.id}>
                  {/* Drop zone above */}
                  <div
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOverIndex(i); }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={e => { e.stopPropagation(); handleDropOnLevels(e, i); }}
                    style={{ height: dragOverIndex === i ? 3 : 3, background: dragOverIndex === i ? '#1678C2' : 'transparent', borderRadius: 2, marginBottom: 3, transition: 'background 0.1s' }}
                  />

                  <div
                    style={{ border: '1px solid #DBDBDB', borderRadius: 4, background: '#fff', marginLeft: indentLeft }}
                    onMouseEnter={() => setHoveredLevelId(lvl.id)}
                    onMouseLeave={() => setHoveredLevelId(null)}
                  >
                    {/* Card header */}
                    <div
                      draggable
                      onDragStart={e => handleDragStartLevel(e, lvl.id, i)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '3px solid #1678C2', borderRadius: '2px 0 0 2px', padding: '10px 12px', cursor: 'grab' }}
                    >
                      <span style={{ display: 'flex', alignSelf: 'stretch', alignItems: 'center', flexShrink: 0 }}>
                        <Icon path={mdiDragVertical} size={20} color="#9BA0B0" />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                          <input
                            autoFocus
                            value={lvl.label}
                            onChange={e => updateLabel(lvl.id, e.target.value)}
                            onBlur={() => setEditingLabelId(null)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingLabelId(null); }}
                            style={{ fontSize: 14, fontWeight: 500, color: '#181D1F', border: '1px solid #1678C2', borderRadius: 4, padding: '2px 6px', outline: 'none', fontFamily: 'Open Sans, sans-serif', width: '100%' }}
                          />
                        ) : (
                          <div
                            onClick={() => setEditingLabelId(lvl.id)}
                            style={{ display: 'flex', alignItems: 'center', cursor: hoveredLevelId === lvl.id ? 'pointer' : 'text' }}
                          >
                            <span style={{ fontSize: 14, fontWeight: 500, color: '#181D1F' }}>{lvl.label}</span>
                            {hoveredLevelId === lvl.id && (
                              <span style={{ display: 'flex', alignItems: 'center', color: '#1678C2', marginLeft: 6, flexShrink: 0 }}>
                                <Icon path={mdiPencil} size={14} />
                              </span>
                            )}
                          </div>
                        )}
                        {lvl.label !== lvl.column && (
                          <div style={{ fontSize: 12, color: '#9BA0B0' }}>from: {lvl.column}</div>
                        )}
                        {/* Disclosure row */}
                        <div
                          onClick={() => setExpandedValues(prev => { const next = new Set(prev); next.has(lvl.id) ? next.delete(lvl.id) : next.add(lvl.id); return next; })}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderTop: '1px solid #F3F3F4', marginTop: 8, paddingTop: 6 }}
                        >
                          <span style={{ fontSize: 12, color: '#6B7280' }}>{vals.size} values</span>
                          <span style={{ display: 'flex', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
                            <Icon path={mdiChevronDown} size={16} color="#6B7280" />
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeLevel(lvl.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'transparent', borderRadius: 4, cursor: 'pointer', color: '#9BA0B0', flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#E53935')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#9BA0B0')}
                        title="Remove level"
                      >
                        <Icon path={mdiClose} size={14} />
                      </button>
                    </div>
                    {/* Expanded values */}
                    {isExpanded && (
                      <div style={{ padding: '8px 12px', borderTop: '1px solid #F3F3F4' }}>
                        {Array.from(vals.entries()).map(([val, count]) => (
                          <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', fontSize: 13, color: '#555555' }}>
                            {count === 1 && <Icon path={mdiAlertCircleOutline} size={12} color="#F59E0B" />}
                            <span style={{ flex: 1 }}>{val || '(blank)'}</span>
                            <span style={{ color: '#9BA0B0', fontSize: 12 }}>{count.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Drop zone at end */}
            {hierarchyLevels.length > 0 && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOverIndex(hierarchyLevels.length); }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={e => handleDropOnLevels(e, hierarchyLevels.length)}
                style={{ height: dragOverIndex === hierarchyLevels.length ? 3 : 3, background: dragOverIndex === hierarchyLevels.length ? '#1678C2' : 'transparent', borderRadius: 2, transition: 'background 0.1s' }}
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Step 4 — Location Attributes ──────────────────────────────────────────────
function Step4({ csv, mapping, hierarchyLevels, selectedAttrs, onAttrsChange }: {
  csv: ParsedCSV;
  mapping: FieldMapping;
  hierarchyLevels: HierarchyLevel[];
  selectedAttrs: Set<string>;
  onAttrsChange: (attrs: Set<string>) => void;
}) {
  const mappedCols = new Set(Object.values(mapping).filter(Boolean));
  const hierarchyCols = new Set(hierarchyLevels.map(l => l.column));
  const available = csv.headers.filter(h => !mappedCols.has(h) && !hierarchyCols.has(h));
  const rowCount = csv.rows.length;

  const toggleAll = () => {
    if (selectedAttrs.size === available.length) onAttrsChange(new Set());
    else onAttrsChange(new Set(available));
  };

  const toggle = (col: string) => {
    const next = new Set(selectedAttrs);
    next.has(col) ? next.delete(col) : next.add(col);
    onAttrsChange(next);
  };

  if (available.length === 0) {
    return <div style={{ fontSize: 13, color: '#9BA0B0', padding: 24, textAlign: 'center' }}>No remaining columns to import as attributes.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Location Attributes</div>
        <button
          onClick={toggleAll}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1358A0', fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.25px', padding: '4px 8px', borderRadius: 4, fontFamily: 'Open Sans, sans-serif' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E1F5FF')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {selectedAttrs.size === available.length ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {available.map(col => (
          <label key={col} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F3F3F4', cursor: 'pointer' }}>
            <div
              onClick={() => toggle(col)}
              style={{
                width: 16, height: 16, borderRadius: 3, border: `2px solid ${selectedAttrs.has(col) ? '#1678C2' : '#BABABA'}`,
                background: selectedAttrs.has(col) ? '#1678C2' : '#fff', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              {selectedAttrs.has(col) && <Icon path={mdiCheck} size={10} color="#fff" />}
            </div>
            <span style={{ fontSize: 14, color: '#181D1F', flex: 1 }}>{col}</span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>{rowCount.toLocaleString()} values</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Step 5 — Preview & Commit ─────────────────────────────────────────────────
function Step5({ csv, mapping, hierarchyLevels, selectedAttrs, onCommit, committing }: {
  csv: ParsedCSV;
  mapping: FieldMapping;
  hierarchyLevels: HierarchyLevel[];
  selectedAttrs: Set<string>;
  onCommit: () => void;
  committing: boolean;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  const externalIdCol = mapping['externalId'];
  const nameCol = mapping['locationName'];

  const extIds = csv.rows.map(r => r[externalIdCol]?.trim()).filter(Boolean);
  const uniqueExtIds = new Set(extIds);
  const duplicateCount = extIds.length - uniqueExtIds.size;
  const blankIdCount = csv.rows.filter(r => !r[externalIdCol]?.trim()).length;
  const blankNameCount = csv.rows.filter(r => !r[nameCol]?.trim()).length;

  const { ungroupedIds } = useMemo(() => buildTreeItems(csv.rows, hierarchyLevels, externalIdCol, nameCol), []);

  const ungroupedCount = ungroupedIds.length;
  const locationCount = uniqueExtIds.size;
  const orgUnitCount = (() => {
    const seen = new Set<string>();
    csv.rows.forEach(row => {
      let path = '';
      for (const lvl of hierarchyLevels) {
        const val = row[lvl.column]?.trim();
        if (!val) break;
        path += `/${val}`;
        seen.add(path);
      }
    });
    return seen.size;
  })();

  const hasBlockingErrors = duplicateCount > 0 || blankIdCount > 0 || blankNameCount > 0;
  const hasWarnings = ungroupedCount > 0;
  const canCommit = !hasBlockingErrors && (!hasWarnings || acknowledged);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: 'Locations', value: locationCount, color: '#181D1F' },
          { label: 'Org Units', value: orgUnitCount, color: '#181D1F' },
          { label: 'Attributes', value: selectedAttrs.size, color: '#181D1F' },
          { label: 'Ungrouped', value: ungroupedCount, color: ungroupedCount > 0 ? '#E53935' : '#181D1F' },
        ].map(card => (
          <div key={card.label} style={{ flex: 1, background: '#fff', border: '1px solid #BABABA', borderRadius: 4, padding: '12px 18px', minWidth: 100 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value.toLocaleString()}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Validation */}
      {(hasBlockingErrors || hasWarnings) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {hasBlockingErrors && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E53935', marginBottom: 8 }}>Blocking Errors — Must resolve before import</div>
              {duplicateCount > 0 && <div style={{ fontSize: 13, color: '#E53935' }}>• {duplicateCount} duplicate External ID value{duplicateCount !== 1 ? 's' : ''} found</div>}
              {blankIdCount > 0 && <div style={{ fontSize: 13, color: '#E53935' }}>• {blankIdCount} row{blankIdCount !== 1 ? 's' : ''} missing External ID</div>}
              {blankNameCount > 0 && <div style={{ fontSize: 13, color: '#E53935' }}>• {blankNameCount} row{blankNameCount !== 1 ? 's' : ''} missing Location Name</div>}
            </div>
          )}

          {hasWarnings && (
            <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 4, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 8 }}>Warning</div>
              <div style={{ fontSize: 13, color: '#92400E', marginBottom: 10 }}>
                {ungroupedCount} location{ungroupedCount !== 1 ? 's' : ''} have incomplete hierarchy data and will be placed in Ungrouped.
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div
                  onClick={() => setAcknowledged(a => !a)}
                  style={{
                    width: 16, height: 16, borderRadius: 3, border: `2px solid ${acknowledged ? '#1678C2' : '#BABABA'}`,
                    background: acknowledged ? '#1678C2' : '#fff', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  {acknowledged && <Icon path={mdiCheck} size={10} color="#fff" />}
                </div>
                <span style={{ fontSize: 13, color: '#92400E' }}>
                  I understand {ungroupedCount} location{ungroupedCount !== 1 ? 's' : ''} will be placed in Ungrouped and can be assigned later.
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Commit section */}
      {!hasBlockingErrors && (
        <div style={{ background: '#fff', border: '1px solid #DBDBDB', borderRadius: 4, padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#27B872' }}>
            <Icon path={mdiCheck} size={20} color="#27B872" />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#27B872' }}>
              Ready to import — {locationCount.toLocaleString()} locations, {orgUnitCount.toLocaleString()} org units, {selectedAttrs.size} attributes
            </span>
          </div>
          <button
            onClick={canCommit && !committing ? onCommit : undefined}
            disabled={!canCommit || committing}
            style={{
              background: canCommit && !committing ? '#1678C2' : '#EAEAEA',
              color: canCommit && !committing ? '#fff' : 'rgba(0,0,0,0.38)',
              border: 'none', borderRadius: 4, padding: '8px 32px',
              fontSize: 13, fontWeight: 500, textTransform: 'uppercase',
              letterSpacing: '0.05em', cursor: canCommit && !committing ? 'pointer' : 'default',
              fontFamily: 'Open Sans, sans-serif',
            }}
          >
            {committing ? 'IMPORTING...' : 'COMMIT IMPORT'}
          </button>
          <p style={{ fontSize: 12, color: '#9BA0B0', margin: 0, textAlign: 'center' }}>
            This will replace the current hierarchy. An audit record will be generated.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function OrgHierarchyImportPage() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(true);

  const [step, setStep] = useState<WizardStep>(1);
  const [maxReached, setMaxReached] = useState<WizardStep>(1);

  const [csv, setCsv] = useState<ParsedCSV | null>(null);

  const [mapping, setMapping] = useState<FieldMapping>({});

  const [hierarchyLevels, setHierarchyLevels] = useState<HierarchyLevel[]>([]);
  const [previewItems, setPreviewItems] = useState<ItemRecord>({
    root: { index: 'root', isFolder: true, data: { name: 'Wingstop', isLocation: false, isRoot: true }, children: [] },
  });
  const [hasPreview, setHasPreview] = useState(false);
  const [mappingChanged, setMappingChanged] = useState(false);

  const [selectedAttrs, setSelectedAttrs] = useState<Set<string>>(new Set());

  const [committing, setCommitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File loaded ─────────────────────────────────────────────────────────────
  const handleFileLoad = useCallback((parsed: ParsedCSV) => {
    setCsv(parsed);
    // Auto-map fields
    const auto: FieldMapping = {};
    SYSTEM_FIELDS.forEach(field => {
      const match = autoMatch(parsed.headers, field.matchHints);
      if (match) auto[field.key] = match;
    });
    setMapping(auto);
    // Pre-select all attrs
    const mappedCols = new Set(Object.values(auto).filter(Boolean));
    setSelectedAttrs(new Set(parsed.headers.filter(h => !mappedCols.has(h))));
  }, []);

  // ── Hierarchy levels changed — mark mapping as changed ────────────────────
  const handleLevelsChange = useCallback((levels: HierarchyLevel[]) => {
    setHierarchyLevels(levels);
    if (hasPreview) setMappingChanged(true);
  }, [hasPreview]);

  // ── Preview ──────────────────────────────────────────────────────────────
  const handlePreview = useCallback(() => {
    if (!csv || !mapping['externalId'] || !mapping['locationName']) return;
    const { items } = buildTreeItems(csv.rows, hierarchyLevels, mapping['externalId'], mapping['locationName']);
    setPreviewItems(items);
    setHasPreview(true);
    setMappingChanged(false);
  }, [csv, hierarchyLevels, mapping]);

  // ── Attrs auto-update when mapping changes ────────────────────────────────
  const handleMappingChange = useCallback((m: FieldMapping) => {
    setMapping(m);
    if (csv) {
      const mappedCols = new Set(Object.values(m).filter(Boolean));
      const hierarchyCols = new Set(hierarchyLevels.map(l => l.column));
      setSelectedAttrs(new Set(csv.headers.filter(h => !mappedCols.has(h) && !hierarchyCols.has(h))));
    }
    if (hasPreview) setMappingChanged(true);
  }, [csv, hierarchyLevels, hasPreview]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goToStep = useCallback((s: WizardStep) => {
    setStep(s);
    if (s > maxReached) setMaxReached(s);
  }, [maxReached]);

  const canAdvance = useCallback((): boolean => {
    if (step === 1) return !!csv;
    if (step === 2) return !!(mapping['externalId'] && mapping['locationName']);
    if (step === 3) return hierarchyLevels.length > 0;
    if (step === 4) return true;
    return false;
  }, [step, csv, mapping, hierarchyLevels]);

  const handleNext = () => {
    if (!canAdvance()) return;
    goToStep((step + 1) as WizardStep);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
    else navigate('/admin/org');
  };

  // ── Commit ────────────────────────────────────────────────────────────────
  const handleCommit = useCallback(() => {
    if (!csv || !mapping['externalId'] || !mapping['locationName']) return;
    setCommitting(true);

    const { items, ungroupedIds } = buildTreeItems(
      csv.rows, hierarchyLevels, mapping['externalId'], mapping['locationName']
    );

    // Store committed data in sessionStorage for OrgScopePage to pick up
    try {
      sessionStorage.setItem('orgImportResult', JSON.stringify({ items, ungroupedIds }));
    } catch (_) { /* storage full or unavailable — silently skip */ }

    setTimeout(() => {
      navigate('/admin/org');
    }, 1500);
  }, [csv, mapping, hierarchyLevels, navigate]);

  // ── Panel visibility ──────────────────────────────────────────────────────
  const showPreviewPanel = step >= 3;

  return (
    <>
    {showModal && createPortal(
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 4, border: '1px solid #DBDBDB', padding: 28, maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', margin: '0 16px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#555555', marginBottom: 16 }}>Before You Begin</div>
          <p style={{ fontSize: 13, color: '#555555', margin: 0, lineHeight: 1.6 }}>
            <strong>Important:</strong> This wizard will build your org hierarchy from a CSV file. Your file should have one row per location with columns for location identifiers, hierarchy levels, and any location attributes you want to import.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button
              onClick={() => navigate('/admin/org')}
              style={{ background: '#fff', color: '#1678C2', border: '1px solid #1678C2', borderRadius: 4, padding: '8px 16px', fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'Open Sans, sans-serif' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F3F3F4')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
            >CANCEL</button>
            <button
              onClick={() => { setShowModal(false); fileInputRef.current?.click(); }}
              style={{ background: '#1678C2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 24px', fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', fontFamily: 'Open Sans, sans-serif' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1565A8')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1678C2')}
            >CONTINUE</button>
          </div>
        </div>
      </div>,
      document.body
    )}
    <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: 'Open Sans, sans-serif', paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Left sidebar — step navigator ── */}
        <div style={{ flex: '0 0 200px', background: '#fff', border: '1px solid #DBDBDB', borderRadius: 4, padding: '16px 12px', position: 'sticky', top: 68 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, paddingLeft: 10 }}>Import Steps</div>
          <StepNav current={step} maxReached={maxReached} onNavigate={goToStep} />
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #DBDBDB', borderRadius: 4, padding: '24px 28px' }}>
            {/* Step header */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #DBDBDB' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Step {step} of 5</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#181D1F' }}>{STEP_LABELS[step - 1]}</div>
            </div>

            {/* Step content */}
            {step === 1 && <Step1 csv={csv} onFileLoad={handleFileLoad} inputRef={fileInputRef} />}
            {step === 2 && csv && <Step2 csv={csv} mapping={mapping} onMappingChange={handleMappingChange} />}
            {step === 3 && csv && (
              <Step3
                csv={csv}
                mapping={mapping}
                hierarchyLevels={hierarchyLevels}
                onLevelsChange={handleLevelsChange}
              />
            )}
            {step === 4 && csv && (
              <Step4 csv={csv} mapping={mapping} hierarchyLevels={hierarchyLevels} selectedAttrs={selectedAttrs} onAttrsChange={setSelectedAttrs} />
            )}
            {step === 5 && csv && (
              <Step5 csv={csv} mapping={mapping} hierarchyLevels={hierarchyLevels} selectedAttrs={selectedAttrs} onCommit={handleCommit} committing={committing} />
            )}
          </div>
        </div>

        {/* ── Right panel — hierarchy preview ── */}
        <HierarchyPreviewPanel
          previewItems={previewItems}
          showPanel={showPreviewPanel}
          hasPreview={hasPreview}
          mappingChanged={mappingChanged}
          onPreview={handlePreview}
          levelsCount={hierarchyLevels.length}
        />
      </div>

      {/* ── Sticky footer ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #DBDBDB', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
        <button
          onClick={handleBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1358A0', fontSize: 14, textTransform: 'uppercase', letterSpacing: '1.25px', padding: '4px 12px', borderRadius: 4, fontFamily: 'Open Sans, sans-serif' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E1F5FF')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {step === 1 ? 'CANCEL' : 'BACK'}
        </button>

        <span style={{ fontSize: 13, color: '#9BA0B0' }}>Step {step} of 5</span>

        {step < 5 ? (
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            style={{
              background: canAdvance() ? '#1678C2' : '#EAEAEA',
              color: canAdvance() ? '#fff' : 'rgba(0,0,0,0.38)',
              border: 'none', borderRadius: 4, padding: '8px 24px',
              fontSize: 13, fontWeight: 500, textTransform: 'uppercase',
              letterSpacing: '0.05em', cursor: canAdvance() ? 'pointer' : 'default',
              fontFamily: 'Open Sans, sans-serif',
            }}
          >
            NEXT
          </button>
        ) : (
          <div style={{ width: 80 }} />
        )}
      </div>
    </div>
    </>
  );
}
