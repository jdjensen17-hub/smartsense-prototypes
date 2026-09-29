export type FileType = 'PDF' | 'JPG' | 'PNG' | 'MP4' | 'XLSX' | 'DOCX' | 'Custom';

export type ViewAudience = 'everyone' | 'roles';

export interface RoleAccess {
  id: string;
  name: string;
  initials: string;
  enabled: boolean;
}

export interface LibraryFile {
  id: string;
  name: string;
  type: FileType;
  categoryId: string;
  subcategoryId: string;
  updated: string;
  content?: string;
  size: number;
}

export interface Subcategory {
  id: string;
  name: string;
  audience: ViewAudience;
  roles: RoleAccess[];
  scopeId: string;
}

export function emptySubcategory(id: string, name: string): Subcategory {
  return { id, name, audience: 'everyone', roles: defaultRoles(), scopeId: 't_root' };
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export const FILE_TYPES: FileType[] = ['PDF', 'JPG', 'PNG', 'MP4', 'XLSX', 'DOCX', 'Custom'];

export const OFFICE_TYPES: FileType[] = ['XLSX', 'DOCX'];

export function defaultRoles(): RoleAccess[] {
  return [
    { id: 'gm', name: 'General manager', initials: 'GM', enabled: true },
    { id: 'sl', name: 'Shift lead', initials: 'SL', enabled: true },
    { id: 'tm', name: 'Team member', initials: 'TM', enabled: true },
    { id: 'ct', name: 'Contractor', initials: 'CT', enabled: false },
  ];
}

export function roleNote(enabled: boolean) {
  return enabled ? 'Can view' : 'No access';
}

export function formatUpdated(iso: string) {
  const [datePart, timePart] = iso.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour = 0, minute = 0] = (timePart ?? '00:00').split(':').map(Number);
  const dateLabel = new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const hour12 = hour % 12 || 12;
  const minuteLabel = String(minute).padStart(2, '0');
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${dateLabel}, ${hour12}:${minuteLabel}${suffix} EST`;
}

export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}T${hour}:${minute}`;
}

export function typeFromFileName(name: string): FileType | null {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'PDF';
    case 'jpg':
    case 'jpeg': return 'JPG';
    case 'png': return 'PNG';
    case 'mp4': return 'MP4';
    case 'xlsx': return 'XLSX';
    case 'docx': return 'DOCX';
    default: return null;
  }
}

export function textBytes(content: string) {
  return new TextEncoder().encode(content).length;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-corporate',
    name: 'Corporate best practices',
    subcategories: [
      emptySubcategory('sub-handbooks', 'Handbooks'),
      emptySubcategory('sub-policies', 'Policies'),
    ],
  },
  {
    id: 'cat-quick',
    name: 'Quick start guides',
    subcategories: [
      emptySubcategory('sub-onboarding', 'Onboarding'),
      emptySubcategory('sub-equipment', 'Equipment'),
    ],
  },
  {
    id: 'cat-ops',
    name: 'Operations',
    subcategories: [
      emptySubcategory('sub-sheets', 'Spreadsheets'),
      emptySubcategory('sub-checks', 'Checklists'),
    ],
  },
];

function seedFile(partial: Omit<LibraryFile, 'size'> & { size?: number }): LibraryFile {
  return {
    ...partial,
    size: partial.type === 'Custom' ? textBytes(partial.content ?? '') : (partial.size ?? 0),
  };
}

export const SEED_FILES: LibraryFile[] = [
  seedFile({
    id: 'file-handbook',
    name: 'Employee handbook 2026',
    type: 'PDF',
    categoryId: 'cat-corporate',
    subcategoryId: 'sub-handbooks',
    updated: '2026-09-12T09:14',
    size: 2_516_582,
  }),
  seedFile({
    id: 'file-onboarding',
    name: 'Manager onboarding guide',
    type: 'PDF',
    categoryId: 'cat-corporate',
    subcategoryId: 'sub-handbooks',
    updated: '2026-08-02T15:40',
    size: 911_360,
  }),
  seedFile({
    id: 'file-culture',
    name: 'Culture & values summary',
    type: 'Custom',
    categoryId: 'cat-corporate',
    subcategoryId: 'sub-handbooks',
    updated: '2026-07-09T11:05',
    content: 'We train before we rush. Shift leads own the floor. Escalate safety issues before serving guests.',
  }),
  seedFile({
    id: 'file-safety',
    name: 'Food safety policy',
    type: 'PDF',
    categoryId: 'cat-corporate',
    subcategoryId: 'sub-policies',
    updated: '2026-06-18T08:22',
    size: 430_080,
  }),
  seedFile({
    id: 'file-frontage',
    name: 'Store frontage photo',
    type: 'JPG',
    categoryId: 'cat-quick',
    subcategoryId: 'sub-onboarding',
    updated: '2026-09-08T13:27',
    size: 3_250_944,
  }),
  seedFile({
    id: 'file-pos',
    name: 'POS register walkthrough',
    type: 'MP4',
    categoryId: 'cat-quick',
    subcategoryId: 'sub-equipment',
    updated: '2026-08-28T10:03',
    size: 50_331_648,
  }),
  seedFile({
    id: 'file-inventory',
    name: 'Weekly inventory template',
    type: 'XLSX',
    categoryId: 'cat-ops',
    subcategoryId: 'sub-sheets',
    updated: '2026-08-14T14:16',
    size: 88_064,
  }),
  seedFile({
    id: 'file-closing',
    name: 'Closing checklist',
    type: 'DOCX',
    categoryId: 'cat-ops',
    subcategoryId: 'sub-checks',
    updated: '2026-08-01T17:55',
    size: 55_296,
  }),
  seedFile({
    id: 'file-opening',
    name: 'Opening checklist notes',
    type: 'Custom',
    categoryId: 'cat-ops',
    subcategoryId: 'sub-checks',
    updated: '2026-07-22T06:41',
    content: 'Before unlock\n\nConfirm overnight temp logs are complete.\nCheck lobby lights and the open sign.\nVerify the safe count with dual control.\n\nEscalate issues to the shift lead before serving guests.',
  }),
];
