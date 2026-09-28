export type FileType = 'PDF' | 'JPG' | 'PNG' | 'MP4' | 'XLSX' | 'DOCX' | 'URL' | 'Custom';

export type ViewAudience = 'everyone' | 'roles' | 'people';

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
  url?: string;
  content?: string;
  audience: ViewAudience;
  roles: RoleAccess[];
  allowDownload: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export const FILE_TYPES: FileType[] = ['PDF', 'JPG', 'PNG', 'MP4', 'XLSX', 'DOCX', 'URL', 'Custom'];

export const OFFICE_TYPES: FileType[] = ['XLSX', 'DOCX'];

export function defaultRoles(): RoleAccess[] {
  return [
    { id: 'gm', name: 'General manager', initials: 'GM', enabled: true },
    { id: 'sl', name: 'Shift lead', initials: 'SL', enabled: true },
    { id: 'tm', name: 'Team member', initials: 'TM', enabled: true },
    { id: 'ct', name: 'Contractor', initials: 'CT', enabled: false },
  ];
}

export function roleNote(enabled: boolean, allowDownload: boolean) {
  if (!enabled) return 'No access';
  return allowDownload ? 'Can view and download' : 'Can view';
}

export function formatUpdated(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
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
      { id: 'sub-handbooks', name: 'Handbooks' },
      { id: 'sub-policies', name: 'Policies' },
    ],
  },
  {
    id: 'cat-quick',
    name: 'Quick start guides',
    subcategories: [
      { id: 'sub-onboarding', name: 'Onboarding' },
      { id: 'sub-equipment', name: 'Equipment' },
    ],
  },
  {
    id: 'cat-ops',
    name: 'Operations',
    subcategories: [
      { id: 'sub-sheets', name: 'Spreadsheets' },
      { id: 'sub-checks', name: 'Checklists' },
    ],
  },
];

function seedFile(partial: Omit<LibraryFile, 'audience' | 'roles' | 'allowDownload'> & Partial<Pick<LibraryFile, 'audience' | 'roles' | 'allowDownload'>>): LibraryFile {
  return {
    audience: 'everyone',
    roles: defaultRoles(),
    allowDownload: true,
    ...partial,
  };
}

export const SEED_FILES: LibraryFile[] = [
  seedFile({
    id: 'file-handbook',
    name: 'Employee handbook 2026',
    type: 'PDF',
    categoryId: 'cat-corporate',
    subcategoryId: 'sub-handbooks',
    updated: '2026-09-12',
    audience: 'roles',
  }),
  seedFile({
    id: 'file-onboarding',
    name: 'Manager onboarding guide',
    type: 'PDF',
    categoryId: 'cat-corporate',
    subcategoryId: 'sub-handbooks',
    updated: '2026-08-02',
  }),
  seedFile({
    id: 'file-culture',
    name: 'Culture & values summary',
    type: 'Custom',
    categoryId: 'cat-corporate',
    subcategoryId: 'sub-handbooks',
    updated: '2026-07-09',
    content: 'We train before we rush. Shift leads own the floor. Escalate safety issues before serving guests.',
  }),
  seedFile({
    id: 'file-safety',
    name: 'Food safety policy',
    type: 'PDF',
    categoryId: 'cat-corporate',
    subcategoryId: 'sub-policies',
    updated: '2026-06-18',
  }),
  seedFile({
    id: 'file-brand',
    name: 'Brand asset portal',
    type: 'URL',
    categoryId: 'cat-corporate',
    subcategoryId: 'sub-policies',
    updated: '2026-07-30',
    url: 'https://example.com/brand',
  }),
  seedFile({
    id: 'file-frontage',
    name: 'Store frontage photo',
    type: 'JPG',
    categoryId: 'cat-quick',
    subcategoryId: 'sub-onboarding',
    updated: '2026-09-08',
  }),
  seedFile({
    id: 'file-pos',
    name: 'POS register walkthrough',
    type: 'MP4',
    categoryId: 'cat-quick',
    subcategoryId: 'sub-equipment',
    updated: '2026-08-28',
  }),
  seedFile({
    id: 'file-inventory',
    name: 'Weekly inventory template',
    type: 'XLSX',
    categoryId: 'cat-ops',
    subcategoryId: 'sub-sheets',
    updated: '2026-08-14',
  }),
  seedFile({
    id: 'file-closing',
    name: 'Closing checklist',
    type: 'DOCX',
    categoryId: 'cat-ops',
    subcategoryId: 'sub-checks',
    updated: '2026-08-01',
  }),
  seedFile({
    id: 'file-opening',
    name: 'Opening checklist notes',
    type: 'Custom',
    categoryId: 'cat-ops',
    subcategoryId: 'sub-checks',
    updated: '2026-07-22',
    content: 'Before unlock\n\nConfirm overnight temp logs are complete.\nCheck lobby lights and the open sign.\nVerify the safe count with dual control.\n\nEscalate issues to the shift lead before serving guests.',
  }),
];
