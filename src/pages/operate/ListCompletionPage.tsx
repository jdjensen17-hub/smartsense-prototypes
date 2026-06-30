import { useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import type { GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  Search, Clock, AlarmClock, BellOff, Trophy, ChevronDown,
  PenLine, Calendar, X, MoreVertical, Plus, Check,
} from 'lucide-react';

ModuleRegistry.registerModules([AllCommunityModule]);

// ── Types ───────────────────────────────────────────────────────────────────
interface Assignee {
  name: string;
  initials: string;
  color: string;
}

interface Attribution {
  name: string;
  completedAt: string;
}

interface ListInstance {
  id: string;
  name: string;
  due: Date | null;
  completed: number;
  total: number;
  assignee: Assignee | null;
}

interface ListItem {
  id: string;
  type: 'subtitle' | 'text' | 'checkmark' | 'yes_no' | 'free_response' | 'signature';
  label?: string;
  prompt?: string;
  completed?: boolean;
  selectedOption?: 'YES' | 'NO' | null;
  response?: string;
  attribution?: Attribution;
  assignedTo?: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_LOCATION = 'Discovery Lab 1';

const MOCK_LISTS: ListInstance[] = [
  {
    id: '1',
    name: 'Inventory Sheet',
    due: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completed: 0,
    total: 3,
    assignee: null,
  },
  {
    id: '2',
    name: 'Cash Sheet',
    due: new Date(Date.now() + 5 * 60 * 60 * 1000),
    completed: 0,
    total: 7,
    assignee: null,
  },
  {
    id: '3',
    name: 'Air BnB Cleanup List',
    due: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    completed: 3,
    total: 40,
    assignee: { name: 'Donna Teammember', initials: 'DT', color: '#7B3FA0' },
  },
  {
    id: '4',
    name: 'Scheduled List',
    due: new Date(Date.now() + 26 * 60 * 60 * 1000),
    completed: 0,
    total: 1,
    assignee: null,
  },
  {
    id: '5',
    name: 'Admin List',
    due: null,
    completed: 3,
    total: 5,
    assignee: null,
  },
];

const MOCK_ITEMS: ListItem[] = [
  { id: 'i1', type: 'subtitle', label: 'Laundry' },
  {
    id: 'i2', type: 'checkmark', prompt: 'Wash sheets and pillow cases',
    completed: true,
    attribution: { name: 'Donna Teammember', completedAt: 'Jun 30, 11:21am' },
  },
  {
    id: 'i3', type: 'checkmark', prompt: 'Bathroom towels, hand cloths, floor mat',
    completed: true,
    attribution: { name: 'Donna Teammember', completedAt: 'Jun 30, 11:21am' },
  },
  {
    id: 'i4', type: 'checkmark', prompt: 'Kitchen hand towels',
    completed: false, assignedTo: 'Jim Jensen',
  },
  { id: 'i5', type: 'subtitle', label: 'Bedroom' },
  {
    id: 'i6', type: 'yes_no', prompt: 'Did you make the bed and fluff all pillows?',
    selectedOption: 'YES',
    attribution: { name: 'Donna Teammember', completedAt: 'Jun 30, 11:22am' },
  },
  {
    id: 'i7', type: 'free_response',
    prompt: 'Note any condition issues with the bedroom that need attention before the next guest arrives.',
    response: '', completed: false,
  },
  {
    id: 'i8', type: 'text',
    label: 'Sign below to certify the room is guest-ready.',
  },
  {
    id: 'i9', type: 'signature', prompt: 'Certified clean by',
    completed: false,
  },
];

// ── Time helpers ────────────────────────────────────────────────────────────
function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTime(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h < 12 ? 'am' : 'pm';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${pad(m)} ${ap}`;
}

function dayDelta(now: Date, due: Date) {
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d1 = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  return Math.round((d1 - d0) / 86400000);
}

function formatRelative(due: Date, now: Date, long = false) {
  const diff = due.getTime() - now.getTime();
  const dd = dayDelta(now, due);
  if (dd === 0) return `${formatTime(due)} today`;
  if (dd === 1) return 'tomorrow';
  if (diff < 86400000) {
    const h = Math.max(1, Math.round(diff / 3600000));
    return long ? `in ${h} hours` : `in ${h}h`;
  }
  return long ? `in ${dd} days` : `in ${dd}d`;
}

interface DueDisplay {
  dot: string;
  text: string;
  color: string;
  weight: number;
}

function getDueDisplay(due: Date | null, now: Date): DueDisplay {
  if (!due) {
    return { dot: 'var(--ss-grey-300)', text: 'No deadline', color: 'var(--ss-fg-tertiary)', weight: 400 };
  }
  const diff = due.getTime() - now.getTime();
  if (diff < 0) {
    return { dot: 'var(--ss-danger)', text: `Past due · ${formatTime(due)}`, color: 'var(--ss-danger-dark)', weight: 600 };
  }
  if (diff < 6 * 60 * 60 * 1000) {
    const h = Math.max(1, Math.round(diff / 3600000));
    return { dot: 'var(--ss-warning)', text: `${formatTime(due)} (in ${h}h)`, color: 'var(--ss-warning-dark)', weight: 600 };
  }
  return { dot: 'var(--ss-grey-400)', text: formatRelative(due, now), color: 'var(--ss-fg-secondary)', weight: 400 };
}

function dueDateComparator(a: Date | null, b: Date | null) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a.getTime() - b.getTime();
}

// ── Cell renderers ────────────────────────────────────────────────────────────
function ListNameCell(p: { data: ListInstance }) {
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ss-fg-primary)' }}>
      {p.data.name}
    </span>
  );
}

function DueCell(p: { data: ListInstance }) {
  const d = getDueDisplay(p.data.due, new Date());
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--ss-space-1)',
      fontSize: 13, color: d.color, fontWeight: d.weight,
    }}>
      <span style={{ width: 7, height: 7, flexShrink: 0, borderRadius: 'var(--ss-rd-pill)', background: d.dot }} />
      {d.text}
    </span>
  );
}

function ProgressCell(p: { data: ListInstance }) {
  const { completed, total } = p.data;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--ss-space-2)' }}>
      <span style={{
        width: 56, height: 5, borderRadius: 'var(--ss-rd-pill)',
        background: 'var(--ss-grey-300)', overflow: 'hidden', flexShrink: 0,
      }}>
        <span style={{
          display: 'block', width: `${pct}%`, height: '100%',
          background: 'var(--ss-sky-blue)', borderRadius: 'var(--ss-rd-pill)',
        }} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ss-fg-secondary)' }}>
        {completed}/{total}
      </span>
    </span>
  );
}

function AssigneeCell(p: { data: ListInstance }) {
  const a = p.data.assignee;
  if (!a) {
    return <span style={{ fontSize: 13, color: 'var(--ss-fg-tertiary)' }}>Unassigned</span>;
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--ss-space-2)' }}>
      <Avatar size={22} color={a.color}>{a.initials}</Avatar>
      <span style={{ fontSize: 13, color: 'var(--ss-fg-primary)' }}>{a.name}</span>
    </span>
  );
}

// ── Shared bits ────────────────────────────────────────────────────────────
function Avatar({ size, color, children }: { size: number; color: string; children: React.ReactNode }) {
  return (
    <span style={{
      width: size, height: size, flexShrink: 0, borderRadius: 'var(--ss-rd-pill)',
      background: color, color: 'var(--ss-fg-on-dark)', fontSize: 10, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </span>
  );
}

const PURPLE = '#7B3FA0'; // persona/avatar color carried in mock data — not a DS token (DS purple is --ss-purple)

// ── Styled — layout ────────────────────────────────────────────────────────
const PageRoot = styled.div({
  label: 'list-completion-page',
  position: 'relative',
  height: 'calc(100vh - 100px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: 'var(--ss-bg-app)',
  fontFamily: 'var(--ss-font-sans)',
});

const Toolbar = styled.div({
  label: 'toolbar',
  display: 'flex',
  alignItems: 'flex-end',
  gap: 'var(--ss-space-3)',
  padding: '10px var(--ss-space-6)',
  backgroundColor: 'var(--ss-bg-app)',
  borderBottom: '1px solid var(--ss-border-default)',
});

const FieldGroup = styled.div({
  label: 'toolbar-field',
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
});

const FieldLabel = styled.span({
  label: 'toolbar-field-label',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--ss-fg-tertiary)',
});

const FilterControl = styled.div({
  label: 'filter-control',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--ss-space-2)',
  height: 32,
  minWidth: 160,
  padding: '0 10px',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ss-fg-primary)',
  backgroundColor: 'var(--ss-bg-surface)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  cursor: 'default',
});

const SearchWrap = styled.div({
  label: 'search-wrap',
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ss-space-2)',
  marginLeft: 'auto',
  height: 32,
  minWidth: 220,
  padding: '0 10px',
  backgroundColor: 'var(--ss-bg-surface)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
});

const SearchInput = styled.input({
  label: 'search-input',
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: 13,
  fontFamily: 'var(--ss-font-sans)',
  color: 'var(--ss-fg-primary)',
  '&::placeholder': { color: 'var(--ss-fg-tertiary)' },
});

const GridWrapper = styled.div({
  label: 'grid-wrapper',
  flex: 1,
  overflow: 'hidden',
  '--ag-background-color': 'var(--ss-bg-surface)',
  '--ag-header-background-color': 'var(--ss-bg-app)',
  '--ag-header-foreground-color': 'var(--ss-fg-secondary)',
  '--ag-border-color': 'var(--ss-border-default)',
  '--ag-row-border-color': 'var(--ss-grey-300)',
  '--ag-row-hover-color': 'var(--ss-bg-app)',
  '--ag-selected-row-background-color': 'var(--ss-pale-blue)',
  '--ag-font-family': 'var(--ss-font-sans)',
  '--ag-font-size': '13px',
  '--ag-header-height': '36px',
  '--ag-row-height': '48px',
  '--ag-cell-horizontal-padding': '20px',
} as Record<string, string | number>);

const Fab = styled.button({
  label: 'fab',
  position: 'absolute',
  bottom: 24,
  right: 24,
  zIndex: 5,
  width: 48,
  height: 48,
  borderRadius: 'var(--ss-rd-pill)',
  border: 'none',
  backgroundColor: 'var(--ss-sky-blue)',
  color: 'var(--ss-fg-on-dark)',
  boxShadow: 'var(--ss-shadow-fab)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': { backgroundColor: 'var(--ss-medium-blue)' },
});

const Scrim = styled.div({
  label: 'scrim',
  position: 'absolute',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.32)',
  zIndex: 10,
});

const SideSheet = styled.div({
  label: 'side-sheet',
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  width: 460,
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--ss-bg-surface)',
  boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.18)',
});

const SheetBody = styled.div({
  label: 'sheet-body',
  flex: 1,
  overflowY: 'auto',
});

const SheetFooter = styled.div({
  label: 'sheet-footer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px var(--ss-space-4)',
  borderTop: '1px solid var(--ss-border-default)',
});

const PrimaryButton = styled.button<{ enabled: boolean }>(({ enabled }) => ({
  label: 'button-primary',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-button)',
  fontWeight: 700,
  padding: '9px 16px',
  border: 'none',
  borderRadius: 'var(--ss-rd-4)',
  cursor: enabled ? 'pointer' : 'not-allowed',
  backgroundColor: enabled ? 'var(--ss-sky-blue)' : 'var(--ss-grey-400)',
  color: enabled ? 'var(--ss-fg-on-dark)' : 'var(--ss-fg-secondary)',
  '&:hover': enabled ? { backgroundColor: 'var(--ss-medium-blue)' } : {},
}));

const NeutralButton = styled.button({
  label: 'button-neutral',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-button)',
  fontWeight: 700,
  padding: '9px 16px',
  backgroundColor: 'var(--ss-bg-surface)',
  color: 'var(--ss-fg-primary)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  cursor: 'pointer',
});

const IconBtn = styled.button({
  label: 'icon-btn',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'inherit',
  padding: 2,
});

// ── Item banner helper ──────────────────────────────────────────────────────
function StateRow({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '3px var(--ss-space-4) 7px' }}>{children}</div>;
}

function AttributionBanner({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      color: 'var(--ss-fg-on-dark)', backgroundColor: 'var(--ss-sky-blue)',
      borderRadius: 'var(--ss-rd-4)', padding: '3px var(--ss-space-2)',
    }}>{text}</span>
  );
}

function AssignmentBanner({ text }: { text: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      color: 'var(--ss-fg-on-dark)', backgroundColor: PURPLE,
      borderRadius: 'var(--ss-rd-4)', padding: '3px var(--ss-space-2)',
    }}>{text}</span>
  );
}

function IncompleteChip() {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      color: 'var(--ss-fg-secondary)', backgroundColor: 'var(--ss-grey-300)',
      borderRadius: 'var(--ss-rd-4)', padding: '2px 7px',
    }}>Incomplete</span>
  );
}

// ── Item row chrome ───────────────────────────────────────────────────────────
const ItemRow = styled.div({
  label: 'item-row',
  borderBottom: '1px solid var(--ss-grey-300)',
});

const ItemMain = styled.div({
  label: 'item-row-main',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 'var(--ss-space-2)',
  padding: '10px var(--ss-space-4) 4px',
});

const ItemPrompt = styled.div({
  label: 'item-prompt',
  flex: 1,
  fontSize: 13,
  lineHeight: 1.45,
  color: 'var(--ss-fg-primary)',
});

const ItemResponse = styled.div({
  label: 'item-response',
  padding: '4px var(--ss-space-4) 6px',
});

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ListCompletionPage() {
  const [selectedListId, setSelectedListId] = useState<string | null>('3');
  const [sheetMode, setSheetMode] = useState<'complete' | 'create' | null>('complete');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [itemStates, setItemStates] = useState<Record<string, Partial<ListItem>>>({});
  const [templateSelected, setTemplateSelected] = useState(false);
  const [dueValue, setDueValue] = useState<string | null>(null);
  const [assigneeSelected, setAssigneeSelected] = useState(false);
  const [customTitle, setCustomTitle] = useState('');

  const gridApiRef = useRef<GridApi<ListInstance> | null>(null);

  const filteredLists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MOCK_LISTS;
    return MOCK_LISTS.filter(l => l.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const selectedList = MOCK_LISTS.find(l => l.id === selectedListId) ?? null;

  const columnDefs = useMemo(() => ([
    { field: 'name', headerName: 'List name', flex: 2, cellRenderer: ListNameCell },
    {
      field: 'due', headerName: 'Due', flex: 1.5, cellRenderer: DueCell,
      comparator: dueDateComparator, sort: 'asc' as const,
    },
    { field: 'progress', headerName: 'Progress', flex: 1, cellRenderer: ProgressCell, sortable: false },
    { field: 'assignee', headerName: 'Assigned to', flex: 1.5, cellRenderer: AssigneeCell, sortable: false },
  ]), []);

  function selectGridRow(id: string | null) {
    const api = gridApiRef.current;
    if (!api) return;
    api.forEachNode(node => {
      node.setSelected(!!id && node.data?.id === id);
    });
  }

  function openList(id: string) {
    setSelectedListId(id);
    setSheetMode('complete');
  }

  function closeSheets() {
    setSheetMode(null);
    setSelectedListId(null);
    setSearchQuery('');
    selectGridRow(null);
  }

  function openCreate() {
    setSheetMode('create');
    setSelectedListId(null);
    selectGridRow(null);
  }

  // ── Item state merge + interactions ──
  const items = selectedListId === '3' ? MOCK_ITEMS : [];

  function merged(item: ListItem): ListItem {
    return { ...item, ...itemStates[item.id] };
  }

  function patchItem(id: string, patch: Partial<ListItem>) {
    setItemStates(s => ({ ...s, [id]: { ...s[id], ...patch } }));
  }

  function renderBanner(item: ListItem) {
    if (item.type === 'signature') return <IncompleteChip />;
    if (item.attribution) {
      return <AttributionBanner text={`${item.attribution.name} · ${item.attribution.completedAt}`} />;
    }
    if (item.type === 'checkmark' && item.assignedTo && !item.completed) {
      return <AssignmentBanner text={`Assigned to ${item.assignedTo}`} />;
    }
    return <IncompleteChip />;
  }

  function renderItem(raw: ListItem) {
    const item = merged(raw);

    if (item.type === 'subtitle') {
      const collapsed = !!collapsedSections[item.id];
      return (
        <div
          key={item.id}
          onClick={() => setCollapsedSections(s => ({ ...s, [item.id]: !s[item.id] }))}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px var(--ss-space-4)', cursor: 'pointer',
            backgroundColor: 'var(--ss-pale-blue)', borderBottom: '1px solid var(--ss-light-blue)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ss-dark-blue)' }}>{item.label}</span>
          <span style={{
            display: 'inline-flex', transition: 'transform 0.2s ease',
            transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            <ChevronDown size={10} strokeWidth={1.4} color="var(--ss-fg-tertiary)" />
          </span>
        </div>
      );
    }

    if (item.type === 'text') {
      return (
        <div key={item.id} style={{
          padding: '10px var(--ss-space-4)', fontSize: 13, lineHeight: 1.45,
          fontStyle: 'italic', color: 'var(--ss-fg-tertiary)',
          borderBottom: '1px solid var(--ss-grey-300)',
        }}>
          {item.label}
        </div>
      );
    }

    return (
      <ItemRow key={item.id}>
        <ItemMain>
          <ItemPrompt>{item.prompt}</ItemPrompt>
          <IconBtn aria-label="Item options" style={{ color: 'var(--ss-fg-tertiary)' }}>
            <MoreVertical size={16} strokeWidth={1.4} />
          </IconBtn>
        </ItemMain>

        {item.type === 'checkmark' && (
          <ItemResponse style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { if (!item.completed) patchItem(item.id, { completed: true, attribution: { name: 'You', completedAt: 'just now' } }); }}
              aria-label={item.completed ? 'Completed' : 'Mark complete'}
              style={{
                width: 34, height: 34, borderRadius: 'var(--ss-rd-pill)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: item.completed ? 'default' : 'pointer',
                border: item.completed ? '2px solid var(--ss-sky-blue)' : '2px solid var(--ss-grey-400)',
                backgroundColor: item.completed ? 'var(--ss-sky-blue)' : 'transparent',
                color: item.completed ? 'var(--ss-fg-on-dark)' : 'var(--ss-grey-400)',
              }}
            >
              <Check size={18} strokeWidth={2} />
            </button>
          </ItemResponse>
        )}

        {item.type === 'yes_no' && (
          <ItemResponse style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex' }}>
              {(['YES', 'NO'] as const).map((opt, i) => {
                const on = item.selectedOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => patchItem(item.id, { selectedOption: opt, attribution: { name: 'You', completedAt: 'just now' } })}
                    style={{
                      fontFamily: 'var(--ss-font-sans)', fontSize: 13, fontWeight: 700,
                      padding: '7px 16px', cursor: 'pointer',
                      border: '1.5px solid var(--ss-sky-blue)',
                      borderRight: i === 0 ? 'none' : '1.5px solid var(--ss-sky-blue)',
                      borderRadius: i === 0 ? 'var(--ss-rd-4) 0 0 var(--ss-rd-4)' : '0 var(--ss-rd-4) var(--ss-rd-4) 0',
                      backgroundColor: on ? 'var(--ss-sky-blue)' : 'var(--ss-bg-surface)',
                      color: on ? 'var(--ss-fg-on-dark)' : 'var(--ss-sky-blue)',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </ItemResponse>
        )}

        {item.type === 'free_response' && (
          <ItemResponse>
            <textarea
              value={item.response ?? ''}
              placeholder="Enter response..."
              onChange={e => {
                const v = e.target.value;
                patchItem(item.id, v
                  ? { response: v, attribution: { name: 'You', completedAt: 'just now' } }
                  : { response: '', attribution: undefined });
              }}
              style={{
                width: '100%', minHeight: 56, resize: 'vertical',
                padding: '7px 10px', fontSize: 13, fontFamily: 'var(--ss-font-sans)',
                color: 'var(--ss-fg-primary)', borderRadius: 'var(--ss-rd-4)',
                border: '1px solid var(--ss-border-default)', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'var(--ss-border-focus)';
                e.currentTarget.style.boxShadow = 'var(--ss-shadow-focus)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'var(--ss-border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </ItemResponse>
        )}

        {item.type === 'signature' && (
          <ItemResponse>
            <button style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 'var(--ss-space-2)', padding: 9, cursor: 'pointer',
              border: '1.5px solid var(--ss-sky-blue)', borderRadius: 'var(--ss-rd-4)',
              background: 'var(--ss-bg-surface)', color: 'var(--ss-sky-blue)',
              fontSize: 13, fontWeight: 700, fontFamily: 'var(--ss-font-sans)',
            }}>
              <PenLine size={14} strokeWidth={1.4} />
              Signature
            </button>
          </ItemResponse>
        )}

        <StateRow>{renderBanner(item)}</StateRow>
      </ItemRow>
    );
  }

  // collapse: hide items between a collapsed subtitle and the next subtitle
  function renderItems() {
    if (items.length === 0) {
      return (
        <div style={{ padding: 'var(--ss-space-8) var(--ss-space-4)', textAlign: 'center', fontSize: 13, color: 'var(--ss-fg-tertiary)' }}>
          No items to display
        </div>
      );
    }
    let sectionCollapsed = false;
    const out: React.ReactNode[] = [];
    for (const raw of items) {
      if (raw.type === 'subtitle') {
        sectionCollapsed = !!collapsedSections[raw.id];
        out.push(renderItem(raw));
      } else if (!sectionCollapsed) {
        out.push(renderItem(raw));
      }
    }
    return out;
  }

  // ── Metadata fields for the open list ──
  const now = new Date();
  const metaFields = selectedList ? [
    { Icon: Clock, label: 'Displayed', value: '10:09 AM' },
    { Icon: AlarmClock, label: 'Due by', value: selectedList.due ? formatRelative(selectedList.due, now, true) : 'No deadline' },
    { Icon: BellOff, label: 'Expires', value: selectedList.due ? formatRelative(selectedList.due, now, true) : '—' },
    ...(selectedListId === '3' ? [{ Icon: Trophy, label: 'Score', value: '7.5%' }] : []),
  ] : [];

  const allComplete = !!selectedList && selectedList.total > 0 && selectedList.completed === selectedList.total;

  const sheetOpen = sheetMode !== null;

  return (
    <PageRoot>
      {/* Toolbar */}
      <Toolbar>
        <FieldGroup>
          <FieldLabel>Template</FieldLabel>
          <FilterControl>
            <span>All templates</span>
            <ChevronDown size={14} strokeWidth={1.4} color="var(--ss-fg-tertiary)" />
          </FilterControl>
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>Location</FieldLabel>
          <FilterControl>
            <span>{MOCK_LOCATION}</span>
            <ChevronDown size={14} strokeWidth={1.4} color="var(--ss-fg-tertiary)" />
          </FilterControl>
        </FieldGroup>

        <SearchWrap>
          <Search size={16} strokeWidth={1.4} color="var(--ss-fg-tertiary)" />
          <SearchInput
            placeholder="Search lists"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </SearchWrap>
      </Toolbar>

      {/* Grid */}
      <GridWrapper className="ag-theme-alpine">
        <div style={{ height: '100%' }}>
          <AgGridReact<ListInstance>
            theme="legacy"
            rowData={filteredLists}
            columnDefs={columnDefs}
            getRowId={p => p.data.id}
            rowSelection={{ mode: 'singleRow', checkboxes: false, enableClickSelection: true }}
            suppressCellFocus
            onRowClicked={e => { if (e.data) openList(e.data.id); }}
            onGridReady={p => { gridApiRef.current = p.api; selectGridRow(selectedListId); }}
          />
        </div>
      </GridWrapper>

      {/* FAB */}
      <Fab onClick={openCreate} aria-label="Add list">
        <Plus size={26} strokeWidth={1.4} />
      </Fab>

      {/* Scrim */}
      {sheetOpen && <Scrim onClick={closeSheets} />}

      {/* Completion side sheet */}
      {sheetMode === 'complete' && selectedList && (
        <SideSheet>
          <div style={{
            height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 var(--ss-space-3) 0 var(--ss-space-4)', backgroundColor: 'var(--ss-sky-blue)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ss-fg-on-dark)' }}>{selectedList.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ss-space-1)', color: 'var(--ss-fg-on-dark)' }}>
              <IconBtn aria-label="List options"><MoreVertical size={18} strokeWidth={1.4} /></IconBtn>
              <IconBtn aria-label="Close" onClick={closeSheets}><X size={18} strokeWidth={1.4} /></IconBtn>
            </div>
          </div>

          {/* Assignee row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--ss-space-2)',
            padding: 'var(--ss-space-2) var(--ss-space-4)', borderBottom: '1px solid var(--ss-border-default)',
          }}>
            {selectedList.assignee ? (
              <>
                <Avatar size={26} color={PURPLE}>{selectedList.assignee.initials}</Avatar>
                <span style={{ fontSize: 12, color: 'var(--ss-fg-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ss-fg-primary)' }}>{selectedList.assignee.name}</span>
                </span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--ss-fg-tertiary)' }}>Unassigned</span>
            )}
          </div>

          {/* Metadata row */}
          <div style={{
            display: 'flex', padding: 'var(--ss-space-2) var(--ss-space-4)',
            borderBottom: '1px solid var(--ss-border-default)',
          }}>
            {metaFields.map((f, i) => (
              <div key={f.label} style={{
                flex: 1, paddingLeft: i === 0 ? 0 : 'var(--ss-space-3)',
                borderLeft: i === 0 ? 'none' : '1px solid var(--ss-grey-300)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <f.Icon size={11} strokeWidth={1.4} color="var(--ss-fg-tertiary)" />
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ss-fg-tertiary)' }}>{f.label}</span>
                </div>
                <div style={{ marginTop: 2, marginLeft: 15, fontSize: 12, fontWeight: 600, color: 'var(--ss-fg-primary)' }}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* Items */}
          <SheetBody>{renderItems()}</SheetBody>

          {/* Footer */}
          <SheetFooter>
            <span style={{ fontSize: 12, color: 'var(--ss-fg-secondary)' }}>
              <strong style={{ fontWeight: 700, color: 'var(--ss-fg-primary)' }}>{selectedList.completed}</strong>
              {` of ${selectedList.total} items complete`}
            </span>
            <PrimaryButton enabled={allComplete} disabled={!allComplete}>
              {allComplete ? 'Submit' : 'Submit Items'}
            </PrimaryButton>
          </SheetFooter>
        </SideSheet>
      )}

      {/* Create side sheet */}
      {sheetMode === 'create' && (
        <SideSheet>
          <div style={{
            height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 var(--ss-space-3) 0 var(--ss-space-4)', backgroundColor: 'var(--ss-dark-blue)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ss-fg-on-dark)' }}>Add list</span>
            <IconBtn aria-label="Close" onClick={closeSheets} style={{ color: 'var(--ss-fg-on-dark)' }}>
              <X size={18} strokeWidth={1.4} />
            </IconBtn>
          </div>

          <SheetBody style={{ padding: 'var(--ss-space-4) var(--ss-space-4) 0' }}>
            {/* List template (required) */}
            <div style={{ marginBottom: 'var(--ss-space-4)' }}>
              <CreateLabel required>List template</CreateLabel>
              <div
                onClick={() => setTemplateSelected(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', height: 42, padding: '0 14px', cursor: 'pointer',
                  border: '1.5px solid var(--ss-sky-blue)', borderRadius: 'var(--ss-rd-4)',
                  backgroundColor: 'var(--ss-bg-surface)',
                  color: templateSelected ? 'var(--ss-fg-primary)' : 'var(--ss-fg-tertiary)',
                  fontSize: 13, fontWeight: templateSelected ? 600 : 400,
                }}
              >
                {templateSelected ? 'Air BnB Cleanup List' : 'Select a template...'}
              </div>
            </div>

            {/* Custom title (optional) */}
            <div style={{ marginBottom: 'var(--ss-space-4)' }}>
              <CreateLabel optional>Custom title</CreateLabel>
              <input
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="Leave blank to use template name"
                style={{
                  width: '100%', height: 38, padding: '0 14px', boxSizing: 'border-box',
                  fontSize: 13, fontFamily: 'var(--ss-font-sans)', color: 'var(--ss-fg-primary)',
                  border: '1px solid var(--ss-border-default)', borderRadius: 'var(--ss-rd-4)', outline: 'none',
                }}
              />
            </div>

            <Hr />

            {/* Display time (required) */}
            <div style={{ marginBottom: 'var(--ss-space-4)' }}>
              <CreateLabel required>Display time</CreateLabel>
              <FilterControl style={{ width: '100%', minWidth: 0, height: 38 }}>
                <span>Display immediately</span>
                <ChevronDown size={14} strokeWidth={1.4} color="var(--ss-fg-tertiary)" />
              </FilterControl>
            </div>

            {/* Due */}
            <div style={{ marginBottom: 'var(--ss-space-4)' }}>
              <CreateLabel>Due</CreateLabel>
              <div
                onClick={() => setDueValue(v => (v ? null : 'Jul 8, 2026 · 10:09 AM'))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ss-space-2)',
                  width: '100%', height: 38, padding: '0 12px', boxSizing: 'border-box', cursor: 'pointer',
                  border: '1px solid var(--ss-border-default)', borderRadius: 'var(--ss-rd-4)',
                  backgroundColor: 'var(--ss-bg-surface)',
                  fontSize: 13, color: dueValue ? 'var(--ss-fg-primary)' : 'var(--ss-fg-tertiary)',
                  fontWeight: dueValue ? 600 : 400,
                }}
              >
                <span>{dueValue ?? 'No due time'}</span>
                {dueValue ? (
                  <button
                    onClick={e => { e.stopPropagation(); setDueValue(null); }}
                    aria-label="Clear due time"
                    style={{
                      width: 18, height: 18, borderRadius: 'var(--ss-rd-pill)', border: 'none', cursor: 'pointer',
                      backgroundColor: 'var(--ss-grey-400)', color: 'var(--ss-fg-on-dark)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <X size={11} strokeWidth={2} />
                  </button>
                ) : (
                  <Calendar size={14} strokeWidth={1.4} color="var(--ss-fg-tertiary)" />
                )}
              </div>
            </div>

            {/* Expiration (required, no clear) */}
            <div style={{ marginBottom: 'var(--ss-space-4)' }}>
              <CreateLabel required>Expiration</CreateLabel>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', height: 38, padding: '0 12px', boxSizing: 'border-box',
                border: '1px solid var(--ss-border-default)', borderRadius: 'var(--ss-rd-4)',
                backgroundColor: 'var(--ss-bg-surface)', fontSize: 13, fontWeight: 600, color: 'var(--ss-fg-primary)',
              }}>
                <span>Jun 30, 2026 · 9:05 PM</span>
                <Calendar size={14} strokeWidth={1.4} color="var(--ss-fg-tertiary)" />
              </div>
            </div>

            <Hr />

            {/* Assign to (optional) */}
            <div style={{ marginBottom: 'var(--ss-space-4)' }}>
              <CreateLabel optional>Assign to</CreateLabel>
              <div
                onClick={() => setAssigneeSelected(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--ss-space-2)',
                  width: '100%', minHeight: 38, padding: '0 12px', boxSizing: 'border-box', cursor: 'pointer',
                  border: '1px solid var(--ss-border-default)', borderRadius: 'var(--ss-rd-4)',
                  backgroundColor: 'var(--ss-bg-surface)',
                }}
              >
                {assigneeSelected ? (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--ss-space-2)' }}>
                      <Avatar size={22} color={PURPLE}>DT</Avatar>
                      <span style={{ fontSize: 13, color: 'var(--ss-fg-primary)' }}>Donna Teammember</span>
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); setAssigneeSelected(false); }}
                      aria-label="Clear assignee"
                      style={{
                        width: 18, height: 18, borderRadius: 'var(--ss-rd-pill)', border: 'none', cursor: 'pointer',
                        backgroundColor: 'var(--ss-grey-400)', color: 'var(--ss-fg-on-dark)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}
                    >
                      <X size={11} strokeWidth={2} />
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--ss-fg-tertiary)' }}>
                    Only people authorized for this template are shown
                  </span>
                )}
              </div>
            </div>
          </SheetBody>

          <SheetFooter style={{ justifyContent: 'flex-end', gap: 'var(--ss-space-2)' }}>
            <NeutralButton onClick={closeSheets}>Cancel</NeutralButton>
            <PrimaryButton enabled={templateSelected} disabled={!templateSelected}>Create</PrimaryButton>
          </SheetFooter>
        </SideSheet>
      )}
    </PageRoot>
  );
}

// ── Create form label ─────────────────────────────────────────────────────────
function CreateLabel({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label style={{
      display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 700, color: 'var(--ss-fg-secondary)',
    }}>
      {children}
      {required && <span style={{ color: 'var(--ss-danger)' }}> *</span>}
      {optional && <span style={{ fontWeight: 400, color: 'var(--ss-fg-tertiary)' }}> (optional)</span>}
    </label>
  );
}

const Hr = styled.hr({
  label: 'form-divider',
  border: 'none',
  borderTop: '1px solid var(--ss-grey-300)',
  margin: '4px 0 var(--ss-space-4)',
});
